import type { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import type { AppDeps } from '../app';

export const healthRoutes =
  ({ db }: AppDeps): FastifyPluginAsync =>
  async (app) => {
    app.get('/health', async () => {
      await db.execute(sql`SELECT 1`);
      return { status: 'ok' };
    });
  };
