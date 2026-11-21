import { ZodError } from 'zod';
import { ApiError } from '../http.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ZodError || error instanceof URIError || error.type === 'entity.parse.failed') {
    error = new ApiError(400, 'INVALID_INPUT', 'Invalid request fields or values.');
  } else if (error.type === 'entity.too.large') {
    error = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  } else if (error.type === 'charset.unsupported' || error.type === 'encoding.unsupported') {
    error = new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported request encoding.');
  } else if (['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code)) {
    error = new ApiError(409, 'CONFLICT', 'Request conflicts with existing data or another update.');
  }
  if (!(error instanceof ApiError)) {
    console.error('API request failed', { method: req.method, code: error.code ?? error.name });
    error = new ApiError(500, 'INTERNAL_ERROR', 'Internal server error.');
  }
  res.status(error.status).json({ ok: false, error: { code: error.code, message: error.message } });
}
