import { Router } from 'express';
import { z } from 'zod';
import { one, transaction } from '../config/db.js';
import { endpoint, object, text } from '../http.js';
import { learner } from '../middleware/role.middleware.js';

const router = Router();
router.post('/', learner, endpoint({
  status: 201,
  body: object({ category: text(60), message: text(5000), rating: z.int().min(1).max(5).nullable().default(null) }),
}, async (req, { body }) => ({
  data: await transaction(req.db, async db => {
    await db.execute('INSERT INTO system_feedback (user_id, category, message, rating) VALUES (?,?,?,?)',
      [req.user.user_id, body.category, body.message, body.rating]);
    return one(db, `
      SELECT feedback_id, category, message, rating, status, submitted_at
      FROM system_feedback WHERE feedback_id = LAST_INSERT_ID()`);
  }),
})));
export default router;
