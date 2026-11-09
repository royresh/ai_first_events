// Plain constants with no vitest import, so global-setup.ts can use them too.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://aifirst:aifirst@localhost:5432/aifirst_test';
export const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';
export const SMTP_HOST = process.env.SMTP_HOST ?? 'localhost';
export const SMTP_PORT = Number(process.env.SMTP_PORT ?? 1025);

if (!new URL(TEST_DATABASE_URL).pathname.endsWith('_test')) {
  throw new Error(`Integration tests only run against a *_test database, got ${TEST_DATABASE_URL}`);
}
