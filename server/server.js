import { pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createPool, loadConfig } from './config/db.js';
import { ApiError, endpoint } from './http.js';
import { authenticate } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import auth from './routes/auth.routes.js';
import modules from './routes/module.routes.js';
import quizzes from './routes/quiz.routes.js';
import progress from './routes/progress.routes.js';
import simulation from './routes/simulation.routes.js';
import troubleshooting from './routes/troubleshooting.routes.js';
import feedback from './routes/feedback.routes.js';
import admin from './routes/admin.routes.js';

export function createApp(db, origin) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet(), cors({
    origin: (requestOrigin, done) => done(null, requestOrigin === origin),
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use('/api', (req, res, next) => {
    req.db = db;
    res.set('Cache-Control', 'no-store');
    if ((Number(req.get('content-length')) > 0 || req.get('transfer-encoding')) && !req.is('application/json')) {
      return next(new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send a JSON request body.'));
    }
    next();
  });
  app.use('/api', express.json({ limit: '256kb' }));
  app.get('/api/health', endpoint({}, async () => {
    try {
      await db.execute('SELECT 1');
    } catch {
      throw new ApiError(503, 'DB_UNAVAILABLE', 'Database is unavailable.');
    }
    return { data: { status: 'healthy' } };
  }));
  app.use('/api/auth', auth);
  for (const [path, router] of Object.entries({ modules, quizzes, progress, simulation, troubleshooting, feedback, admin })) {
    app.use(`/api/${path}`, authenticate, router);
  }
  app.use((req, res, next) => next(new ApiError(404, 'NOT_FOUND', 'Resource not found.')));
  app.use(errorHandler);
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = loadConfig();
  const pool = createPool(config.database);
  const server = createApp(pool, config.origin).listen(config.port, config.host, () => {
    console.log(`PC-CRAFT API listening on http://${config.host}:${config.port}`);
  });
  const stop = () => {
    const timeout = setTimeout(() => server.closeAllConnections(), 10000);
    timeout.unref();
    server.close(async () => {
      clearTimeout(timeout);
      try {
        await pool.end();
      } catch {
        process.exitCode = 1;
      }
    });
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
