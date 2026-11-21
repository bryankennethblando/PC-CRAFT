import { z } from 'zod';

export const object = z.strictObject;
export const text = max => z.string().trim().min(1).max(max);
export const id = z.string().regex(/^[1-9]\d{0,19}$/)
  .refine(value => value.length < 20 || value <= '18446744073709551615');
export const byId = object({ id });
export const contentStatus = z.enum(['draft', 'published', 'archived']);
export const sortOrder = z.int().min(0).max(2147483647);
export const pagination = object({
  page: z.string().regex(/^[1-9]\d{0,5}$/).transform(Number).default(1),
  limit: z.string().regex(/^(?:[1-9]\d?|100)$/).transform(Number).default(20),
});
const empty = object({});

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function requireRow(row) {
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Resource not found.');
  return row;
}

export function conflict(message) {
  throw new ApiError(409, 'CONFLICT', message);
}

export function invalid(message) {
  throw new ApiError(400, 'INVALID_INPUT', message);
}

export function endpoint({ params = empty, query = empty, body = empty, status = 200 }, handle) {
  return async (req, res) => {
    const input = {
      params: params.parse(req.params),
      query: query.parse(req.query),
      body: body.parse(req.body ?? {}),
    };
    const result = await handle(req, input);
    res.status(status).json({ ok: true, ...result });
  };
}

export async function page(db, statement, params, { page, limit }) {
  const [rows] = await db.execute(`${statement} LIMIT ? OFFSET ?`, [ ...params, limit + 1, (page - 1) * limit ]);
  return { data: rows.slice(0, limit), meta: { page, limit, has_more: rows.length > limit } };
}

export async function log(db, userId, event, action, entity, entityId) {
  await db.execute(
    'INSERT INTO system_logs (user_id, event_type, action, entity_type, entity_id) VALUES (?,?,?,?,?)',
    [userId, event, action, entity, entityId],
  );
}
