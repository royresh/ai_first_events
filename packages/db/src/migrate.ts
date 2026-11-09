import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from './client';

export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../migrations', import.meta.url));

/** Apply all pending drizzle-kit migrations. Safe to run repeatedly. */
export async function runMigrations(url?: string): Promise<void> {
  const handle = createDb(url);
  try {
    await migrate(handle.db, { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await handle.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => console.log('[db] migrations applied'))
    .catch((err: unknown) => {
      console.error('[db] migration failed', err);
      process.exit(1);
    });
}
