# 05 · QR-code check-in (Stretch)

## Goals

- As an attendee, my confirmation email contains a personal QR code.
- As an organizer, I can scan or paste that code at the door to check people in.
- As an organizer, I can see who has arrived.

## Acceptance criteria

- [ ] Each attendee gets a unique, unguessable check-in token (not their id or email).
- [ ] The confirmation email includes the QR code (inline image) and the token as text.
- [ ] `/admin/events/[id]/checkin` page: scan with the device camera **or** paste a token.
- [ ] Valid token → attendee marked checked in with a timestamp; the page shows a big green
      "Welcome, <name>!".
- [ ] Already checked in → clear "Already checked in at <time>" message (no double counting).
- [ ] Token for a different event, or an unknown token → clear error.
- [ ] Admin views show "checked in X / going Y".
- [ ] Schema change via `schema.ts` + `pnpm db:generate`.
- [ ] Tests: unit tests for check-in rules; integration tests for check-in endpoint (valid, repeat,
      wrong event, unknown); a check that the email in Mailpit contains the token; a Playwright spec
      using the paste-a-token path.
