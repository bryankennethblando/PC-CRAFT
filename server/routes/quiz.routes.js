import { Router } from 'express';
import { z } from 'zod';
import { byId, endpoint, id, object, page, pagination } from '../http.js';
import { learner } from '../middleware/role.middleware.js';
import { attemptDetail, attemptList, publishedQuiz, quizDetail, quizFields, startAttempt, submitAttempt } from '../controllers/quiz.controller.js';

const router = Router();
router.get('/', endpoint({ query: pagination.extend({ module_id: id.optional() }) }, (req, { query }) => page(req.db,
  `SELECT ${quizFields} ${publishedQuiz} ${query.module_id ? 'AND q.module_id = ?' : ''} ORDER BY q.quiz_id`,
  query.module_id ? [query.module_id] : [], query)));
router.get('/attempts', learner, endpoint({ query: pagination }, (req, { query }) =>
  page(req.db, attemptList, [req.user.user_id], query)));
router.get('/attempts/:id', learner, endpoint({ params: byId }, attemptDetail));
router.post('/attempts/:id/submit', learner, endpoint({
  params: byId,
  body: object({ answers: z.array(object({ question_id: id, selected_choice_id: id.nullable() })).max(100) }),
}, submitAttempt));
router.get('/:id', endpoint({ params: byId }, quizDetail));
router.post('/:id/attempts', learner, endpoint({ params: byId, status: 201 }, startAttempt));
export default router;
