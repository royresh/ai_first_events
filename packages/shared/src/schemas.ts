import { z } from 'zod';

/**
 * The API contract shared by apps/api and apps/web.
 * Dates travel as ISO-8601 strings.
 */

export const AttendeeSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});
export type Attendee = z.infer<typeof AttendeeSchema>;

export const EventSummarySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  location: z.string(),
  capacity: z.number().int().positive(),
  goingCount: z.number().int().nonnegative(),
  isFull: z.boolean(),
  isPast: z.boolean(),
});
export type EventSummary = z.infer<typeof EventSummarySchema>;

export const EventDetailSchema = EventSummarySchema.extend({
  description: z.string(),
  attendees: z.array(AttendeeSchema),
});
export type EventDetail = z.infer<typeof EventDetailSchema>;

export const RsvpInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
});
export type RsvpInput = z.infer<typeof RsvpInputSchema>;

export const RsvpResultSchema = z.object({
  attendee: z.object({
    id: z.number().int(),
    name: z.string(),
    email: z.string(),
  }),
  eventId: z.number().int(),
  goingCount: z.number().int().nonnegative(),
});
export type RsvpResult = z.infer<typeof RsvpResultSchema>;

export const AdminEventRowSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  startsAt: z.iso.datetime(),
  capacity: z.number().int().positive(),
  goingCount: z.number().int().nonnegative(),
  isFull: z.boolean(),
  isPast: z.boolean(),
});
export type AdminEventRow = z.infer<typeof AdminEventRowSchema>;

export const EventIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
