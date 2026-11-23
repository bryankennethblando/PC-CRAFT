import { one, transaction } from '../config/db.js';
import { conflict, invalid, requireRow } from '../http.js';

export const scenarioFields = 'scenario_id, name, scenario_type, description, difficulty';
const attemptFields = 'attempt_id, scenario_id, status, score, started_at, completed_at';
export const attemptList = `SELECT ${attemptFields} FROM troubleshooting_attempts
  WHERE user_id = ? ORDER BY started_at DESC, attempt_id DESC`;
const owned = (db, user, id, lock = '') => one(db,
  `SELECT ${attemptFields} FROM troubleshooting_attempts WHERE user_id = ? AND attempt_id = ? ${lock}`, [user, id]);
const visibleStep = 'step_id, step_order, prompt, action_type, configuration_json';

export async function scenarioDetail(req, { params }) {
  const data = requireRow(await one(req.db,
    `SELECT ${scenarioFields} FROM simulation_scenarios WHERE status = 'published' AND scenario_id = ?`, [params.id]));
  const [steps] = await req.db.execute(
    `SELECT ${visibleStep} FROM scenario_steps WHERE scenario_id = ? ORDER BY step_order`, [params.id]);
  return { data: { ...data, steps } };
}

export async function startAttempt(req, { params }) {
  return { data: await transaction(req.db, async db => {
    requireRow(await one(db, `
      SELECT scenario_id FROM simulation_scenarios WHERE status = 'published' AND scenario_id = ? FOR UPDATE`, [params.id]));
    if (!await one(db, 'SELECT step_id FROM scenario_steps WHERE scenario_id = ? LIMIT 1', [params.id])) {
      conflict('Scenario has no steps.');
    }
    await db.execute('INSERT INTO troubleshooting_attempts (user_id, scenario_id) VALUES (?,?)',
      [req.user.user_id, params.id]);
    return one(db, `SELECT ${attemptFields} FROM troubleshooting_attempts WHERE attempt_id = LAST_INSERT_ID()`);
  }) };
}

export async function attemptDetail(req, { params }) {
  const data = requireRow(await owned(req.db, req.user.user_id, params.id));
  const [steps] = await req.db.execute(`
    SELECT s.${visibleStep.replaceAll(', ', ', s.')}, r.chosen_action, r.is_correct,
      CASE WHEN r.is_correct = 1 THEN s.feedback_correct WHEN r.is_correct = 0 THEN s.feedback_incorrect END AS feedback
    FROM scenario_steps s LEFT JOIN troubleshooting_responses r ON r.response_id = (
      SELECT MIN(first_response.response_id) FROM troubleshooting_responses first_response
      WHERE first_response.attempt_id = ? AND first_response.step_id = s.step_id
    )
    WHERE s.scenario_id = ? ORDER BY s.step_order`, [params.id, data.scenario_id]);
  return { data: { ...data, steps } };
}

export async function respond(req, { params, body }) {
  return { data: await transaction(req.db, async db => {
    const attempt = requireRow(await owned(db, req.user.user_id, params.id, 'FOR UPDATE'));
    if (attempt.status !== 'in_progress') conflict('Attempt is closed.');
    const [pending] = await db.execute(`
      SELECT step_id, expected_action, feedback_correct, feedback_incorrect, configuration_json FROM scenario_steps s
      WHERE s.scenario_id = ? AND NOT EXISTS (
        SELECT 1 FROM troubleshooting_responses r WHERE r.attempt_id = ? AND r.step_id = s.step_id
      ) ORDER BY s.step_order LIMIT 2`, [attempt.scenario_id, params.id]);
    const [step] = pending;
    if (!step || step.step_id !== body.step_id) conflict('Respond to the next unanswered step.');
    const actions = step.configuration_json?.actions;
    if (Array.isArray(actions) && !actions.some(action => action?.id === body.chosen_action)) {
      invalid('Choose an action listed for this step.');
    }
    const correct = step.expected_action === body.chosen_action;
    await db.execute(`
      INSERT INTO troubleshooting_responses (scenario_id, attempt_id, step_id, chosen_action, is_correct)
      VALUES (?,?,?,?,?)`, [attempt.scenario_id, params.id, step.step_id, body.chosen_action, correct]);
    if (pending.length === 1) {
      await db.execute(`
        UPDATE troubleshooting_attempts SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
          score = (SELECT COUNT(DISTINCT step_id) FROM troubleshooting_responses
                   WHERE attempt_id = ? AND is_correct = 1)
        WHERE attempt_id = ?`, [params.id, params.id]);
    }
    return {
      attempt: await owned(db, req.user.user_id, params.id),
      is_correct: correct,
      feedback: correct ? step.feedback_correct : step.feedback_incorrect,
    };
  }) };
}

export async function abandon(req, { params }) {
  return { data: await transaction(req.db, async db => {
    const attempt = requireRow(await owned(db, req.user.user_id, params.id, 'FOR UPDATE'));
    if (attempt.status !== 'in_progress') conflict('Attempt is closed.');
    await db.execute("UPDATE troubleshooting_attempts SET status = 'abandoned' WHERE attempt_id = ?", [params.id]);
    return owned(db, req.user.user_id, params.id);
  }) };
}
