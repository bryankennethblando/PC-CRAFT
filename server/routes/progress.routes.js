import { Router } from 'express';
import { z } from 'zod';
import { one, transaction } from '../config/db.js';
import { byId, endpoint, object, page, pagination, requireRow } from '../http.js';
import { learner } from '../middleware/role.middleware.js';

const router = Router();
router.use(learner);
const publishedLesson = "l.status = 'published' AND m.status = 'published'";

router.get('/', endpoint({}, async req => {
  const [summary, nextLesson, assembly] = await Promise.all([
    one(req.db, `
      SELECT COUNT(*) AS lesson_count, COUNT(p.completed_at) AS completed_count
      FROM lessons l JOIN modules m USING (module_id)
      LEFT JOIN lesson_progress p ON p.lesson_id = l.lesson_id AND p.user_id = ?
      WHERE ${publishedLesson}`, [req.user.user_id]),
    one(req.db, `
      SELECT l.lesson_id, l.module_id, l.title, l.reading_minutes
      FROM lessons l JOIN modules m USING (module_id)
      LEFT JOIN lesson_progress p ON p.lesson_id = l.lesson_id AND p.user_id = ?
      WHERE ${publishedLesson} AND p.completed_at IS NULL
      ORDER BY p.started_at DESC, m.sort_order, m.module_id, l.sort_order, l.lesson_id LIMIT 1`, [req.user.user_id]),
    one(req.db, `
      SELECT assembly_attempt_id, mode, compatibility_status, updated_at FROM assembly_attempts
      WHERE user_id = ? AND status = 'in_progress' ORDER BY updated_at DESC, assembly_attempt_id DESC LIMIT 1`, [req.user.user_id]),
  ]);
  const lesson_count = Number(summary.lesson_count);
  const completed_count = Number(summary.completed_count);
  return { data: {
    lesson_count, completed_count,
    completion_percent: lesson_count ? Math.round(100 * completed_count / lesson_count) : 0,
    next_lesson: nextLesson ?? null, resumable_assembly: assembly ?? null,
  } };
}));
router.get('/lessons', endpoint({ query: pagination }, async (req, { query }) => {
  const result = await page(req.db, `
    SELECT l.lesson_id, l.module_id, IF(${publishedLesson}, l.title, 'Unavailable lesson') AS title,
      IF(${publishedLesson}, l.reading_minutes, NULL) AS reading_minutes,
      (${publishedLesson}) AS available, COALESCE(p.status, 'not_started') AS status, p.started_at, p.completed_at
    FROM lessons l JOIN modules m USING (module_id)
    LEFT JOIN lesson_progress p ON p.lesson_id = l.lesson_id AND p.user_id = ?
    WHERE (${publishedLesson}) OR p.progress_id IS NOT NULL
    ORDER BY m.sort_order, m.module_id, l.sort_order, l.lesson_id`, [req.user.user_id], query);
  return { ...result, data: result.data.map(row => ({ ...row, available: Boolean(Number(row.available)) })) };
}));
router.put('/lessons/:id', endpoint({
  params: byId, body: object({ status: z.enum(['in_progress', 'completed']) }),
}, async (req, { params, body }) => {
  const data = await transaction(req.db, async db => {
    requireRow(await one(db, `
      SELECT l.lesson_id FROM lessons l JOIN modules m USING (module_id)
      WHERE l.lesson_id = ? AND ${publishedLesson} FOR UPDATE`, [params.id]));
    const completed = body.status === 'completed';
    await db.execute(`
      INSERT INTO lesson_progress (user_id, lesson_id, status, started_at, completed_at)
      VALUES (?,?,?,CURRENT_TIMESTAMP,IF(?,CURRENT_TIMESTAMP,NULL))
      ON DUPLICATE KEY UPDATE status = IF(completed_at IS NOT NULL OR ?, 'completed', 'in_progress'),
        started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
        completed_at = COALESCE(completed_at, IF(?, CURRENT_TIMESTAMP, NULL))`,
    [req.user.user_id, params.id, body.status, completed, completed, completed]);
    return one(db, `
      SELECT lesson_id, status, started_at, completed_at, updated_at
      FROM lesson_progress WHERE user_id = ? AND lesson_id = ?`, [req.user.user_id, params.id]);
  });
  return { data };
}));
export default router;
