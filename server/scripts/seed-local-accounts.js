import { randomBytes } from 'node:crypto';
import { createPool, loadConfig, one, transaction } from '../config/db.js';
import { hashPassword } from '../controllers/auth.controller.js';

try {
  const { database } = loadConfig();
  if (!['localhost', '127.0.0.1', '::1'].includes(database.host)) {
    throw new Error('Local demo accounts require a loopback database host.');
  }

  const accounts = [
    { role: 'learner', name: 'Learner', email: 'demo-learner@pc-craft.example' },
    { role: 'admin', name: 'Instructor', email: 'demo-instructor@pc-craft.example' },
    { role: 'super_admin', name: 'Super Admin', email: 'demo-super-admin@pc-craft.example' },
  ];
  const pool = createPool(database);
  try {
    const logins = await transaction(pool, async db => {
      const created = [];
      for (const { role, name, email } of accounts) {
        const password = randomBytes(18).toString('base64url');
        await db.execute(`INSERT INTO users (first_name, last_name, email, password_hash, role)
          VALUES (?, 'Demo', ?, ?, ?)`, [name, email, await hashPassword(password), role]);
        const { user_id } = await one(db, 'SELECT CAST(LAST_INSERT_ID() AS CHAR) AS user_id');
        created.push({ role, user_id, email, password });
      }
      return created;
    });
    console.table(logins);
  } finally {
    await pool.end();
  }
} catch (error) {
  console.error(error.code === 'ER_DUP_ENTRY'
    ? 'A demo email already exists. Account creation rolled back.'
    : error.message);
  process.exitCode = 1;
}
