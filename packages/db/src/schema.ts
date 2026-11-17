import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

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
    // No unique index on (event_id, lower(email)) on this demo branch: the duplicate-email
    // rule is enforced only by checkRsvp, so the mutation demo can show its bug in the UI.
    index('attendees_event_id_idx').on(t.eventId),
  ],
);

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type AttendeeRow = typeof attendees.$inferSelect;
export type NewAttendeeRow = typeof attendees.$inferInsert;
