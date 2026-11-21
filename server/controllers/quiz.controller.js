import { one, transaction } from '../config/db.js';
import { conflict, invalid, requireRow } from '../http.js';

export const quizFields = 'q.quiz_id, q.module_id, q.title, q.instructions, q.pass_mark';
export const publishedQuiz = `FROM quizzes q JOIN modules m USING (module_id)
  WHERE q.status = 'published' AND m.status = 'published'`;
const attemptFields = 'attempt_id, quiz_id, attempt_number, score, max_score, passed, started_at, submitted_at';
export const attemptList = `SELECT ${attemptFields} FROM quiz_attempts WHERE user_id = ? ORDER BY started_at DESC, attempt_id DESC`;

export const cents = amount => Math.round(Number(amount) * 100);
const decimal = value => (value / 100).toFixed(2);
const ownedAttempt = (db, user, id, lock = '') => one(db,
  `SELECT ${attemptFields} FROM quiz_attempts WHERE user_id = ? AND attempt_id = ? ${lock}`, [user, id]);

async function questions(db, quizId) {
  const [rows] = await db.execute(`
    SELECT q.question_id, q.question_text, q.points, c.choice_id, c.choice_text
    FROM quiz_questions q LEFT JOIN quiz_choices c USING (question_id)
    WHERE q.quiz_id = ? ORDER BY q.sort_order, q.question_id, c.sort_order, c.choice_id`, [quizId]);
  const grouped = new Map();
  for (const { question_id, question_text, points, choice_id, choice_text } of rows) {
    if (!grouped.has(question_id)) grouped.set(question_id, { question_id, question_text, points, choices: [] });
    if (choice_id) grouped.get(question_id).choices.push({ choice_id, choice_text });
  }
  return [...grouped.values()];
}

export async function quizDetail(req, { params }) {
  const quiz = requireRow(await one(req.db, `SELECT ${quizFields} ${publishedQuiz} AND q.quiz_id = ?`, [params.id]));
  return { data: { ...quiz, questions: await questions(req.db, params.id) } };
}

export async function startAttempt(req, { params }) {
  return { data: await transaction(req.db, async db => {
    requireRow(await one(db, `SELECT q.quiz_id ${publishedQuiz} AND q.quiz_id = ? FOR UPDATE`, [params.id]));
    const { next_number } = await one(db, `
      SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_number FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?`,
    [req.user.user_id, params.id]);
    await db.execute('INSERT INTO quiz_attempts (user_id, quiz_id, attempt_number) VALUES (?,?,?)',
      [req.user.user_id, params.id, next_number]);
    return one(db, `SELECT ${attemptFields} FROM quiz_attempts WHERE attempt_id = LAST_INSERT_ID()`);
  }) };
}

export async function attemptDetail(req, { params }) {
  const attempt = requireRow(await ownedAttempt(req.db, req.user.user_id, params.id));
  const data = { ...attempt, questions: await questions(req.db, attempt.quiz_id) };
  if (attempt.submitted_at) {
    [data.answers] = await req.db.execute(`
      SELECT question_id, selected_choice_id, is_correct, points_awarded
      FROM quiz_answers WHERE attempt_id = ? ORDER BY question_id`, [params.id]);
  }
  return { data };
}

export async function submitAttempt(req, { params, body }) {
  return { data: await transaction(req.db, async db => {
    const attempt = requireRow(await ownedAttempt(db, req.user.user_id, params.id, 'FOR UPDATE'));
    if (attempt.submitted_at) conflict('Attempt is already submitted.');
    const [rows] = await db.execute(`
      SELECT q.question_id, q.points, c.choice_id, c.is_correct
      FROM quiz_questions q LEFT JOIN quiz_choices c USING (question_id)
      WHERE q.quiz_id = ? ORDER BY q.question_id`, [attempt.quiz_id]);
    const grouped = new Map();
    for (const row of rows) {
      if (!grouped.has(row.question_id)) grouped.set(row.question_id, { points: cents(row.points), choices: new Map() });
      if (row.choice_id) grouped.get(row.question_id).choices.set(row.choice_id, row.is_correct === 1);
    }
    const submitted = new Map();
    for (const { question_id, selected_choice_id } of body.answers) {
      const question = grouped.get(question_id);
      if (!question || submitted.has(question_id) || (selected_choice_id && !question.choices.has(selected_choice_id))) {
        invalid('Answers must identify distinct quiz questions and their choices.');
      }
      submitted.set(question_id, selected_choice_id);
    }
    let score = 0, maxScore = 0;
    for (const [questionId, question] of grouped) {
      if (question.choices.size < 2 || [...question.choices.values()].filter(Boolean).length !== 1) {
        conflict('Quiz has an invalid answer key.');
      }
      const choice = submitted.get(questionId) ?? null;
      const correct = question.choices.get(choice) === true;
      const awarded = correct ? question.points : 0;
      score += awarded;
      maxScore += question.points;
      await db.execute(`
        INSERT INTO quiz_answers (quiz_id, attempt_id, question_id, selected_choice_id, is_correct, points_awarded)
        VALUES (?,?,?,?,?,?)`, [attempt.quiz_id, params.id, questionId, choice, correct, decimal(awarded)]);
    }
    if (!maxScore || maxScore > 99999999) conflict('Quiz has an invalid maximum score.');
    const { pass_mark } = await one(db, 'SELECT pass_mark FROM quizzes WHERE quiz_id = ?', [attempt.quiz_id]);
    await db.execute(`
      UPDATE quiz_attempts SET score = ?, max_score = ?, passed = ?, submitted_at = CURRENT_TIMESTAMP
      WHERE attempt_id = ?`, [decimal(score), decimal(maxScore), score * 10000 >= maxScore * cents(pass_mark), params.id]);
    return ownedAttempt(db, req.user.user_id, params.id);
  }) };
}
