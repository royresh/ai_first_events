/**
 * Pure RSVP business rules: no I/O, no database, easy to unit test.
 * The service layer loads the data and calls these inside a transaction.
 */
import type { ApiErrorCode } from '@aifirst/shared';

export type RsvpRejection = Extract<ApiErrorCode, 'EVENT_FULL' | 'DUPLICATE_EMAIL' | 'EVENT_PAST'>;

export type RsvpDecision = { ok: true } | { ok: false; code: RsvpRejection };

export interface RsvpRuleInput {
  event: { capacity: number; startsAt: Date };
  /** Emails already registered for the event (any casing). */
  existingEmails: readonly string[];
  /** Email of the person trying to RSVP. */
  email: string;
  now: Date;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isPast(startsAt: Date, now: Date): boolean {
  return startsAt.getTime() <= now.getTime();
}

export function isFull(capacity: number, goingCount: number): boolean {
  return goingCount >= capacity;
}

/**
 * Decide whether an RSVP is allowed. Checks run in this order, so the most useful
 * message wins: past event -> already registered -> event full.
 */
export function checkRsvp({ event, existingEmails, email, now }: RsvpRuleInput): RsvpDecision {
  if (isPast(event.startsAt, now)) return { ok: false, code: 'EVENT_PAST' };

  const wanted = normalizeEmail(email);
  if (existingEmails.some((e) => normalizeEmail(e) === wanted)) {
    return { ok: false, code: 'DUPLICATE_EMAIL' };
  }

  if (isFull(event.capacity, existingEmails.length)) return { ok: false, code: 'EVENT_FULL' };

  return { ok: true };
}
