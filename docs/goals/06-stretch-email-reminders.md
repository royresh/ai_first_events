# 06 · Email reminders 24h before the event (Stretch)

## Goals

- As an attendee, I get a reminder email about 24 hours before an event I RSVP'd to.

## Acceptance criteria

- [ ] A background job in the API runs periodically (e.g. every minute) and finds attendees of
      events starting in the next 24 hours who have not been reminded yet.
- [ ] Each of them gets exactly one reminder email (subject includes the event title and start
      time), visible in Mailpit at http://localhost:8025.
- [ ] Reminders are never sent twice, even if the job runs on two API instances at once or crashes
      mid-batch (record `reminded_at`; claim rows atomically, e.g. `UPDATE ... RETURNING` or
      `FOR UPDATE SKIP LOCKED`).
- [ ] People who RSVP less than 24 hours before the start get their reminder on the next run.
- [ ] Past events never get reminders.
- [ ] The job can be triggered manually for demos: `POST /admin/reminders/run` returns how many
      emails were sent.
- [ ] Schema change via `schema.ts` + `pnpm db:generate`.
- [ ] Tests: unit tests for "who is due" logic with an injected clock; integration test that runs
      the job and checks Mailpit, then runs it again and checks nothing new was sent.
