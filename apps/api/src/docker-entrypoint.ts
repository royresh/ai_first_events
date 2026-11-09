/**
 * Container entrypoint: migrate, seed if the database is empty, then start the API.
 * This is what makes `docker compose up` work with no extra steps.
 */
import { createDb, runMigrations, seedIfEmpty } from '@aifirst/db';
import { loadConfig } from './config';
import { startServer } from './server';

const config = loadConfig();

await runMigrations(config.DATABASE_URL);
console.log('[entrypoint] migrations applied');

const handle = createDb(config.DATABASE_URL);
const seeded = await seedIfEmpty(handle.db);
await handle.close();
console.log(
  seeded ? '[entrypoint] database was empty: seeded' : '[entrypoint] data present: skipped seed',
);

await startServer();
