import { expect } from '@playwright/test';

export const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';

export interface MailpitMessage {
  ID: string;
  Subject: string;
  To: { Name: string; Address: string }[];
}

/** Polls Mailpit's REST API until a message to `email` arrives. */
export async function waitForEmailTo(email: string): Promise<MailpitMessage> {
  let found: MailpitMessage | undefined;
  await expect
    .poll(
      async () => {
        const query = encodeURIComponent(`to:"${email}"`);
        const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}`);
        const body = (await res.json()) as { messages: MailpitMessage[] };
        found = body.messages[0];
        return body.messages.length;
      },
      { message: `email to ${email} in Mailpit`, timeout: 10_000 },
    )
    .toBeGreaterThan(0);
  return found!;
}

export function uniqueEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}@example.com`;
}
