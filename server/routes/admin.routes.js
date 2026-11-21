import { Router } from 'express';
import { z } from 'zod';
import { one, transaction } from '../config/db.js';
import { byId, contentStatus, endpoint, log, object, page, pagination, requireRow, text } from '../http.js';
import { admin, superAdmin } from '../middleware/role.middleware.js';
import { changeStatus, content, createContent, editContent, newContentBody, presence, readContent } from '../controllers/admin.controller.js';

const router = Router();
router.use(admin);

router.get('/dashboard', endpoint({}, async req => ({
  data: await one(req.db, `
    SELECT (SELECT COUNT(*) FROM users WHERE role = 'learner') AS learners,
      (SELECT COUNT(*) FROM users u WHERE ${presence}) AS online_users,
      (SELECT COUNT(*) FROM modules WHERE status = 'published') AS published_modules,
      (SELECT COUNT(*) FROM quizzes q JOIN modules m USING (module_id)
        WHERE q.status = 'published' AND m.status = 'published') AS published_quizzes,
      (SELECT COUNT(*) FROM quiz_attempts WHERE submitted_at IS NOT NULL) AS submitted_quiz_attempts,
      (SELECT COUNT(*) FROM assembly_attempts WHERE status = 'completed') AS completed_assembly_attempts,
      (SELECT COUNT(*) FROM troubleshooting_attempts WHERE status = 'completed') AS completed_troubleshooting_attempts`),
})));
router.get('/users', endpoint({ query: pagination }, async (req, { query }) => {
  const result = await page(req.db, `
  SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.account_status, u.created_at,
    (SELECT MAX(s.last_seen_at) FROM user_sessions s WHERE s.user_id = u.user_id) AS last_seen_at,
    (${presence}) AS online
  FROM users u ORDER BY u.user_id`, [], query);
  return { ...result, data: result.data.map(user => ({ ...user, online: Number(user.online) === 1 })) };
}));
router.get('/users/:id/activity', endpoint({ params: byId }, async (req, { params }) => {
  const user = requireRow(await one(req.db, `
    SELECT u.user_id, (${presence}) AS online,
      (SELECT MAX(s.last_seen_at) FROM user_sessions s WHERE s.user_id = u.user_id) AS last_seen_at,
      (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id = u.user_id AND p.completed_at IS NOT NULL) AS lessons_completed,
      (SELECT COUNT(*) FROM quiz_attempts q WHERE q.user_id = u.user_id AND q.submitted_at IS NOT NULL) AS quizzes_submitted,
      (SELECT COUNT(*) FROM assembly_attempts a WHERE a.user_id = u.user_id) AS assembly_attempts,
      (SELECT COUNT(*) FROM troubleshooting_attempts t WHERE t.user_id = u.user_id) AS troubleshooting_attempts
    FROM users u WHERE u.user_id = ?`, [params.id]));
  return { data: { ...user, online: Number(user.online) === 1 } };
}));

for (const [name, spec] of Object.entries(content)) {
  const path = `/${name}`;
  router.get(path, endpoint({ query: pagination }, (req, { query }) =>
    page(req.db, `SELECT ${spec.columns.filter(column => column !== 'content').join(', ')}, ${spec.key}, status
      ${spec.parent ? ', module_id' : ''} FROM ${spec.table} ORDER BY ${spec.key}`, [], query)));
  router.get(`${path}/:id`, endpoint({ params: byId }, readContent(spec)));
  router.post(path, endpoint({ body: newContentBody(spec), status: 201 }, createContent(spec)));
  router.put(`${path}/:id`, endpoint({ params: byId, body: object(spec.shape) }, editContent(spec)));
  router.patch(`${path}/:id/status`, endpoint({
    params: byId, body: object({ status: name === 'scenarios' ? z.enum(['published', 'archived']) : contentStatus }),
  }, changeStatus(spec)));
}

router.get('/logs', superAdmin, endpoint({ query: pagination }, (req, { query }) => page(req.db, `
  SELECT * FROM system_logs ORDER BY created_at DESC, log_id DESC`, [], query)));
router.get('/feedback', superAdmin, endpoint({ query: pagination }, (req, { query }) => page(req.db, `
  SELECT * FROM system_feedback ORDER BY submitted_at DESC, feedback_id DESC`, [], query)));
router.patch('/feedback/:id', superAdmin, endpoint({
  params: byId, body: object({
    status: z.enum(['open', 'in_review', 'resolved']),
    admin_note: text(5000).nullable().optional(),
  }),
}, async (req, { params, body }) => ({ data: await transaction(req.db, async db => {
  const row = requireRow(await one(db, 'SELECT feedback_id, admin_note FROM system_feedback WHERE feedback_id = ? FOR UPDATE', [params.id]));
  await db.execute(`
    UPDATE system_feedback SET status = ?, reviewed_by = ?, admin_note = ?,
      resolved_at = IF(? = 'resolved', COALESCE(resolved_at, CURRENT_TIMESTAMP), NULL)
    WHERE feedback_id = ?`, [body.status, req.user.user_id,
    body.admin_note === undefined ? row.admin_note : body.admin_note, body.status, params.id]);
  await log(db, req.user.user_id, 'feedback', body.status, 'system_feedback', params.id);
  return one(db, 'SELECT * FROM system_feedback WHERE feedback_id = ?', [params.id]);
}) })));
export default router;
