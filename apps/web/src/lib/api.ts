/**
 * Server-side API client. Only import from server components and server actions:
 * the browser never talks to the API directly (no CORS needed).
 */
import {
  AdminEventRowSchema,
  ApiErrorBodySchema,
  EventDetailSchema,
  EventSummarySchema,
  RsvpResultSchema,
  type AdminEventRow,
  type ApiErrorBody,
  type EventDetail,
  type EventSummary,
  type RsvpInput,
  type RsvpResult,
} from '@aifirst/shared';
import type { z } from 'zod';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

async function getJson<S extends z.ZodType>(path: string, schema: S): Promise<z.output<S>> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
  return schema.parse(await res.json());
}

export function listEvents(): Promise<EventSummary[]> {
  return getJson('/events', EventSummarySchema.array());
}

/** Returns null when the event does not exist. */
export async function getEvent(id: number): Promise<EventDetail | null> {
  const res = await fetch(`${API_URL}/events/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /events/${id} failed with ${res.status}`);
  return EventDetailSchema.parse(await res.json());
}

export function listAdminEvents(): Promise<AdminEventRow[]> {
  return getJson('/admin/events', AdminEventRowSchema.array());
}

export type RsvpResponse =
  { ok: true; data: RsvpResult } | { ok: false; error: ApiErrorBody['error'] };

export async function postRsvp(eventId: number, input: RsvpInput): Promise<RsvpResponse> {
  const res = await fetch(`${API_URL}/events/${eventId}/rsvps`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  const body: unknown = await res.json();
  if (res.ok) return { ok: true, data: RsvpResultSchema.parse(body) };
  const parsed = ApiErrorBodySchema.safeParse(body);
  if (parsed.success) return { ok: false, error: parsed.data.error };
  throw new Error(`POST /events/${eventId}/rsvps failed with ${res.status}`);
}
