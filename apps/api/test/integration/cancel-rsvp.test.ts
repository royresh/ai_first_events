import { attendees } from '@aifirst/db';
import { CancelRsvpResultSchema, EventDetailSchema, RsvpLookupSchema } from '@aifirst/shared';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  getEmailText,
  MAILPIT_URL,
  SEED,
  uniqueEmail,
  useTestApp,
  waitForEmailTo,
} from './helpers';

const ctx = useTestApp();

const CANCEL_LINK = /http:\/\/localhost:3000\/rsvps\/([0-9a-f-]{36})\/cancel/;

/** RSVPs via the API and returns the cancel token from the confirmation email. */
async function rsvpAndGetToken(eventId: number, email: string): Promise<string> {
  const res = await ctx.app.inject({
    method: 'POST',
    url: `/events/${eventId}/rsvps`,
    payload: { name: 'Cancel Tester', email },
  });
  expect(res.statusCode).toBe(201);
  const text = await getEmailText((await waitForEmailTo(email)).ID);
  const token = CANCEL_LINK.exec(text)?.[1];
  expect(token, 'cancel link in confirmation email').toBeDefined();
  return token!;
}

async function goingCount(eventId: number): Promise<number> {
  const res = await ctx.app.inject({ method: 'GET', url: `/events/${eventId}` });
  return EventDetailSchema.parse(res.json()).goingCount;
}

const cancel = (token: string) => ctx.app.inject({ method: 'POST', url: `/rsvps/${token}/cancel` });

describe('GET /rsvps/:token', () => {
  it('returns the attendee name and event, but not the email', async () => {
    const token = await rsvpAndGetToken(SEED.intro, uniqueEmail('lookup'));
    const res = await ctx.app.inject({ method: 'GET', url: `/rsvps/${token}` });
    expect(res.statusCode).toBe(200);
    const body = RsvpLookupSchema.parse(res.json());
    expect(body.attendee).toEqual({ name: 'Cancel Tester' });
    expect(body.event).toMatchObject({ id: SEED.intro, title: 'Intro to AI Coding Agents' });
    expect(res.body).not.toContain('@');
  });

  it('404s with RSVP_NOT_FOUND for unknown or malformed tokens', async () => {
    for (const token of ['00000000-0000-4000-8000-000000000000', 'not-a-token']) {
      const res = await ctx.app.inject({ method: 'GET', url: `/rsvps/${token}` });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('RSVP_NOT_FOUND');
    }
  });
});

describe('POST /rsvps/:token/cancel', () => {
  it('frees the seat and sends a cancellation email', async () => {
    const email = uniqueEmail('cancel');
    const token = await rsvpAndGetToken(SEED.intro, email);
    expect(await goingCount(SEED.intro)).toBe(4);

    const res = await cancel(token);
    expect(res.statusCode).toBe(200);
    expect(CancelRsvpResultSchema.parse(res.json())).toEqual({
      eventId: SEED.intro,
      goingCount: 3,
    });
    expect(await goingCount(SEED.intro)).toBe(3);

    await expect
      .poll(async () => {
        const q = encodeURIComponent(`to:"${email}" subject:cancelled`);
        const r = await fetch(`${MAILPIT_URL}/api/v1/search?query=${q}`);
        return ((await r.json()) as { messages: { Subject: string }[] }).messages[0]?.Subject;
      })
      .toBe('Your RSVP to Intro to AI Coding Agents is cancelled');
  });

  it('lets the same email RSVP again after cancelling', async () => {
    const email = uniqueEmail('again');
    await cancel(await rsvpAndGetToken(SEED.intro, email));
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/events/${SEED.intro}/rsvps`,
      payload: { name: 'Back Again', email },
    });
    expect(res.statusCode).toBe(201);
  });

  it('rejects a second cancel with the same link with RSVP_NOT_FOUND', async () => {
    const token = await rsvpAndGetToken(SEED.intro, uniqueEmail('twice'));
    expect((await cancel(token)).statusCode).toBe(200);
    const again = await cancel(token);
    expect(again.statusCode).toBe(404);
    expect(again.json().error.code).toBe('RSVP_NOT_FOUND');
  });

  it('concurrent cancels with the same link: exactly one succeeds', async () => {
    const token = await rsvpAndGetToken(SEED.intro, uniqueEmail('race'));
    const results = await Promise.all(Array.from({ length: 4 }, () => cancel(token)));
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 404, 404, 404]);
    expect(await goingCount(SEED.intro)).toBe(3);
  });

  it('rejects cancelling once the event has started with CANCEL_CLOSED', async () => {
    const [row] = await ctx.db
      .select({ token: attendees.cancelToken })
      .from(attendees)
      .where(eq(attendees.eventId, SEED.pastKickoff))
      .limit(1);
    expect(row).toBeDefined();
    const res = await cancel(row!.token);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('CANCEL_CLOSED');
  });
});
