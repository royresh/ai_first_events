import pg from 'pg';
import { createDb, DEFAULT_DATABASE_URL } from './client';
import { runMigrations } from './migrate';
import { seed } from './seed';

/** Drop and recreate the database in `url`, then migrate and seed it. Dev/test only. */
export async function resetDatabase(url: string): Promise<void> {
  const target = new URL(url);
  const dbName = decodeURIComponent(target.pathname.slice(1));
  if (!/^[a-z0-9_]+$/i.test(dbName)) throw new Error(`Refusing to reset odd db name: ${dbName}`);

  const admin = new URL(url);
  admin.pathname = '/postgres';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    await client.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await client.end();
  }

  await runMigrations(url);
  const handle = createDb(url);
  try {
    await seed(handle.db);
  } finally {
    await handle.close();
  }
}

/** Create the database if it does not exist yet (used by integration tests). */
export async function ensureDatabase(url: string): Promise<void> {
  const dbName = decodeURIComponent(new URL(url).pathname.slice(1));
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  resetDatabase(url)
    .then(() =>
      console.log(`[db] reset ${new URL(url).pathname.slice(1)}: dropped, migrated, seeded`),
    )
    .catch((err: unknown) => {
      console.error('[db] reset failed', err);
      process.exit(1);
    });
}
