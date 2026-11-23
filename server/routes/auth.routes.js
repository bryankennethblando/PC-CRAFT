import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { ApiError, endpoint, object, text } from '../http.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { register, login, logout } from '../controllers/auth.controller.js';

const router = Router();
const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => next(new ApiError(429, 'RATE_LIMITED', 'Too many authentication requests. Try again later.')),
});
const email = z.email().max(254).transform(value => value.toLowerCase());
router.post('/register', limit, endpoint({
  status: 201,
  body: object({ first_name: text(100), last_name: text(100), email, password: z.string().min(12).max(128) }),
}, register));
router.post('/login', limit, endpoint({ body: object({ email, password: z.string().min(1).max(128) }) }, login));
router.get('/me', authenticate, endpoint({}, req => ({ data: req.user })));
router.post('/logout', authenticate, endpoint({}, logout));
export default router;
