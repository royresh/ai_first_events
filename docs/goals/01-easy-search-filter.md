# 01 · Search & filter events (Easy)

## Goals

- As a visitor, I can type in a search box on `/` and see only events whose title or description
  matches.
- As a visitor, I can filter the list by location.
- As a visitor, I can hide full events.

## Acceptance criteria

- [ ] A search input on `/` filters events by title or description, case-insensitively.
- [ ] A location filter shows the distinct locations of upcoming events; choosing one narrows the list.
- [ ] A "Hide full events" toggle removes events where `isFull` is true (e.g. RAG Deep Dive).
- [ ] Filters live in the URL (`/?q=rag&location=...&hideFull=1`) so a filtered view can be shared
      and survives a refresh.
- [ ] No matches shows a friendly empty state with a "Clear filters" link.
- [ ] Filtering happens on the server (API query params on `GET /events`, validated with zod in
      `packages/shared`), not by downloading everything to the browser.
- [ ] Tests: integration tests for the new query params; a Playwright spec that searches and filters.

## Hints

- Add the query schema to `packages/shared/src/schemas.ts` and use it in both api and web.
- A plain `<form method="get">` works fine with server components; no client state needed.
