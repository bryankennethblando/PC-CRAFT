import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { ApiError, endpoint, object, text } from '../http.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { register, login, logout } from '../controllers/auth.controller.js';
import { privacyNotice, recordConsent, requireCurrentNotice } from '../privacy.js';

const router = Router();
const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => next(new ApiError(429, 'RATE_LIMITED', 'Too many authentication requests. Try again later.')),
});
const email = z.email().max(254).transform(value => value.toLowerCase());
const consent = { privacy_accepted: z.literal(true), privacy_notice_version: text(32) };
router.get('/privacy', endpoint({}, () => ({ data: privacyNotice })));
router.post('/register', limit, endpoint({
  status: 201,
  body: object({ first_name: text(100), last_name: text(100), email, password: z.string().min(12).max(128), ...consent }),
}, register));
router.post('/login', limit, endpoint({ body: object({ email, password: z.string().min(1).max(128) }) }, login));
router.get('/me', authenticate, endpoint({}, req => ({ data: req.user })));
router.post('/privacy/consent', authenticate, endpoint({ body: object(consent) }, async (req, { body }) => {
  requireCurrentNotice(body.privacy_notice_version);
  await recordConsent(req.db, req.user.user_id, body.privacy_notice_version);
  return { data: { ...req.user, privacy_accepted: true } };
}));
router.post('/logout', authenticate, endpoint({}, logout));
export default router;
