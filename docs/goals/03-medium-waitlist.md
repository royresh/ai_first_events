# 03 · Waitlist when full (Medium)

## Goals

- As a visitor, when an event is full I can join its waitlist instead of being turned away.
- As an attendee, I can cancel my RSVP.
- When someone cancels, the first person on the waitlist is promoted automatically and emailed.

## Acceptance criteria

- [ ] On a full event the form says **Join waitlist** (instead of a disabled "Full" button) and shows
      how many people are waiting.
- [ ] Joining the waitlist stores the person with their position; the same duplicate-email rule
      applies across attendees _and_ waitlist (case-insensitive).
- [ ] The person gets a "You're on the waitlist (#N)" email.
- [ ] Attendees can cancel (e.g. via a link in their confirmation email containing a
      hard-to-guess token).
- [ ] Cancelling frees the seat and, in the **same transaction**, promotes the earliest waitlisted
      person to attendee. They receive a "You're in!" email.
- [ ] Two concurrent cancellations never promote the same person twice, and the event never goes
      over capacity (keep the `SELECT ... FOR UPDATE` pattern from `rsvp-service.ts`).
- [ ] Past events: no waitlist, no cancellation.
- [ ] Schema change via `schema.ts` + `pnpm db:generate` (no hand-written SQL).
- [ ] Tests: unit tests for the promotion rule; integration tests for join, cancel + promote, and a
      concurrency case; a Playwright spec for joining the waitlist on RAG Deep Dive.
