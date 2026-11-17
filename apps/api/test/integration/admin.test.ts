import { AdminAttendeeSchema, AdminEventRowSchema } from '@aifirst/shared';
import { describe, expect, it } from 'vitest';
import { SEED, uniqueEmail, useTestApp } from './helpers';

const ctx = useTestApp();

describe('GET /admin/events', () => {
  it('lists every event, including past ones, with RSVP counts', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/admin/events' });
    expect(res.statusCode).toBe(200);
    const rows = AdminEventRowSchema.array().parse(res.json());

    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({
      title: 'AI First Kickoff Meetup',
      isPast: true,
      goingCount: 2,
    });
    expect(rows.find((r) => r.id === SEED.ragFull)).toMatchObject({ goingCount: 3, isFull: true });
    expect(rows.find((r) => r.id === SEED.shipping)).toMatchObject({
      goingCount: 0,
      isFull: false,
    });
  });

  it('reflects new RSVPs', async () => {
    await ctx.app.inject({
      method: 'POST',
      url: `/events/${SEED.shipping}/rsvps`,
      payload: { name: 'Admin Check', email: uniqueEmail('admin') },
    });
    const rows = AdminEventRowSchema.array().parse(
      (await ctx.app.inject({ method: 'GET', url: '/admin/events' })).json(),
    );
    expect(rows.find((r) => r.id === SEED.shipping)?.goingCount).toBe(1);
  });
});

describe('GET /admin/events/:id/attendees', () => {
  it('lists attendees with their emails in RSVP order', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/admin/events/${SEED.intro}/attendees`,
    });
    expect(res.statusCode).toBe(200);
    const rows = AdminAttendeeSchema.array().parse(res.json());
    expect(rows.map((r) => [r.name, r.email])).toEqual([
      ['Dana Levi', 'dana@example.com'],
      ['Omar Haddad', 'omar@example.com'],
      ['Maya Cohen', 'maya@example.com'],
    ]);
  });

  it('404s for an unknown event', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/admin/events/9999/attendees' });
    expect(res.statusCode).toBe(404);
  });
});
