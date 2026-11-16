import { describe, expect, it } from 'vitest';
import { SEED, useTestApp } from './helpers';

const ctx = useTestApp();

describe('GET /events/:id/calendar.ics', () => {
  it('downloads the event as an iCalendar file named after the event', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: `/events/${SEED.intro}/calendar.ics` });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/calendar; charset=utf-8');
    expect(res.headers['content-disposition']).toContain(
      'attachment; filename="Intro to AI Coding Agents.ics"',
    );

    const lines = res.body.replace(/\r\n /g, '').split('\r\n');
    expect(lines).toContain('BEGIN:VEVENT');
    expect(lines).toContain(`UID:event-${SEED.intro}@aifirst.events`);
    expect(lines).toContain('SUMMARY:Intro to AI Coding Agents');
    expect(lines).toContain('LOCATION:Main Hall\\, Tel Aviv');
    expect(lines).toContain(`URL:http://localhost:3000/events/${SEED.intro}`);
    expect(lines.some((l) => /^DTSTART:\d{8}T\d{6}Z$/.test(l))).toBe(true);
    expect(lines.some((l) => /^DTEND:\d{8}T\d{6}Z$/.test(l))).toBe(true);
  });

  it('matches the start and end times of the event', async () => {
    const event = (await ctx.app.inject({ method: 'GET', url: `/events/${SEED.intro}` })).json<{
      startsAt: string;
      endsAt: string;
    }>();
    const res = await ctx.app.inject({ method: 'GET', url: `/events/${SEED.intro}/calendar.ics` });
    const basic = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    expect(res.body).toContain(`DTSTART:${basic(event.startsAt)}`);
    expect(res.body).toContain(`DTEND:${basic(event.endsAt)}`);
  });

  it('works for past events too', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/events/${SEED.pastKickoff}/calendar.ics`,
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 for an unknown event', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/events/9999/calendar.ics' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });

  it('rejects a malformed id', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/events/abc/calendar.ics' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: { code: 'VALIDATION' } });
  });
});
