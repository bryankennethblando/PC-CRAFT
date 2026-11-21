import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createPool, loadConfig, one, transaction } from '../config/db.js';
import { content } from '../controllers/admin.controller.js';
import { id, object } from '../http.js';

const seeds = new URL('../../database/seeds/', import.meta.url);
const lessonCounts = [3, 4, 5, 4, 4, 5];
const quizBody = object(content.quizzes.shape);

export function parseCurriculum(source, quizBank) {
  const sections = source.replaceAll('\r\n', '\n').split(/^## /m);
  const modules = sections.filter(section => /^\d+\. Module \d{2}: /.test(section));
  assert.equal(modules.length, lessonCounts.length, 'The curriculum must have six module sections.');
  assert.equal(Object.keys(quizBank).length, modules.length, 'The quiz bank must cover all six modules.');

  return modules.map((section, moduleIndex) => {
    const number = String(moduleIndex + 1).padStart(2, '0');
    const [heading, ...lessonSections] = section.split(/^### Lesson /m);
    const title = heading.match(new RegExp(`^\\d+\\. Module ${number}: (.+)`))?.[1];
    assert(title && title.length <= 200, `Invalid title for module ${number}.`);
    assert.equal(lessonSections.length, lessonCounts[moduleIndex], `Unexpected lesson count for module ${number}.`);
    const lessons = lessonSections.map((lesson, lessonIndex) => {
      const lessonNumber = `${number}.${lessonIndex + 1}`;
      const [lessonHeading, ...bodyLines] = lesson.trimEnd().replace(/\n\n---$/, '').split('\n');
      const firstBlank = bodyLines.indexOf('');
      assert(firstBlank >= 0, `Missing lesson body for ${lessonNumber}.`);
      const metadata = bodyLines.slice(0, firstBlank).join('\n');
      const prefix = `${lessonNumber} · `;
      const title = lessonHeading.startsWith(prefix) ? lessonHeading.slice(prefix.length) : '';
      const learning_objective = metadata.match(/^\* \*\*Learning Objective\*\*: (.+)$/m)?.[1] ?? null;
      const reading_minutes = Number(metadata.match(/^\* \*\*Reading Time\*\*: `([1-9]\d*) minutes?`$/m)?.[1]);
      assert(title && title.length <= 200 && (learning_objective?.length ?? 0) <= 1000 && reading_minutes <= 65535,
        `Invalid heading or metadata for lesson ${lessonNumber}.`);
      const extra = metadata.split('\n').filter(line => !/^\* \*\*(Module|Learning Objective|Reading Time)\*\*: /.test(line));
      const content = [extra.join('\n'), bodyLines.slice(firstBlank + 1).join('\n')].filter(Boolean).join('\n\n')
        .replace(/^#### /gm, '## ');
      assert.match(content, /^## Quick Self-Check$/m, `Missing practice in lesson ${lessonNumber}.`);
      return {
        source_key: `pc-craft-lesson-${lessonNumber}`,
        title, learning_objective, reading_minutes, content, sort_order: lessonIndex + 1,
      };
    });

    const bank = quizBank[number];
    assert(bank?.summary && bank.questions.length === 3, `Invalid quiz bank entry for module ${number}.`);
    const { questions, ...quiz } = quizBody.parse({
      title: `${title} Quiz`,
      instructions: 'Choose one answer per question. Answer at least two of three correctly to pass.',
      pass_mark: 66,
      questions: bank.questions.map(({ prompt, choices, answer }) => ({
        question_text: prompt,
        choices: choices.map((choice_text, index) => ({ choice_text, is_correct: index === answer })),
      })),
    });
    return {
      source_key: `pc-craft-module-${number}`,
      title, summary: bank.summary, sort_order: moduleIndex + 1, lessons,
      quiz: { ...quiz, source_key: `pc-craft-quiz-${number}`, questions },
    };
  });
}

export async function readCurriculum() {
  const [source, quizBank] = await Promise.all([
    readFile(new URL('module.md', seeds), 'utf8'),
    readFile(new URL('curriculum-quizzes.json', seeds), 'utf8'),
  ]);
  return parseCurriculum(source, JSON.parse(quizBank));
}

async function insertNew(db, table, fields) {
  const columns = Object.keys(fields);
  try {
    await db.execute(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      Object.values(fields));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return null;
    throw error;
  }
  return (await one(db, 'SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id')).id;
}

export async function importCurriculum(pool, creatorId, modules) {
  return transaction(pool, async db => {
    const actor = await one(db, `SELECT user_id FROM users WHERE user_id = ? AND account_status = 'active'
      AND role IN ('admin', 'super_admin') FOR SHARE`, [creatorId]);
    assert(actor, 'Supply the user ID of an active admin or super admin.');

    const inserted = { modules: 0, lessons: 0, quizzes: 0, questions: 0, choices: 0 };
    for (const { lessons, quiz, ...module } of modules) {
      const created_by = actor.user_id;
      const status = 'published';
      const newModule = await insertNew(db, 'modules', { ...module, status, created_by, published_at: new Date() });
      if (newModule) inserted.modules += 1;
      const module_id = newModule ?? (await one(db,
        'SELECT module_id FROM modules WHERE source_key = ? FOR SHARE', [module.source_key])).module_id;
      for (const lesson of lessons) {
        if (await insertNew(db, 'lessons', { ...lesson, module_id, status })) inserted.lessons += 1;
      }
      const { questions, ...quizFields } = quiz;
      const quizId = await insertNew(db, 'quizzes', { ...quizFields, module_id, status, created_by });
      if (quizId) {
        await content.quizzes.saveChildren(db, quizId, { questions });
        inserted.quizzes += 1;
        inserted.questions += questions.length;
        inserted.choices += questions.reduce((count, question) => count + question.choices.length, 0);
      }
    }
    return inserted;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const creator = id.safeParse(process.argv[2]);
  if (!creator.success || process.argv.length !== 3) {
    console.error('Usage: npm --prefix server run import:curriculum -- ADMIN_USER_ID');
    process.exitCode = 1;
  } else {
    try {
      const modules = await readCurriculum();
      const pool = createPool(loadConfig().database);
      try {
        const inserted = await importCurriculum(pool, creator.data, modules);
        console.log('Curriculum records inserted', inserted);
      } finally {
        await pool.end();
      }
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
