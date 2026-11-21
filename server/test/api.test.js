import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import mysql from 'mysql2/promise';
import { createPool, one } from '../config/db.js';
import { importCurriculum, readCurriculum } from '../scripts/import-curriculum.js';
import { createApp } from '../server.js';

test('PC-CRAFT API against a fresh MySQL database', async t => {
  assert.match(process.env.TEST_DB_PORT ?? '', /^\d+$/, 'Set TEST_DB_PORT to an isolated MySQL instance.');
  const options = {
    host: '127.0.0.1', port: Number(process.env.TEST_DB_PORT),
    user: process.env.TEST_DB_USER ?? 'root', password: process.env.TEST_DB_PASSWORD ?? '',
  };
  const name = 'pc_craft_test_' + randomUUID().replaceAll('-', '');
  const setup = await mysql.createConnection({ ...options, multipleStatements: true });
  let pool, server;
  t.after(async () => {
    if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (pool) await pool.end();
    try {
      await setup.query(`DROP DATABASE IF EXISTS \`${name}\``);
    } finally {
      await setup.end();
    }
  });
  await setup.query(`CREATE DATABASE \`${name}\``);
  await setup.changeUser({ database: name });
  const migrations = new URL('../../database/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter(file => file.endsWith('.sql')).sort()) {
    await setup.query(await readFile(new URL(file, migrations), 'utf8'));
  }
  pool = createPool({ ...options, database: name });
  const origin = 'http://localhost:3000';
  server = createApp(pool, origin).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;

  async function request(method, path, status, token, body, headers = {}) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const value = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(value)}`);
    assert.equal(value.ok, status < 400);
    if (!value.ok) assert.deepEqual(Object.keys(value.error).sort(), ['code', 'message']);
    return { ...value, headers: response.headers };
  }
  const credentials = name => ({ email: `${name}@example.invalid`, password: 'test-fixture-password' });
  async function register(name) {
    return (await request('POST', '/auth/register', 201, null, {
      ...credentials(name), first_name: name, last_name: 'Example',
    })).data;
  }
  async function login(name) {
    return (await request('POST', '/auth/login', 200, null, credentials(name))).data.token;
  }
  const get = (path, token, status = 200) => request('GET', path, status, token);
  const post = (path, token, body, status = 201) => request('POST', path, status, token, body);
  const put = (path, token, body, status = 200) => request('PUT', path, status, token, body);
  const patch = (path, token, body, status = 200) => request('PATCH', path, status, token, body);

  await request('GET', '/health', 200, null, undefined, { Origin: 'https://other.example' }).then(result =>
    assert.equal(result.headers.get('access-control-allow-origin'), null));
  await request('GET', '/health', 200, null, undefined, { Origin: origin }).then(result =>
    assert.equal(result.headers.get('access-control-allow-origin'), origin));
  await get('/auth/me', null, 401);
  const unsupported = await fetch(base + '/auth/register', { method: 'POST', body: 'not JSON' });
  assert.equal(unsupported.status, 415);
  await post('/auth/register', null, {
    ...credentials('injected'), first_name: 'Test', last_name: 'Example', role: 'super_admin',
  }, 400);
  await post('/auth/login', null, credentials('missing'), 401);

  const learnerUser = await register('learner');
  assert.equal(learnerUser.role, 'learner');
  assert.equal(typeof learnerUser.user_id, 'string');
  assert.equal(Object.hasOwn(learnerUser, 'password_hash'), false);
  await register('other');
  const adminUser = await register('admin');
  const superUser = await register('super');
  await pool.execute("UPDATE users SET role = 'admin' WHERE user_id = ?", [adminUser.user_id]);
  await pool.execute("UPDATE users SET role = 'super_admin' WHERE user_id = ?", [superUser.user_id]);
  const learner = await login('learner');
  const other = await login('other');
  const admin = await login('admin');
  const superAdmin = await login('super');
  assert.deepEqual((await get('/auth/me', learner)).data, learnerUser);
  assert.equal((await one(pool, 'SELECT COUNT(*) AS count FROM user_sessions WHERE token_hash = ?', [learner])).count, '0');
  await get('/admin/dashboard', learner, 403);
  await get('/admin/dashboard', admin);
  await get('/admin/logs', admin, 403);
  await get('/admin/feedback', admin, 403);
  await get('/admin/logs', superAdmin);
  assert.equal((await get(`/admin/users/${learnerUser.user_id}/activity`, admin)).data.online, true);

  await get('/modules?role=admin', learner, 400);
  await get('/modules/%ff', learner, 400);
  const { module_id } = (await post('/admin/modules', admin, { title: 'Hardware basics' })).data;
  const { lesson_id } = (await post('/admin/lessons', admin, {
    module_id, title: 'Components', content: '    Start with the motherboard.\n',
    reading_minutes: 5, learning_objective: 'Identify the motherboard.',
  })).data;
  await get(`/modules/${module_id}`, learner, 404);
  await patch(`/admin/lessons/${lesson_id}/status`, admin, { status: 'published' }, 409);
  await patch(`/admin/modules/${module_id}/status`, admin, { status: 'published' });
  await patch(`/admin/lessons/${lesson_id}/status`, admin, { status: 'published' });
  assert.deepEqual((await get('/modules?limit=1', learner)).meta, { page: 1, limit: 1, has_more: false });
  const lessonPath = `/modules/lessons/${lesson_id}`;
  const lesson = (await get(lessonPath, learner)).data;
  assert.equal(lesson.lesson_id, lesson_id);
  assert.equal(lesson.content, '    Start with the motherboard.\n');
  assert.equal(lesson.learning_objective, 'Identify the motherboard.');
  assert.equal(lesson.reading_minutes, 5);
  assert.equal((await get('/progress', learner)).data.next_lesson.reading_minutes, 5);
  assert.equal((await get('/progress/lessons', learner)).data[0].reading_minutes, 5);
  await put(`/progress/lessons/${lesson_id}`, learner, { status: 'completed' });
  await put(`/progress/lessons/${lesson_id}`, learner, { status: 'in_progress' });
  assert.equal((await get('/progress', learner)).data.completed_count, 1);
  assert.equal((await get('/progress', other)).data.completed_count, 0);
  await get('/progress?user_id=1', other, 400);
  await patch(`/admin/modules/${module_id}/status`, superAdmin, { status: 'draft' });
  await get(lessonPath, learner, 404);
  const hiddenLesson = (await get('/progress/lessons', learner)).data[0];
  assert.equal(hiddenLesson.available, false);
  assert.equal(hiddenLesson.title, 'Unavailable lesson');
  assert.equal(hiddenLesson.reading_minutes, null);
  assert.equal(hiddenLesson.status, 'completed');
  assert.deepEqual((await get('/progress/lessons', other)).data, []);
  await put(`/admin/modules/${module_id}`, admin, { title: 'Hardware fundamentals' });
  await patch(`/admin/lessons/${lesson_id}/status`, admin, { status: 'draft' });
  await put(`/admin/lessons/${lesson_id}`, admin, { title: 'Components', content: 'Revised lesson.' });
  await patch(`/admin/modules/${module_id}/status`, admin, { status: 'published' });
  await get(lessonPath, learner, 404);
  await patch(`/admin/lessons/${lesson_id}/status`, admin, { status: 'published' });
  assert.equal((await get(lessonPath, learner)).data.content, 'Revised lesson.');
  assert.equal((await get('/progress', learner)).data.completed_count, 1);
  assert.equal((await get('/progress/lessons', learner)).data[0].available, true);

  const choiceSet = [
    { choice_text: 'Correct', is_correct: true },
    { choice_text: 'Incorrect', is_correct: false },
  ];
  const quizDraft = {
    module_id, title: 'Quick check', instructions: 'Pick one answer.', pass_mark: 80, questions: [
      { question_text: 'Question one', points: 0.1, choices: [...choiceSet,
        { choice_text: 'Retired answer', is_correct: true, status: 'archived' }] },
      { question_text: 'Question two', points: 0.2, choices: choiceSet },
      { question_text: 'Future question', status: 'draft' },
    ],
  };
  const { data: quiz } = await post('/admin/quizzes', admin, quizDraft);
  const quizPath = `/quizzes/${quiz.quiz_id}`;
  const adminQuizPath = `/admin/quizzes/${quiz.quiz_id}`;
  const { title, instructions, pass_mark, questions } = quizDraft;
  await put(adminQuizPath, learner, { title }, 403);
  await put(adminQuizPath, admin, { title, questions: [{ question_text: 'Draft only', status: 'draft' }] });
  await patch(`${adminQuizPath}/status`, admin, { status: 'published' }, 409);
  await put(adminQuizPath, admin, { title, instructions, pass_mark, questions });
  const { data: draft } = await get(adminQuizPath, admin);
  assert.equal(draft.has_attempts, false);
  assert.equal(draft.questions.length, 3);
  assert.equal(draft.questions[0].choices[2].status, 'archived');
  await patch(`${adminQuizPath}/status`, admin, { status: 'published' });
  assert.equal((await get(`/quizzes?module_id=${module_id}`, learner)).data.length, 1);
  assert.deepEqual((await get('/quizzes?module_id=999999999', learner)).data, []);
  const quizView = (await get(quizPath, learner)).data;
  assert.equal(JSON.stringify(quizView).includes('is_correct'), false);
  assert.equal(quizView.questions.length, 2);
  const [first, second] = quizView.questions;
  assert.equal(first.choices.length, 2);
  const attempt = (await post(quizPath + '/attempts', learner)).data;
  const attemptPath = `/quizzes/attempts/${attempt.attempt_id}`;
  const answers = [
    { question_id: first.question_id, selected_choice_id: first.choices[0].choice_id },
    { question_id: second.question_id, selected_choice_id: second.choices[1].choice_id },
  ];
  const openAttempt = (await get(attemptPath, learner)).data;
  assert.equal(openAttempt.quiz_title, quizDraft.title);
  assert.equal(openAttempt.instructions, quizDraft.instructions);
  assert.equal(openAttempt.answers, undefined);
  assert.equal(JSON.stringify(openAttempt).includes('is_correct'), false);
  assert.equal((await get('/quizzes/attempts', learner)).data[0].quiz_title, quizDraft.title);
  await get(attemptPath, other, 404);
  await post(attemptPath + '/submit', other, { answers }, 404);
  await post(attemptPath + '/submit', learner, { answers, score: 100 }, 400);
  await post(attemptPath + '/submit', learner, {
    answers: [{ question_id: first.question_id, selected_choice_id: second.choices[0].choice_id }],
  }, 400);
  await patch(`${adminQuizPath}/status`, admin, { status: 'draft' });
  assert.equal((await get(adminQuizPath, admin)).data.has_attempts, true);
  await put(adminQuizPath, admin, { title: 'Cannot replace used quiz' }, 409);
  await post(quizPath + '/attempts', learner, undefined, 404);
  await patch(`${adminQuizPath}/status`, admin, { status: 'archived' });
  await get(quizPath, learner, 404);

  await setup.query(`
    CREATE TRIGGER rollback_fixture BEFORE INSERT ON quiz_answers FOR EACH ROW
    BEGIN
      IF NEW.question_id = ${second.question_id} THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'forced rollback fixture';
      END IF;
    END`);
  try {
    const failure = await post(attemptPath + '/submit', learner, { answers }, 500);
    assert.equal(failure.error.message, 'Internal server error.');
    assert.equal((await one(pool, 'SELECT COUNT(*) AS count FROM quiz_answers WHERE attempt_id = ?', [attempt.attempt_id])).count, '0');
    assert.equal((await get(attemptPath, learner)).data.submitted_at, null);
  } finally {
    await setup.query('DROP TRIGGER rollback_fixture');
  }
  const result = (await post(attemptPath + '/submit', learner, { answers }, 200)).data;
  assert.equal(result.score, '0.10');
  assert.equal(result.max_score, '0.30');
  assert.equal(result.passed, 0);
  const submittedAttempt = (await get(attemptPath, learner)).data;
  assert.equal(submittedAttempt.answers[0].is_correct, 1);
  assert.equal(submittedAttempt.answers[1].correct_choice_id, second.choices[0].choice_id);
  await post(attemptPath + '/submit', learner, { answers }, 409);

  const build_state = { version: 1, parts: [
    { slot: 'case', part_id: 'case-atx' }, { slot: 'motherboard', part_id: 'board-am5' },
    { slot: 'cpu', part_id: 'cpu-am4' }, { slot: 'memory', part_id: 'ram-ddr5' },
  ] };
  const assembly = (await post('/simulation/attempts', learner, { mode: 'assembly', build_state })).data;
  const assemblyPath = `/simulation/attempts/${assembly.assembly_attempt_id}`;
  assert.deepEqual(assembly.build_state_json, build_state);
  assert.equal(assembly.compatibility_status, 'incompatible');
  await get(assemblyPath, other, 404);
  await put(assemblyPath, learner, { build_state, status: 'completed' }, 409);
  build_state.parts[2].part_id = 'cpu-am5';
  assert.equal((await put(assemblyPath, learner, { build_state, status: 'completed' })).data.compatibility_status, 'compatible');

  const scenario = (await post('/admin/scenarios', admin, {
    name: 'Loose memory', scenario_type: 'troubleshooting', steps: [{
      prompt: 'Inspect the part', action_type: 'inspect', expected_action: 'ram',
      feedback_correct: 'Correct', feedback_incorrect: 'Try memory',
      configuration_json: { actions: [{ id: 'ram', label: 'Inspect memory' }, { id: 'cpu', label: 'Inspect CPU' }] },
    }],
  })).data;
  await patch(`/admin/scenarios/${scenario.scenario_id}/status`, admin, { status: 'published' });
  const scenarioPath = `/troubleshooting/scenarios/${scenario.scenario_id}`;
  const scenarioView = (await get(scenarioPath, learner)).data;
  assert.equal(Object.hasOwn(scenarioView.steps[0], 'expected_action'), false);
  const trouble = (await post(scenarioPath + '/attempts', learner)).data;
  const troublePath = `/troubleshooting/attempts/${trouble.attempt_id}`;
  await get(troublePath, other, 404);
  const response = (await post(troublePath + '/responses', learner, {
    step_id: scenarioView.steps[0].step_id, chosen_action: 'ram',
  }, 200)).data;
  assert.equal((await get(troublePath, learner)).data.steps[0].feedback, 'Correct');
  assert.equal(response.attempt.score, '1.00');

  const item = (await post('/feedback', learner, { category: 'lesson', message: 'A test comment.', rating: 4 })).data;
  await patch(`/admin/feedback/${item.feedback_id}`, admin, { status: 'resolved' }, 403);
  const reviewed = (await patch(`/admin/feedback/${item.feedback_id}`, superAdmin, { status: 'resolved' })).data;
  assert.equal(reviewed.reviewed_by, superUser.user_id);
  assert.notEqual(reviewed.resolved_at, null);

  const curriculum = await readCurriculum();
  await assert.rejects(importCurriculum(pool, learnerUser.user_id, curriculum), /active admin/);
  assert.deepEqual(await importCurriculum(pool, adminUser.user_id, curriculum),
    { modules: 6, lessons: 25, quizzes: 6, questions: 18, choices: 54 });
  const importedLesson = await one(pool, 'SELECT lesson_id FROM lessons WHERE source_key = ?', ['pc-craft-lesson-01.1']);
  const importedPath = `/admin/lessons/${importedLesson.lesson_id}`;
  await patch(`${importedPath}/status`, admin, { status: 'draft' });
  await put(importedPath, admin, { title: 'Admin-edited lesson', content: 'New body.' });
  assert.deepEqual(await importCurriculum(pool, adminUser.user_id, curriculum),
    { modules: 0, lessons: 0, quizzes: 0, questions: 0, choices: 0 });
  const kept = (await get(importedPath, admin)).data;
  assert.equal(kept.content, 'New body.');
  assert.equal(kept.status, 'draft');
  await get(`/modules/lessons/${importedLesson.lesson_id}`, learner, 404);

  await post('/auth/logout', learner, undefined, 200);
  await get('/auth/me', learner, 401);
  assert.equal((await get(`/admin/users/${learnerUser.user_id}/activity`, admin)).data.online, false);
});
