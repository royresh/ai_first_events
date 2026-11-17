import { attendees, events, type Db } from '@aifirst/db';
import { ApiError, type RsvpInput, type RsvpResult } from '@aifirst/shared';
import { eq } from 'drizzle-orm';
import { checkRsvp } from '../domain/rsvp-rules';
import type { Mailer } from './mailer';

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

    const [attendee] = await tx
      .insert(attendees)
      .values({ eventId, name: input.name, email: input.email })
      .returning();
    if (!attendee) throw new Error('insert returned no row');
    return { event, attendee, goingCount: existing.length + 1 };
  });

  try {
    await deps.mailer.sendRsvpConfirmation({
      to: { name: attendee.name, email: attendee.email },
      event,
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
