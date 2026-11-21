import { z } from 'zod';
import { one, transaction } from '../config/db.js';
import { conflict, contentStatus, id, log, object, requireRow, sortOrder, text } from '../http.js';
import { cents } from './quiz.controller.js';

const nullableText = max => text(max).nullable().default(null);
const amount = (min, max) => z.number().min(min).max(max).refine(n => Math.abs(n * 100 - cents(n)) < 0.000001);
const published = row => row.status === 'published';
const validChoices = choices => choices.length >= 2 && choices.length <= 10 &&
  choices.filter(choice => Boolean(choice.is_correct)).length === 1;
const question = object({
  question_text: text(5000), points: amount(0.01, 99999.99).default(1),
  status: contentStatus.default('published'),
  choices: z.array(object({
    choice_text: text(1000), is_correct: z.boolean(), status: contentStatus.default('published'),
  })).max(10).default([]),
}).refine(row => !published(row) || validChoices(row.choices.filter(published)), {
  path: ['choices'], message: 'A published question needs at least two published choices and one correct published choice.',
});
const action = text(120);
const step = object({
  prompt: text(5000), action_type: text(60), expected_action: action,
  feedback_correct: text(5000), feedback_incorrect: text(5000),
  configuration_json: object({
    component: text(120).optional(),
    actions: z.array(object({ id: action, label: text(200) })).min(1).max(20),
  }),
}).refine(({ configuration_json, expected_action }) => {
  const actions = configuration_json.actions.map(item => item.id);
  return new Set(actions).size === actions.length && actions.includes(expected_action);
});

export const content = {
  modules: {
    table: 'modules', key: 'module_id', columns: ['title', 'summary', 'sort_order'], creator: true,
    shape: { title: text(200), summary: nullableText(10000), sort_order: sortOrder.default(0) },
  },
  lessons: {
    table: 'lessons', key: 'lesson_id',
    columns: ['title', 'content', 'sort_order', 'learning_objective', 'reading_minutes'], parent: true,
    shape: {
      title: text(200), content: z.string().max(50000).refine(value => value.trim().length > 0),
      sort_order: sortOrder.default(0), learning_objective: nullableText(1000),
      reading_minutes: z.int().min(1).max(65535).nullable().default(null),
    },
  },
  quizzes: {
    table: 'quizzes', key: 'quiz_id', columns: ['title', 'instructions', 'pass_mark'], parent: true, creator: true,
    shape: {
      title: text(200), instructions: nullableText(10000), pass_mark: amount(0, 100).default(80),
      questions: z.array(question).max(100).default([])
        .refine(rows => rows.filter(published).reduce((total, row) => total + cents(row.points), 0) <= 99999999),
    },
    history: 'SELECT 1 FROM quiz_attempts WHERE quiz_id = ? LIMIT 1',
    async saveChildren(db, key, body) {
      await db.execute('DELETE c FROM quiz_choices c JOIN quiz_questions q USING (question_id) WHERE q.quiz_id = ?', [key]);
      await db.execute('DELETE FROM quiz_questions WHERE quiz_id = ?', [key]);
      for (const [index, question] of body.questions.entries()) {
        await db.execute(`INSERT INTO quiz_questions (quiz_id, question_text, points, sort_order, status)
          VALUES (?,?,?,?,?)`, [key, question.question_text, question.points, index, question.status]);
        const inserted = await insertedId(db);
        for (const [order, choice] of question.choices.entries()) {
          await db.execute(`INSERT INTO quiz_choices (question_id, choice_text, is_correct, sort_order, status)
            VALUES (?,?,?,?,?)`, [inserted, choice.choice_text, choice.is_correct, order, choice.status]);
        }
      }
    },
    async readChildren(db, key) {
      const [questions] = await db.execute('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order, question_id', [key]);
      const [choices] = await db.execute(`
        SELECT c.* FROM quiz_choices c JOIN quiz_questions q USING (question_id)
        WHERE q.quiz_id = ? ORDER BY c.sort_order, c.choice_id`, [key]);
      const byQuestion = Map.groupBy(choices, choice => choice.question_id);
      return { questions: questions.map(row => ({ ...row, choices: byQuestion.get(row.question_id) ?? [] })) };
    },
    async checkPublish(db, key) {
      const questions = (await this.readChildren(db, key)).questions.filter(published);
      if (!questions.length || questions.length > 100 ||
          questions.reduce((total, row) => total + cents(row.points), 0) > 99999999 ||
          questions.some(row => !validChoices(row.choices.filter(published)))) {
        conflict('Publish a quiz with 1–100 published questions and exactly one correct published choice per question.');
      }
    },
  },
  scenarios: {
    table: 'simulation_scenarios', key: 'scenario_id',
    columns: ['name', 'scenario_type', 'description', 'difficulty'], creator: true,
    shape: {
      name: text(200), scenario_type: z.enum(['troubleshooting', 'maintenance']),
      description: nullableText(10000), difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
      steps: z.array(step).max(100).default([]),
    },
    history: 'SELECT 1 FROM troubleshooting_attempts WHERE scenario_id = ? LIMIT 1',
    async saveChildren(db, key, body) {
      await db.execute('DELETE FROM scenario_steps WHERE scenario_id = ?', [key]);
      for (const [index, step] of body.steps.entries()) {
        await db.execute(`
          INSERT INTO scenario_steps (scenario_id, step_order, prompt, action_type, expected_action,
            feedback_correct, feedback_incorrect, configuration_json)
          VALUES (?,?,?,?,?,?,?,?)`,
        [key, index + 1, step.prompt, step.action_type, step.expected_action, step.feedback_correct,
          step.feedback_incorrect, JSON.stringify(step.configuration_json)]);
      }
    },
    async readChildren(db, key) {
      const [steps] = await db.execute('SELECT * FROM scenario_steps WHERE scenario_id = ? ORDER BY step_order', [key]);
      return { steps };
    },
    async checkPublish(db, key) {
      if (!await one(db, 'SELECT step_id FROM scenario_steps WHERE scenario_id = ? LIMIT 1', [key])) {
        conflict('Publish a scenario with at least one step.');
      }
    },
  },
};

async function insertedId(db) {
  return (await one(db, 'SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id')).id;
}

// Identifiers come from the static content definitions, never from requests.
const get = (db, spec, key, lock = '') => one(db,
  `SELECT * FROM ${spec.table} WHERE ${spec.key} = ? ${lock}`, [key]);
const attemptState = async (db, spec, key) => spec.table === 'quizzes'
  ? { has_attempts: Boolean(await one(db, spec.history, [key])) }
  : {};

export function createContent(spec) {
  return async (req, { body }) => ({ data: await transaction(req.db, async db => {
    const values = spec.columns.map(column => body[column]);
    const columns = [...spec.columns];
    if (spec.parent) {
      const parent = requireRow(await one(db, 'SELECT status FROM modules WHERE module_id = ? FOR UPDATE', [body.module_id]));
      if (parent.status === 'archived') conflict('Cannot add content to an archived module.');
      columns.push('module_id');
      values.push(body.module_id);
    }
    if (spec.creator) {
      columns.push('created_by');
      values.push(req.user.user_id);
    }
    await db.execute(`INSERT INTO ${spec.table} (${columns.join(',')}) VALUES (${values.map(() => '?').join(',')})`, values);
    const key = await insertedId(db);
    await spec.saveChildren?.(db, key, body);
    await log(db, req.user.user_id, 'content', 'create', spec.table, key);
    return get(db, spec, key);
  }) });
}

export function readContent(spec) {
  return async (req, { params }) => ({ data: await transaction(req.db, async db => {
    const row = requireRow(await get(db, spec, params.id));
    return { ...row, ...await attemptState(db, spec, params.id), ...await spec.readChildren?.(db, params.id) };
  }) });
}

export function editContent(spec) {
  return async (req, { params, body }) => ({ data: await transaction(req.db, async db => {
    const row = requireRow(await get(db, spec, params.id, 'FOR UPDATE'));
    if (row.status !== 'draft' || (spec.history && await one(db, spec.history, [params.id]))) {
      conflict('Only drafts without learner history can be edited.');
    }
    await db.execute(`UPDATE ${spec.table} SET ${spec.columns.map(column => `${column} = ?`).join(',')}
      WHERE ${spec.key} = ?`, [...spec.columns.map(column => body[column]), params.id]);
    await spec.saveChildren?.(db, params.id, body);
    await log(db, req.user.user_id, 'content', 'edit', spec.table, params.id);
    const saved = await get(db, spec, params.id);
    return spec.table === 'quizzes'
      ? { ...saved, has_attempts: false, ...await spec.readChildren(db, params.id) }
      : saved;
  }) });
}

export function changeStatus(spec) {
  return async (req, { params, body }) => ({ data: await transaction(req.db, async db => {
    const row = requireRow(await get(db, spec, params.id, 'FOR UPDATE'));
    if (row.status === body.status) return { ...row, ...await attemptState(db, spec, params.id) };
    if (row.status === 'archived' || (body.status === 'published' && row.status !== 'draft')) {
      conflict('Only drafts can be published, and archived content cannot be reopened.');
    }
    if (body.status === 'published') {
      if (spec.parent) {
        const parent = requireRow(await one(db, 'SELECT status FROM modules WHERE module_id = ? FOR UPDATE', [row.module_id]));
        if (parent.status !== 'published') conflict('Publish the parent module first.');
      }
      await spec.checkPublish?.(db, params.id);
    }
    const publishedAt = spec.table === 'modules' && body.status === 'published' ? ', published_at = CURRENT_TIMESTAMP' : '';
    await db.execute(`UPDATE ${spec.table} SET status = ?${publishedAt} WHERE ${spec.key} = ?`, [body.status, params.id]);
    await log(db, req.user.user_id, 'content', body.status, spec.table, params.id);
    return { ...await get(db, spec, params.id), ...await attemptState(db, spec, params.id) };
  }) });
}

export const presence = `u.account_status = 'active' AND EXISTS (
  SELECT 1 FROM user_sessions s WHERE s.user_id = u.user_id AND s.revoked_at IS NULL
  AND s.expires_at > CURRENT_TIMESTAMP AND s.last_seen_at >= CURRENT_TIMESTAMP - INTERVAL 5 MINUTE
)`;

export const newContentBody = spec => object({ ...spec.shape, ...(spec.parent ? { module_id: id } : {}) });
