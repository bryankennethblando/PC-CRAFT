import { Router } from 'express';
import { z } from 'zod';
import { one, transaction } from '../config/db.js';
import { byId, conflict, endpoint, object, page, pagination, requireRow, text } from '../http.js';
import { learner } from '../middleware/role.middleware.js';
import { compatibility, parts } from '../controllers/simulation.controller.js';

const router = Router();
const mode = z.enum(['assembly', 'disassembly']);
const build = object({
  version: z.literal(1),
  parts: z.array(object({ slot: z.enum(Object.keys(parts)), part_id: text(40) })).max(Object.keys(parts).length),
}).refine(({ parts: placed }) => new Set(placed.map(item => item.slot)).size === placed.length &&
  placed.every(({ slot, part_id }) => Object.hasOwn(parts[slot], part_id)));
const emptyBuild = { version: 1, parts: [] };
const owned = (db, user, id, lock = '') => one(db,
  `SELECT assembly_attempt_id, mode, status, build_state_json, compatibility_status,
    compatibility_report_json, started_at, updated_at, completed_at
    FROM assembly_attempts WHERE user_id = ? AND assembly_attempt_id = ? ${lock}`, [user, id]);

router.get('/catalog', endpoint({}, () => ({ data: parts })));
router.use('/attempts', learner);
router.get('/attempts', endpoint({ query: pagination }, (req, { query }) => page(req.db, `
  SELECT assembly_attempt_id, mode, status, compatibility_status, started_at, updated_at, completed_at
  FROM assembly_attempts WHERE user_id = ? ORDER BY updated_at DESC, assembly_attempt_id DESC`, [req.user.user_id], query)));
router.post('/attempts', endpoint({
  status: 201, body: object({ mode, build_state: build.default(emptyBuild) }),
}, async (req, { body }) => ({
  data: await transaction(req.db, async db => {
    const result = compatibility(body.build_state);
    await db.execute(`
      INSERT INTO assembly_attempts (user_id, mode, build_state_json, compatibility_status, compatibility_report_json)
      VALUES (?,?,?,?,?)`, [
      req.user.user_id, body.mode, JSON.stringify(body.build_state), result.status, JSON.stringify(result.report),
    ]);
    const { assembly_attempt_id } = await one(db, 'SELECT CAST(LAST_INSERT_ID() AS CHAR) AS assembly_attempt_id');
    return owned(db, req.user.user_id, assembly_attempt_id);
  }),
})));
router.get('/attempts/:id', endpoint({ params: byId }, async (req, { params }) => ({
  data: requireRow(await owned(req.db, req.user.user_id, params.id)),
})));
router.put('/attempts/:id', endpoint({
  params: byId,
  body: object({ build_state: build, status: z.enum(['in_progress', 'completed', 'abandoned']).default('in_progress') }),
}, async (req, { params, body }) => ({
  data: await transaction(req.db, async db => {
    const attempt = requireRow(await owned(db, req.user.user_id, params.id, 'FOR UPDATE'));
    if (attempt.status !== 'in_progress') conflict('Attempt is closed.');
    const result = compatibility(body.build_state);
    if (body.status === 'completed' && (attempt.mode === 'assembly'
      ? result.status !== 'compatible'
      : body.build_state.parts.length !== 0)) {
      conflict('Finish the build or remove all parts for disassembly before completing the attempt.');
    }
    await db.execute(`
      UPDATE assembly_attempts SET build_state_json = ?, compatibility_status = ?, compatibility_report_json = ?,
        status = ?, completed_at = IF(? = 'completed', CURRENT_TIMESTAMP, NULL)
      WHERE assembly_attempt_id = ?`,
    [JSON.stringify(body.build_state), result.status, JSON.stringify(result.report), body.status, body.status, params.id]);
    return owned(db, req.user.user_id, params.id);
  }),
})));
export default router;
