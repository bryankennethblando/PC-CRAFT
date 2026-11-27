import { createHash } from 'node:crypto';
import { one } from '../config/db.js';
import { ApiError } from '../http.js';
import { currentConsentField, privacyNotice } from '../privacy.js';

export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export const publicUserFields = 'u.user_id, u.first_name, u.last_name, u.email, u.role';
export const unauthorized = () => new ApiError(401, 'UNAUTHORIZED', 'Valid credentials are required.');

export async function authenticate(req, res, next) {
  const token = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(req.get('authorization') ?? '')?.[1];
  if (!token) throw unauthorized();
  const hash = tokenHash(token);
  const session = await one(req.db, `
    SELECT s.session_id, ${publicUserFields}, ${currentConsentField}
    FROM user_sessions s JOIN users u USING (user_id)
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP
      AND u.account_status = 'active'`, [privacyNotice.version, hash]);
  if (!session) throw unauthorized();
  const { session_id: sessionId, ...user } = session;
  req.sessionId = sessionId;
  req.user = { ...user, privacy_accepted: Number(user.privacy_accepted) === 1 };
  await req.db.execute(`
    UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP
    WHERE session_id = ? AND last_seen_at < CURRENT_TIMESTAMP - INTERVAL 1 MINUTE`, [sessionId]);
  next();
}
