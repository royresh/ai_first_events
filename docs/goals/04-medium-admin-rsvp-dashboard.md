# 04 · Admin RSVP dashboard (Medium)

## Goals

- As an organizer, I can open an event in `/admin` and see exactly who is coming.
- As an organizer, I can see at a glance which events are filling up.

## Acceptance criteria

- [ ] `/admin` rows link to `/admin/events/[id]`.
- [ ] The event dashboard shows: title, date, capacity, RSVPs, seats left, and a fill bar (% full).
- [ ] An attendee table with name, email, and RSVP time, newest first.
- [ ] A search box that filters attendees by name or email.
- [ ] **Export CSV** downloads `attendees-<event-id>.csv` with a header row; values containing
      commas or quotes are escaped correctly.
- [ ] On `/admin`, events that are ≥ 80% full get an "Almost full" badge.
- [ ] Emails are visible only on admin routes; public endpoints still don't expose them.
- [ ] New response shapes are zod schemas in `packages/shared`.
- [ ] Tests: integration tests for the new admin endpoint(s) and CSV escaping; a Playwright spec
      that opens a dashboard and exports the CSV.

## Note

There is no auth in v1. Don't add it as part of this card, but keep admin data behind `/admin/*`
API routes so auth can be added in one place later.
