import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

export interface DbHandle {
  db: Db;
  pool: pg.Pool;
  close: () => Promise<void>;
}

export const DEFAULT_DATABASE_URL = 'postgres://aifirst:aifirst@localhost:5432/aifirst';

export function createDb(url: string = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL): DbHandle {
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  // Without a listener, an idle client error (e.g. Postgres restarting) would crash the process.
  pool.on('error', (err) => console.error('[db] idle client error:', err.message));
  const db = drizzle(pool, { schema });
  return { db, pool, close: () => pool.end() };
}
