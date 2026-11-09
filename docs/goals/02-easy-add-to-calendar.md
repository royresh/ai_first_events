# 02 · Add to calendar (Easy)

## Goals

- As an attendee, I can click **Add to calendar** on an event page and get a file my calendar
  app (Google, Apple, Outlook) can import.

## Acceptance criteria

- [ ] Every event detail page has an **Add to calendar** button.
- [ ] Clicking it downloads `<event-title>.ics` (`Content-Type: text/calendar`).
- [ ] The file is a valid iCalendar `VEVENT` with: `UID`, `DTSTAMP`, `DTSTART`/`DTEND` in UTC,
      `SUMMARY` (title), `LOCATION`, `DESCRIPTION`, and a `URL` back to the event page.
- [ ] Commas, semicolons and newlines in text fields are escaped per RFC 5545; lines use CRLF.
- [ ] Unknown event ids return 404.
- [ ] Tests: unit test for the .ics builder (including escaping); a Playwright spec that clicks the
      button and checks the download's name and contents.

## Hints

- A tiny pure function `buildIcs(event)` is easy to unit test; no library needed.
- You can serve it from the API (`GET /events/:id/calendar.ics`) or from a Next.js route handler.
