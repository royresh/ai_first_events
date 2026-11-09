import { EventDetailSchema, RsvpResultSchema } from '@aifirst/shared';
import { describe, expect, it } from 'vitest';
import { getEmailText, SEED, uniqueEmail, useTestApp, waitForEmailTo } from './helpers';

const ctx = useTestApp();

function rsvp(eventId: number, body: unknown) {
  return ctx.app.inject({
    method: 'POST',
    url: `/events/${eventId}/rsvps`,
    payload: body as object,
  });
}

describe('POST /events/:id/rsvps', () => {
  it('saves the attendee, updates the count, and sends a confirmation email', async () => {
    const email = uniqueEmail('happy');
    const res = await rsvp(SEED.intro, { name: 'Test Person', email });

    expect(res.statusCode).toBe(201);
    const result = RsvpResultSchema.parse(res.json());
    expect(result).toMatchObject({ eventId: SEED.intro, goingCount: 4 });
    expect(result.attendee).toMatchObject({ name: 'Test Person', email });

    const detail = EventDetailSchema.parse(
      (await ctx.app.inject({ method: 'GET', url: `/events/${SEED.intro}` })).json(),
    );
    expect(detail.goingCount).toBe(4);
    expect(detail.attendees.at(-1)?.name).toBe('Test Person');

    const message = await waitForEmailTo(email);
    expect(message.Subject).toBe("You're going to Intro to AI Coding Agents");
    expect(await getEmailText(message.ID)).toContain('Main Hall, Tel Aviv');
  });

  it('rejects a duplicate email case-insensitively with DUPLICATE_EMAIL', async () => {
    const res = await rsvp(SEED.intro, { name: 'Dana Again', email: 'DANA@Example.com' });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toMatchObject({
      code: 'DUPLICATE_EMAIL',
      message: 'This email is already registered for this event.',
    });
  });

  it('rejects RSVPs to a full event with EVENT_FULL', async () => {
    const res = await rsvp(SEED.ragFull, { name: 'Late Comer', email: uniqueEmail('full') });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('EVENT_FULL');
  });

  it('rejects RSVPs to a past event with EVENT_PAST', async () => {
    const res = await rsvp(SEED.pastKickoff, {
      name: 'Time Traveller',
      email: uniqueEmail('past'),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('EVENT_PAST');
  });

  it('404s for an unknown event', async () => {
    const res = await rsvp(9999, { name: 'Nobody', email: uniqueEmail('nf') });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });

  it('400s with per-field VALIDATION errors for bad input', async () => {
    const res = await rsvp(SEED.intro, { name: '  ', email: 'not-an-email' });
    expect(res.statusCode).toBe(400);
    const { error } = res.json();
    expect(error.code).toBe('VALIDATION');
    expect(Object.keys(error.fieldErrors).sort()).toEqual(['email', 'name']);
  });

  it('never overbooks: concurrent RSVPs for the last seat yield exactly one success', async () => {
    // Prompt Engineering Lab: capacity 25, 1 seeded attendee -> fill to 24, leaving one seat.
    for (let i = 0; i < 23; i++) {
      expect(
        (await rsvp(SEED.promptLab, { name: `Filler ${i}`, email: uniqueEmail('fill') }))
          .statusCode,
      ).toBe(201);
    }
    const attempts = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        rsvp(SEED.promptLab, { name: `Racer ${i}`, email: uniqueEmail('race') }),
      ),
    );
    const codes = attempts.map((r) => r.statusCode).sort();
    expect(codes).toEqual([201, 409, 409, 409, 409]);

    const detail = EventDetailSchema.parse(
      (await ctx.app.inject({ method: 'GET', url: `/events/${SEED.promptLab}` })).json(),
    );
    expect(detail).toMatchObject({ goingCount: 25, isFull: true });
  });
});
