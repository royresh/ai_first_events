import { attendees, events, type Db } from '@aifirst/db';
import { ApiError, type RsvpInput, type RsvpResult } from '@aifirst/shared';
import { eq } from 'drizzle-orm';
import { checkRsvp } from '../domain/rsvp-rules';
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
 * Runs in a transaction, and the confirmation email is sent before it commits: if the
 * email can't be sent, the RSVP is rolled back, so nobody holds a seat they were never
 * told about. The event row is locked (SELECT ... FOR UPDATE) until the transaction ends,
 * so two concurrent RSVPs for the last seat can't both succeed. The trade-off: RSVPs to
 * the same event wait for each other while an email is being sent.
 */
export async function createRsvp(
  deps: RsvpServiceDeps,
  eventId: number,
  input: RsvpInput,
): Promise<RsvpResult> {
  const now = deps.now?.() ?? new Date();

  const { attendee, goingCount } = await deps.db.transaction(async (tx) => {
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

    let attendee;
    try {
      [attendee] = await tx
        .insert(attendees)
        .values({ eventId, name: input.name, email: input.email })
        .returning();
    } catch (err) {
      // Backstop for the unique (event_id, lower(email)) index.
      if (isUniqueViolation(err)) throw new ApiError('DUPLICATE_EMAIL');
      throw err;
    }
    if (!attendee) throw new Error('insert returned no row');

    // Throws if the email can't be sent, which rolls the RSVP back.
    await deps.mailer.sendRsvpConfirmation({
      to: { name: attendee.name, email: attendee.email },
      event,
    });

    return { attendee, goingCount: existing.length + 1 };
  });

  return {
    attendee: { id: attendee.id, name: attendee.name, email: attendee.email },
    eventId,
    goingCount,
  };
}

function isUniqueViolation(err: unknown): boolean {
  // drizzle wraps driver errors; the pg error may be the error itself or its cause.
  for (let e: unknown = err; e && typeof e === 'object'; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === PG_UNIQUE_VIOLATION) return true;
  }
  return false;
}
