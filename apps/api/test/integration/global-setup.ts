import { ensureDatabase, runMigrations } from '@aifirst/db';
import { TEST_DATABASE_URL } from './env';

/** Make sure the aifirst_test database exists and is migrated. Never touches the dev DB. */
export default async function setup() {
  await ensureDatabase(TEST_DATABASE_URL);
  await runMigrations(TEST_DATABASE_URL);
}
