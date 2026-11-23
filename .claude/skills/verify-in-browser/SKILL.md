---
name: verify-in-browser
description: Walk through a user-facing change in a real browser, the way an attendee would, before calling it done. Use after changing anything in apps/web or any flow that sends email.
---

# Verify in the browser

Passing tests are not enough. Before saying a change is done, use it like a real person would.

1. **Pick the flow.** Name the user journey the change affects, e.g. "RSVP, get the email, cancel".
2. **Make sure the app is running** at http://localhost:3000 (`make dev` or `make up`). Don't start a
   second copy if one is already running.
3. **Walk through it with the Playwright MCP.** Click and type like a user. Don't call the API directly
   to skip steps.
4. **Check the email too.** If the flow sends email, open Mailpit at http://localhost:8025 and follow
   any links in it.
5. **Report what you saw at each step.** If something is wrong, stop and explain it in plain language
   before changing any code.
6. **After a fix:** add a Playwright spec in `e2e/tests` that would have caught it, then walk through
   the flow again.
