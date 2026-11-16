import type { Db } from '@aifirst/db';
import { ApiError } from '@aifirst/shared';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { adminRoutes } from './routes/admin';
import { eventRoutes } from './routes/events';
import { healthRoutes } from './routes/health';
import { rsvpRoutes } from './routes/rsvps';
import type { Mailer } from './services/mailer';

export interface AppDeps {
  db: Db;
  mailer: Mailer;
  /** Injectable clock, handy in tests. */
  now: () => Date;
  /** Public URL of the web app, for links back to event pages. */
  webUrl: string;
}

export function buildApp(
  deps: Omit<AppDeps, 'now' | 'webUrl'> & { now?: () => Date; webUrl?: string },
  opts: FastifyServerOptions = {},
) {
  const full: AppDeps = { now: () => new Date(), webUrl: 'http://localhost:3000', ...deps };
  const app = Fastify(opts);

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ApiError) {
      return reply.code(err.status).send(err.toBody());
    }
    // Malformed JSON and similar client errors from Fastify itself.
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.code(400).send(new ApiError('VALIDATION', (err as Error).message).toBody());
    }
    req.log.error(err);
    return reply.code(500).send({ error: { code: 'INTERNAL', message: 'Something went wrong.' } });
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send(new ApiError('NOT_FOUND', 'Route not found.').toBody());
  });

  app.register(healthRoutes(full));
  app.register(eventRoutes(full));
  app.register(rsvpRoutes(full));
  app.register(adminRoutes(full));

  return app;
}
