import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import mysql from 'mysql2/promise';

export function loadConfig(file = new URL('../../.env', import.meta.url)) {
  const env = parseEnv(readFileSync(file, 'utf8'));
  function port(name) {
    const value = env[name];
    if (!/^\d+$/.test(value ?? '') || Number(value) < 1 || Number(value) > 65535) {
      throw new Error(`Set ${name} to a valid port in .env`);
    }
    return Number(value);
  }

  for (const name of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'FRONTEND_ORIGIN']) {
    if (!env[name]) throw new Error(`Set ${name} in .env`);
  }
  const origin = new URL(env.FRONTEND_ORIGIN);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== env.FRONTEND_ORIGIN) {
    throw new Error('Set FRONTEND_ORIGIN to an HTTP(S) origin with no trailing slash in .env');
  }
  return {
    port: port('PORT'),
    origin: origin.origin,
    database: {
      host: env.DB_HOST, port: port('DB_PORT'), user: env.DB_USER,
      password: env.DB_PASSWORD, database: env.DB_NAME,
    },
  };
}

export function createPool(options) {
  const pool = mysql.createPool({
    ...options, timezone: 'Z', supportBigNumbers: true, bigNumberStrings: true,
    multipleStatements: false, connectionLimit: 10, queueLimit: 40, connectTimeout: 5000,
  });
  pool.on('connection', connection => {
    connection.query("SET time_zone = '+00:00'", error => {
      if (error) connection.destroy();
    });
  });
  return pool;
}

export async function one(db, statement, values = []) {
  const [[row]] = await db.execute(statement, values);
  return row;
}

export async function transaction(db, work) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      connection.destroy();
    }
    throw error;
  } finally {
    connection.release();
  }
}
