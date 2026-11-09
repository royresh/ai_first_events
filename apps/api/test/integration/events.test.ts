import { EventDetailSchema, EventSummarySchema } from '@aifirst/shared';
import { describe, expect, it } from 'vitest';
import { SEED, useTestApp } from './helpers';

const ctx = useTestApp();

describe('GET /health', () => {
  it('reports ok when the database is reachable', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /events', () => {
  it('lists only upcoming events, soonest first, matching the shared contract', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/events' });
    expect(res.statusCode).toBe(200);

    const events = EventSummarySchema.array().parse(res.json());
    expect(events.map((e) => e.title)).toEqual([
      'Intro to AI Coding Agents',
      'Prompt Engineering Lab',
      'RAG Deep Dive',
      'Shipping LLM Features Safely',
    ]);
    expect(events.every((e) => !e.isPast)).toBe(true);
  });

  it('includes going counts and marks the full event', async () => {
    const events = EventSummarySchema.array().parse(
      (await ctx.app.inject({ method: 'GET', url: '/events' })).json(),
    );
    const rag = events.find((e) => e.title === 'RAG Deep Dive')!;
    expect(rag).toMatchObject({ goingCount: 3, capacity: 3, isFull: true });
    const intro = events.find((e) => e.title === 'Intro to AI Coding Agents')!;
    expect(intro).toMatchObject({ goingCount: 3, isFull: false });
  });
});

describe('GET /events/:id', () => {
  it('returns description and attendee names (no emails)', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: `/events/${SEED.intro}` });
    expect(res.statusCode).toBe(200);
    const event = EventDetailSchema.parse(res.json());
    expect(event.description).toContain('AI coding agents');
    expect(event.attendees.map((a) => a.name)).toEqual(['Dana Levi', 'Omar Haddad', 'Maya Cohen']);
    expect(JSON.stringify(res.json())).not.toContain('@example.com');
  });

  it('returns past events too, flagged isPast', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: `/events/${SEED.pastKickoff}` });
    expect(EventDetailSchema.parse(res.json()).isPast).toBe(true);
  });

  it('404s with NOT_FOUND for an unknown id', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/events/9999' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });

  it('400s with VALIDATION for a non-numeric id', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/events/abc' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION');
  });
});
