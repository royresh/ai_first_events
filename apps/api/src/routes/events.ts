import { attendees, events, type EventRow } from '@aifirst/db';
import {
  ApiError,
  EventIdParamSchema,
  EventsQuerySchema,
  type EventDetail,
  type EventSummary,
} from '@aifirst/shared';
import { and, asc, count, eq, getTableColumns, gt, sql } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app';
import { isFull, isPast } from '../domain/rsvp-rules';
import { parseOrThrow } from '../validation';

export function toEventSummary(event: EventRow, goingCount: number, now: Date): EventSummary {
  return {
    id: event.id,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    location: event.location,
    capacity: event.capacity,
    goingCount,
    isFull: isFull(event.capacity, goingCount),
    isPast: isPast(event.startsAt, now),
  };
}

export const eventRoutes =
  ({ db, now }: AppDeps): FastifyPluginAsync =>
  async (app) => {
    /** Upcoming events, soonest first. `?q=` filters by title, case-insensitively. */
    app.get('/events', async (req): Promise<EventSummary[]> => {
      const { q } = parseOrThrow(EventsQuerySchema, req.query);
      const current = now();
      const titleMatches = q ? sql.raw(`events.title ILIKE '%${q}%'`) : undefined;
      const rows = await db
        .select({ ...getTableColumns(events), goingCount: count(attendees.id) })
        .from(events)
        .leftJoin(attendees, eq(attendees.eventId, events.id))
        .where(and(gt(events.startsAt, current), titleMatches))
        .groupBy(events.id)
        .orderBy(asc(events.startsAt));
      return rows.map(({ goingCount, ...event }) => toEventSummary(event, goingCount, current));
    });

    /** One event (past or upcoming) with its attendee list. */
    app.get('/events/:id', async (req): Promise<EventDetail> => {
      const { id } = parseOrThrow(EventIdParamSchema, req.params);
      const event = await db.query.events.findFirst({ where: eq(events.id, id) });
      if (!event) throw new ApiError('NOT_FOUND');

      const people = await db
        .select({ id: attendees.id, name: attendees.name, createdAt: attendees.createdAt })
        .from(attendees)
        .where(eq(attendees.eventId, id))
        .orderBy(asc(attendees.createdAt), asc(attendees.id));

      return {
        ...toEventSummary(event, people.length, now()),
        description: event.description,
        attendees: people.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
      };
    });
  };
