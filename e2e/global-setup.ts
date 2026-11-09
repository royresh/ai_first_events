import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MAILPIT_URL } from './tests/mailpit';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

/** Reset seed data (ids 1-5 again) and empty the Mailpit inbox before the run. */
export default async function globalSetup() {
  execSync('pnpm --filter @aifirst/db seed:reset', {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://aifirst:aifirst@localhost:5432/aifirst',
    },
  });
  const res = await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
  if (!res.ok)
    throw new Error(`Could not clear Mailpit (${res.status}). Is it running on ${MAILPIT_URL}?`);
}
