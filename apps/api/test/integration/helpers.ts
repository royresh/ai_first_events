import { createDb, seed, type DbHandle } from '@aifirst/db';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app';
import { createMailer } from '../../src/services/mailer';

import { MAILPIT_URL, SMTP_HOST, SMTP_PORT, TEST_DATABASE_URL } from './env';

export { MAILPIT_URL, TEST_DATABASE_URL };

/** Seed ids are stable because seed --reset restarts identities. */
export const SEED = {
  intro: 1,
  promptLab: 2,
  ragFull: 3,
  shipping: 4,
  pastKickoff: 5,
} as const;

/**
 * Builds the real Fastify app against aifirst_test and real Mailpit SMTP,
 * and resets the seed data before every test.
 */
export function useTestApp() {
  let handle: DbHandle;
  const ctx = {} as { app: ReturnType<typeof buildApp>; db: DbHandle['db'] };

  beforeAll(async () => {
    handle = createDb(TEST_DATABASE_URL);
    const mailer = createMailer({
      host: SMTP_HOST,
      port: SMTP_PORT,
      from: 'AI First Events <events@aifirst.local>',
    });
    ctx.db = handle.db;
    ctx.app = buildApp({ db: handle.db, mailer });
    await ctx.app.ready();
  });

  beforeEach(async () => {
    await seed(handle.db, { reset: true });
  });

  afterAll(async () => {
    await ctx.app?.close();
    await handle?.close();
  });

  return ctx;
}

export function uniqueEmail(tag: string): string {
  return `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

interface MailpitMessage {
  ID: string;
  Subject: string;
  To: { Name: string; Address: string }[];
}

/** Polls the Mailpit API until a message to `email` shows up (SMTP delivery is async). */
export async function waitForEmailTo(email: string, timeoutMs = 5000): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;
  const query = encodeURIComponent(`to:"${email}"`);
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}`);
    if (res.ok) {
      const body = (await res.json()) as { messages: MailpitMessage[] };
      if (body.messages.length > 0) return body.messages[0]!;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`No email to ${email} arrived in Mailpit within ${timeoutMs}ms`);
}

export async function getEmailText(id: string): Promise<string> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
  const body = (await res.json()) as { Text: string };
  return body.Text;
}
