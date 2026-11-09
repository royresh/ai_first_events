# Workshop feature cards

Pick one card, hand it to your AI coding agent, and ship it. Each card lists **goals** (what the
user gets) and **acceptance criteria** (how you know it's done). Cards are ordered by difficulty.

| #   | Card                                                        | Level   | Touches                              |
| --- | ----------------------------------------------------------- | ------- | ------------------------------------ |
| 01  | [Search & filter events](01-easy-search-filter.md)          | Easy    | web, api                             |
| 02  | [Add to calendar (.ics)](02-easy-add-to-calendar.md)        | Easy    | web, api or web route                |
| 03  | [Waitlist when full](03-medium-waitlist.md)                 | Medium  | db migration, api, web, email        |
| 04  | [Admin RSVP dashboard](04-medium-admin-rsvp-dashboard.md)   | Medium  | api, web                             |
| 05  | [QR-code check-in](05-stretch-qr-checkin.md)                | Stretch | db migration, api, web, email        |
| 06  | [Email reminders 24h before](06-stretch-email-reminders.md) | Stretch | db migration, api (scheduler), email |

## Tips for working with your agent

- Point it at `AGENTS.md` first; it lists the commands and the rules.
- Ask it for a short plan before it writes code, and push back if the plan skips tests.
- "Done" means: `make test` is green, `make e2e` is green if you touched the UI, and the agent
  (or you) clicked through the feature in the browser.
- Schema changes go through `packages/db/src/schema.ts` + `pnpm db:generate`. Never edit SQL by hand.
