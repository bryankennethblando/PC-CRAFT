import { randomBytes, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { one, transaction } from '../config/db.js';
import { log } from '../http.js';
import { tokenHash, unauthorized } from '../middleware/auth.middleware.js';

const scrypt = promisify(derive);
const deriveKey = (password, salt) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
const profile = 'user_id, first_name, last_name, email, role';

async function verify(password, verifier) {
  const match = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(verifier ?? '');
  const computed = await deriveKey(password, Buffer.from(match?.[1] ?? '0'.repeat(32), 'hex'));
  return match !== null && timingSafeEqual(computed, Buffer.from(match[2], 'hex'));
}

export async function register(req, { body }) {
  const { email, first_name, last_name, password } = body;
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  const hash = `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
  const user = await transaction(req.db, async connection => {
    await connection.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?,?,?,?)',
      [first_name, last_name, email, hash],
    );
    const created = await one(connection, `SELECT ${profile} FROM users WHERE user_id = LAST_INSERT_ID()`);
    await log(connection, created.user_id, 'auth', 'register', 'user', created.user_id);
    return created;
  });
  return { data: user };
}

export async function login(req, { body }) {
  const loginRecord = await one(req.db, `
    SELECT user_id, password_hash AS verifier FROM users WHERE email = ? AND account_status = 'active'`,
  [body.email]);
  if (!await verify(body.password, loginRecord?.verifier)) throw unauthorized();
  const token = randomBytes(32).toString('base64url');
  const data = await transaction(req.db, async connection => {
    const user = await one(connection, `
      SELECT ${profile} FROM users
      WHERE user_id = ? AND account_status = 'active' AND BINARY password_hash = ? FOR UPDATE`,
    [loginRecord.user_id, loginRecord.verifier]);
    if (!user) throw unauthorized();
    await connection.execute(`
      INSERT INTO user_sessions (user_id, token_hash, expires_at)
      VALUES (?,?,CURRENT_TIMESTAMP + INTERVAL 7 DAY)`, [user.user_id, tokenHash(token)]);
    const session = await one(connection, 'SELECT expires_at FROM user_sessions WHERE session_id = LAST_INSERT_ID()');
    await log(connection, user.user_id, 'auth', 'login', 'user', user.user_id);
    return { user, token, ...session };
  });
  return { data };
}

export async function logout(req) {
  await req.db.execute('UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_id = ?', [req.sessionId]);
  return { data: null };
}
