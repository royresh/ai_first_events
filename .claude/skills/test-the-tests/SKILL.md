---
name: test-the-tests
description: Check whether the unit tests for the RSVP business rules actually catch bugs, using mutation testing. Use when adding or changing rules in apps/api/src/domain, or when asked how good the tests are.
---

# Test the tests

Green tests and full coverage don't prove the tests check anything. Mutation testing plants small
bugs in the code, one at a time, and checks whether a test fails.

1. **Run it:** `pnpm --filter @aifirst/api test:mutation`
2. **Read the score.** "Killed" means a test caught the planted bug. "Survived" means no test noticed.
3. **For each survivor, explain what it would break for a real user,** in one plain sentence.
   For example: "nobody could RSVP to an event with no attendees yet".
4. **Write a unit test that kills it** in `apps/api/test/unit/`. Name the test after the user-visible
   behaviour, not the code.
5. **Run it again** and report the new score.

Never change the code under test to make a survivor go away. Only add or improve tests.
