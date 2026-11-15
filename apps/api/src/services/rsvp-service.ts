import { attendees, events, type Db } from '@aifirst/db';
import {
  ApiError,
  type CancelRsvpResult,
  type RsvpInput,
  type RsvpLookup,
  type RsvpResult,
} from '@aifirst/shared';
import { count, eq } from 'drizzle-orm';
import { checkCancel, checkRsvp } from '../domain/rsvp-rules';
import { toEventSummary } from '../routes/events';
import type { Mailer } from './mailer';

const PG_UNIQUE_VIOLATION = '23505';

export interface RsvpServiceDeps {
  db: Db;
  mailer: Mailer;
  now?: () => Date;
  log?: { error: (obj: unknown, msg: string) => void };
}

/**
 * Create an RSVP.
 *
 * Runs in a transaction that locks the event row (SELECT ... FOR UPDATE), so two
 * concurrent RSVPs for the last seat can't both succeed. The confirmation email is
 * sent after commit; a mail failure is logged but does not undo the RSVP.
 */
export async function createRsvp(
  deps: RsvpServiceDeps,
  eventId: number,
  input: RsvpInput,
): Promise<RsvpResult> {
  const now = deps.now?.() ?? new Date();

  const { event, attendee, goingCount } = await deps.db.transaction(async (tx) => {
    const [event] = await tx.select().from(events).where(eq(events.id, eventId)).for('update');
    if (!event) throw new ApiError('NOT_FOUND');

    const existing = await tx
      .select({ email: attendees.email })
      .from(attendees)
      .where(eq(attendees.eventId, eventId));

    const decision = checkRsvp({
      event,
      existingEmails: existing.map((a) => a.email),
      email: input.email,
      now,
    });
    if (!decision.ok) throw new ApiError(decision.code);

    try {
      const [attendee] = await tx
        .insert(attendees)
        .values({ eventId, name: input.name, email: input.email })
        .returning();
      if (!attendee) throw new Error('insert returned no row');
      return { event, attendee, goingCount: existing.length + 1 };
    } catch (err) {
      // Backstop for the unique (event_id, lower(email)) index.
      if (isUniqueViolation(err)) throw new ApiError('DUPLICATE_EMAIL');
      throw err;
    }
  });

  try {
    await deps.mailer.sendRsvpConfirmation({
      to: { name: attendee.name, email: attendee.email },
      event,
      cancelToken: attendee.cancelToken,
    });
  } catch (err) {
    deps.log?.error({ err, attendeeId: attendee.id }, 'failed to send RSVP confirmation email');
  }

  return {
    attendee: { id: attendee.id, name: attendee.name, email: attendee.email },
    eventId,
    goingCount,
  };
}

/** Look up an RSVP by its cancel token, for the cancel page. */
export async function getRsvpByToken(deps: RsvpServiceDeps, token: string): Promise<RsvpLookup> {
  const [row] = await deps.db
    .select({ name: attendees.name, event: events })
    .from(attendees)
    .innerJoin(events, eq(events.id, attendees.eventId))
    .where(eq(attendees.cancelToken, token));
  if (!row) throw new ApiError('RSVP_NOT_FOUND');

  const [counted] = await deps.db
    .select({ n: count() })
    .from(attendees)
    .where(eq(attendees.eventId, row.event.id));
  const now = deps.now?.() ?? new Date();
  return { attendee: { name: row.name }, event: toEventSummary(row.event, counted?.n ?? 0, now) };
}

/**
 * Cancel an RSVP by its token: deletes the attendee and frees the seat.
 *
 * Locks the event row like createRsvp, so cancels and RSVPs for one event are serialized.
 * Reusing the link finds nothing -> RSVP_NOT_FOUND. The cancellation email is sent after
 * commit; a mail failure is only logged.
 */
export async function cancelRsvp(deps: RsvpServiceDeps, token: string): Promise<CancelRsvpResult> {
  const now = deps.now?.() ?? new Date();

  const { event, attendee, goingCount } = await deps.db.transaction(async (tx) => {
    const [found] = await tx
      .select({ eventId: attendees.eventId })
      .from(attendees)
      .where(eq(attendees.cancelToken, token));
    if (!found) throw new ApiError('RSVP_NOT_FOUND');

    const [event] = await tx
      .select()
      .from(events)
      .where(eq(events.id, found.eventId))
      .for('update');
    if (!event) throw new ApiError('RSVP_NOT_FOUND');

    const decision = checkCancel({ startsAt: event.startsAt, now });
    if (!decision.ok) throw new ApiError(decision.code);

    const [attendee] = await tx
      .delete(attendees)
      .where(eq(attendees.cancelToken, token))
      .returning();
    // Another request cancelled with this token between our read and the lock.
    if (!attendee) throw new ApiError('RSVP_NOT_FOUND');

    const [counted] = await tx
      .select({ n: count() })
      .from(attendees)
      .where(eq(attendees.eventId, event.id));
    return { event, attendee, goingCount: counted?.n ?? 0 };
  });

  try {
    await deps.mailer.sendRsvpCancellation({
      to: { name: attendee.name, email: attendee.email },
      event,
    });
  } catch (err) {
    deps.log?.error({ err, eventId: event.id }, 'failed to send RSVP cancellation email');
  }

  return { eventId: event.id, goingCount };
}

function isUniqueViolation(err: unknown): boolean {
  // drizzle wraps driver errors; the pg error may be the error itself or its cause.
  for (let e: unknown = err; e && typeof e === 'object'; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === PG_UNIQUE_VIOLATION) return true;
  }
  return false;
}
