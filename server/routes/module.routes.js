import { Router } from 'express';
import { one } from '../config/db.js';
import { byId, endpoint, page, pagination, requireRow } from '../http.js';

const router = Router();
const moduleFields = 'module_id, title, summary, sort_order, published_at';

router.get('/', endpoint({ query: pagination }, (req, { query }) => page(req.db,
  `SELECT ${moduleFields} FROM modules WHERE status = 'published' ORDER BY sort_order, module_id`, [], query)));
router.get('/:id', endpoint({ params: byId }, async (req, { params }) => ({
  data: requireRow(await one(req.db,
    `SELECT ${moduleFields} FROM modules WHERE module_id = ? AND status = 'published'`, [params.id])),
})));
router.get('/:id/lessons', endpoint({ params: byId, query: pagination }, async (req, { params, query }) => {
  requireRow(await one(req.db, "SELECT module_id FROM modules WHERE module_id = ? AND status = 'published'", [params.id]));
  return page(req.db, `
    SELECT l.lesson_id, l.module_id, l.title, l.sort_order
    FROM lessons l JOIN modules m USING (module_id)
    WHERE l.module_id = ? AND l.status = 'published' AND m.status = 'published'
    ORDER BY l.sort_order, l.lesson_id`, [params.id], query);
}));
router.get('/lessons/:id', endpoint({ params: byId }, async (req, { params }) => ({
  data: requireRow(await one(req.db, `
    SELECT l.lesson_id, l.module_id, l.title, l.content, l.sort_order
    FROM lessons l JOIN modules m USING (module_id)
    WHERE l.lesson_id = ? AND l.status = 'published' AND m.status = 'published'`, [params.id])),
})));
export default router;
