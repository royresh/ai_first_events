import { describe, expect, it } from 'vitest';
import { checkRsvp, isFull, isPast, normalizeEmail } from '../../src/domain/rsvp-rules';

const now = new Date('2026-06-01T12:00:00Z');
const tomorrow = new Date('2026-06-02T12:00:00Z');
const yesterday = new Date('2026-05-31T12:00:00Z');

describe('capacity', () => {
  it('allows an RSVP while seats remain', () => {
    const decision = checkRsvp({
      event: { capacity: 3, startsAt: tomorrow },
      existingEmails: ['a@x.com', 'b@x.com'],
      email: 'c@x.com',
      now,
    });
    expect(decision).toEqual({ ok: true });
  });

  it('rejects with EVENT_FULL when attendees == capacity', () => {
    const decision = checkRsvp({
      event: { capacity: 2, startsAt: tomorrow },
      existingEmails: ['a@x.com', 'b@x.com'],
      email: 'c@x.com',
      now,
    });
    expect(decision).toEqual({ ok: false, code: 'EVENT_FULL' });
  });

  it('isFull is true at and above capacity', () => {
    expect(isFull(3, 2)).toBe(false);
    expect(isFull(3, 3)).toBe(true);
    expect(isFull(3, 4)).toBe(true);
  });
});

describe('duplicate email', () => {
  it('rejects the same email with DUPLICATE_EMAIL', () => {
    const decision = checkRsvp({
      event: { capacity: 10, startsAt: tomorrow },
      existingEmails: ['dana@example.com'],
      email: 'dana@example.com',
      now,
    });
    expect(decision).toEqual({ ok: false, code: 'DUPLICATE_EMAIL' });
  });

  it('compares emails case-insensitively and ignores surrounding spaces', () => {
    const decision = checkRsvp({
      event: { capacity: 10, startsAt: tomorrow },
      existingEmails: ['Dana@Example.com'],
      email: '  dANA@example.COM ',
      now,
    });
    expect(decision).toEqual({ ok: false, code: 'DUPLICATE_EMAIL' });
    expect(normalizeEmail(' A@B.Com ')).toBe('a@b.com');
  });

  it('reports DUPLICATE_EMAIL (not EVENT_FULL) when an existing attendee retries a full event', () => {
    const decision = checkRsvp({
      event: { capacity: 1, startsAt: tomorrow },
      existingEmails: ['dana@example.com'],
      email: 'DANA@example.com',
      now,
    });
    expect(decision).toEqual({ ok: false, code: 'DUPLICATE_EMAIL' });
  });
});

describe('past events', () => {
  it('rejects RSVPs to events that already started with EVENT_PAST', () => {
    const decision = checkRsvp({
      event: { capacity: 10, startsAt: yesterday },
      existingEmails: [],
      email: 'new@x.com',
      now,
    });
    expect(decision).toEqual({ ok: false, code: 'EVENT_PAST' });
  });

  it('treats an event starting exactly now as past', () => {
    expect(isPast(now, now)).toBe(true);
    expect(isPast(tomorrow, now)).toBe(false);
  });

  it('checks past before full', () => {
    const decision = checkRsvp({
      event: { capacity: 1, startsAt: yesterday },
      existingEmails: ['a@x.com'],
      email: 'b@x.com',
      now,
    });
    expect(decision).toEqual({ ok: false, code: 'EVENT_PAST' });
  });
});
