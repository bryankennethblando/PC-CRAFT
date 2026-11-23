import { Router } from 'express';
import { byId, endpoint, id, object, page, pagination, text } from '../http.js';
import { learner } from '../middleware/role.middleware.js';
import { abandon, attemptDetail, attemptList, respond, scenarioDetail, scenarioFields, startAttempt } from '../controllers/troubleshooting.controller.js';

const router = Router();
router.get('/scenarios', endpoint({ query: pagination }, (req, { query }) => page(req.db,
  `SELECT ${scenarioFields} FROM simulation_scenarios WHERE status = 'published' ORDER BY scenario_id`, [], query)));
router.get('/scenarios/:id', endpoint({ params: byId }, scenarioDetail));
router.post('/scenarios/:id/attempts', learner, endpoint({ params: byId, status: 201 }, startAttempt));
router.use('/attempts', learner);
router.get('/attempts', endpoint({ query: pagination }, (req, { query }) => page(req.db, attemptList, [req.user.user_id], query)));
router.get('/attempts/:id', endpoint({ params: byId }, attemptDetail));
router.post('/attempts/:id/responses', endpoint({
  params: byId, body: object({ step_id: id, chosen_action: text(120) }),
}, respond));
router.post('/attempts/:id/abandon', endpoint({ params: byId }, abandon));
export default router;
