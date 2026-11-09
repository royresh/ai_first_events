import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  capacity: integer('capacity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const attendees = pgTable(
  'attendees',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    eventId: integer('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One RSVP per email per event, case-insensitive.
    uniqueIndex('attendees_event_id_lower_email_unique').on(t.eventId, sql`lower(${t.email})`),
    index('attendees_event_id_idx').on(t.eventId),
  ],
);

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type AttendeeRow = typeof attendees.$inferSelect;
export type NewAttendeeRow = typeof attendees.$inferInsert;
