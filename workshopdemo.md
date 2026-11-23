# Workshop demos: checking AI-written code

Six live demos. In each one an AI agent shipped something that passes `make test`, and we find out
what's really wrong with it: by using it like a real user, by testing the tests, or by attacking it.

| #   | Demo                          | Branch                  | App runs on | Setup                              |
| --- | ----------------------------- | ----------------------- | ----------- | ---------------------------------- |
| 1   | Cancel RSVP from the email    | `demo/cancel-rsvp`      | Docker      | `./scripts/demo.sh setup cancel`   |
| 2   | Add to calendar               | `demo/add-to-calendar`  | Docker      | `./scripts/demo.sh setup calendar` |
| 3   | Who tests the tests?          | `demo/mutation-testing` | `make dev`  | `./scripts/demo.sh setup mutation` |
| 4   | Two people, one last seat     | `demo/race-condition`   | `make dev`  | `./scripts/demo.sh setup race`     |
| 5   | The agent attacks its own app | `demo/privacy-leak`     | `make dev`  | `./scripts/demo.sh setup privacy`  |
| 6   | A weird search                | `demo/sql-injection`    | `make dev`  | `./scripts/demo.sh setup sqli`     |

Every demo branch has a `-fixed` twin with the finished fix, as a fallback.

## Between demos: `scripts/demo.sh`

```bash
./scripts/demo.sh setup <demo>   # switch branch, clean up, fresh data, empty inbox
./scripts/demo.sh reset          # run the current demo again (discards the agent's changes)
./scripts/demo.sh fallback       # live run went wrong: switch to the -fixed branch
./scripts/demo.sh stop           # stop every `make dev` from this repo
./scripts/demo.sh finish         # back to main with the normal Docker stack
./scripts/demo.sh status         # branch, ports, containers, uncommitted changes
```

`setup`, `reset` and `fallback` ask before discarding changes in `apps/`, `packages/` and `e2e/`.

**After every `setup`:**

- For `make dev` demos, run `make dev` in a second terminal tab and leave it running.
- Open a **new** Claude session, after switching branch. It picks up the slow-motion browser
  (1.5 s per click), and no other session should be holding the Playwright browser.
- In `make dev` demos, if the agent wants to run e2e tests, tell it: _"The app is already running with
  hot reload; run `pnpm test:e2e` instead of `make e2e`."_ (`make e2e` starts Docker on the same ports.)

**Tip:** end the first prompt with _"Don't change any code yet."_ That gives you a pause to show the
audience the bug before the agent fixes it.

---

## Demo 1: Cancel RSVP from the email

```bash
./scripts/demo.sh setup cancel
```

**Prompt 1: find it**

> We just shipped cancel-RSVP from the confirmation email, and `make test` passes. Before we ship,
> walk through it in the browser with the Playwright MCP as a real attendee: RSVP to "Intro to AI
> Coding Agents", find the confirmation email in Mailpit at http://localhost:8025, follow the cancel
> link, and cancel. Describe what you see at each step. If something is broken, stop and explain it in
> plain language. Don't change any code yet.

The agent ends on **"Link not valid"** right after clicking "Cancel my RSVP".

**Show: the cancel actually worked**

- http://localhost:3000/events/1: the count is back to 3 and the name is gone.
- http://localhost:8025: there's a "Your RSVP … is cancelled" email.

Say: _"Every test was green. The system did the right thing, then told the user the opposite. Imagine
the support calls."_

**Prompt 2: fix it**

> Fix it. Add a Playwright test that would have caught this, run `make e2e`, then repeat the same
> walkthrough in the browser.

After the fix: cancelling lands on the event page with a green banner, and opening the same link
again correctly says "Link not valid".

---

## Demo 2: Add to calendar

```bash
./scripts/demo.sh setup calendar
```

**Prompt**

> "Add to calendar" is on this branch and `make test` passes. Before we ship it, check it in the
> browser against the Docker stack at localhost:3000, the way an attendee would: open an event, click
> Add to calendar, and check the file you get. Fix anything that's broken, add a Playwright test that
> would have caught it, then check it in the browser again.

---

## Demo 3: Who tests the tests?

```bash
./scripts/demo.sh setup mutation   # then: make dev (second tab)
```

Analogy: a fire drill for smoke detectors. Stryker lights a match under each one (plants a small bug)
and checks whether the alarm goes off (a test fails).

**Step 1 (you): "The AI wrote tests, and they all pass."**

```bash
pnpm test:unit
```

All green. Say: _"Looks great. But are these tests actually checking anything?"_

**Step 2 (you): "Let's light some matches."**

```bash
pnpm --filter @aifirst/api test:mutation
open apps/api/reports/mutation/index.html
```

97.3%: one bug survived. In the report, open `rsvp-rules.ts` and point at the red line. Bouncer
story: instead of _"is your name already on the list?"_ he asks _"does every name on the list match
yours?"_

**Step 3 (agent): show what the survivor breaks**

> Mutation testing reported a surviving mutant in `apps/api/src/domain/rsvp-rules.ts`. Apply exactly
> that mutant to the real code. The app is running with hot reload at http://localhost:3000. Then use
> the Playwright MCP to show what it breaks for a real user: open the "Intro to AI Coding Agents"
> event and RSVP as Dana Levi with dana@example.com, who is already registered. Then reload the page so
> we can see the attendee list. Don't fix anything yet.

Dana Levi appears twice (3 going → 4 going).

**Step 4 (agent): put it back**

> Now undo the mutant, and in the browser try the exact same RSVP again.

"This email is already registered for this event."

**Step 5 (agent): close the gap**

> Write a unit test in `apps/api/test/unit/rsvp-rules.test.ts` that would have caught this bug, then
> rerun mutation testing and show me the score.

100%. Say: _"Green tests aren't proof. A tool tested the AI's tests, and the AI closed the gap."_

---

## Demo 4: Two people, one last seat

```bash
./scripts/demo.sh setup race   # then: make dev (second tab)
```

Analogy: two ticket counters with one seat left. Both clerks look at the seating chart at the same
moment, both see "1 left", and both sell it. The fix: only one clerk can hold the chart at a time.

**Step 1: it works when you click through it**

> The latest commit changed how RSVPs are saved. Check it in the browser with the Playwright MCP: RSVP
> to "Prompt Engineering Lab" as one new attendee and confirm it works, including the email in Mailpit
> at http://localhost:8025.

**Step 2: the tests disagree**

> Run `make test` and explain any failure in plain language.

**Step 3: show it in the app**

> Show the audience this bug in the real app. Using the API at http://localhost:4000, fill "Prompt
> Engineering Lab" (event 2) until exactly one seat is left, then send 20 RSVPs at the same moment.
> Then open the event page in the browser with the Playwright MCP.

"30 going · capacity 25" next to the red Full badge (the number varies).

**Step 4: fix it**

> Fix it so the last seat can only be taken once, but keep the "only confirm once the email is sent"
> behaviour. Then repeat the 20-person race and run `make test`.

25 / 25 and everything green.

---

## Demo 5: The agent attacks its own app

```bash
./scripts/demo.sh setup privacy   # then: make dev (second tab)
```

Analogy: a shop window that only shows names, but every customer's address is taped to the back of
the display, facing the street.

**Step 1 (agent): a curious outsider**

> Act as an anonymous visitor with no account. Using the Playwright MCP on http://localhost:3000, look
> for any way to get personal information about other attendees, like their email addresses. Explain
> each thing you try in plain language. Don't change any code yet.

It notices the attendee search finds people by email, then finds every address in the page's HTML.

**Step 2 (you): show it yourself**

In your own Chrome, open `view-source:http://localhost:3000/events/1`, press Cmd+F and type
`@example`. Every email lights up.

**Step 3 (agent): fix it**

> Fix this so no attendee email ever reaches the browser on public pages. Add a Playwright test that
> would have caught it, then check the page again in the browser. The app is already running with hot
> reload; run `pnpm test:e2e` instead of `make e2e`.

Bonus: the agent may point out that `/admin` and the API on port 4000 have no login at all. True, and
not planted: the agent finds things you didn't plant.

---

## Demo 6: A weird search

```bash
./scripts/demo.sh setup sqli   # then: make dev (second tab)
```

Analogy: a librarian who follows whatever you write on the request slip. An attacker writes "find
events called… and also hand me the guest list", and the librarian does it, because the request and
the instructions are written on the same slip.

**You play the attacker; the agent plays the defender.** Don't ask the agent to write or run the
attack: Claude's safeguards may (rightly) refuse, even against your own app.

**Step 1 (agent): find it**

> /security-review

or: _"Review the latest commit for security problems and explain any you find in plain language."_

**Step 2 (you): show the impact.** Paste this into the search box at http://localhost:3000/:

```
zzz%') GROUP BY events.id UNION SELECT a.id, a.email, a.name, a.name, now() + interval '1 day', now() + interval '2 days', 1, now(), 0 FROM attendees a --
```

The home page fills with cards titled `dana@example.com`, `omar@example.com`… A single `'` on its
own makes the page error: the classic first warning sign. Say: _"The AI flagged it. I'm the bad guy
here."_

**Step 3 (agent): fix it**

> Fix the problem in the event search so user input can never change the database query. Add an
> integration test showing that search text containing quotes and SQL keywords is treated as plain
> text, then run `make test`.

**Step 4 (you): confirm.** Paste the same text again: "No events match…". A normal search like
`rag` still works.

Say: _"The AI is very good at finding and fixing this. It won't hand anyone a working attack, and
that's a feature."_

Don't ask the agent to read `apps/api/test/integration/events.test.ts` on the `-fixed` branch on stage:
it contains the full payload.

---

## After the talk

```bash
./scripts/demo.sh finish
```
