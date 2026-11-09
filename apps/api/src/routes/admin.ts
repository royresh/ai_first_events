import { attendees, events } from '@aifirst/db';
import type { AdminEventRow } from '@aifirst/shared';
import { asc, count, eq } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app';
import { isFull, isPast } from '../domain/rsvp-rules';

export const adminRoutes =
  ({ db, now }: AppDeps): FastifyPluginAsync =>
  async (app) => {
    /** All events (past included) with RSVP counts, by start time. */
    app.get('/admin/events', async (): Promise<AdminEventRow[]> => {
      const current = now();
      const rows = await db
        .select({
          id: events.id,
          title: events.title,
          startsAt: events.startsAt,
          capacity: events.capacity,
          goingCount: count(attendees.id),
        })
        .from(events)
        .leftJoin(attendees, eq(attendees.eventId, events.id))
        .groupBy(events.id)
        .orderBy(asc(events.startsAt));
      return rows.map((r) => ({
        ...r,
        startsAt: r.startsAt.toISOString(),
        isFull: isFull(r.capacity, r.goingCount),
        isPast: isPast(r.startsAt, current),
      }));
    });
  };
