---
name: incremental-verification
description: How to pace work in this repository - write one small piece, run it immediately, show the output, then continue. Use when adding or changing any spec, page object, API client, schema, fixture, or config. Applies to every code change, not just tests.
---

# Write a little, run it, show it

## The rule

**One small piece. Run it. Show the output. Then the next piece.**

A "piece" is one thing that can pass or fail on its own:

- one test, or one case added to an existing table
- one page object, or one method added to one
- one client method
- one schema
- one config change

Not a piece: a page object *and* the spec that uses it *and* a refactor of three other
specs. That is three pieces, and it gets three runs.

## Why this repository works this way

Because it has already failed twice here, in exactly the way this prevents:

**Six files, zero runs.** The `ApiResult` type, three API clients, a fixture, and a
refactored spec were all written before anything was executed. It happened to pass, which is
the worst outcome, because it teaches that skipping the runs was fine.

**A 120-line auth spec.** Written in one block. Two of its seventeen tests failed on the
first run, and the cause was two layers away from the failing line - `data-test="open-menu"`
turned out to sit on a decorative `<img>` inside the real button, so the click was
intercepted by the button on top of it. Finding that inside one new test is a two-minute
job. Finding it inside seventeen new tests, three new page objects, a new fixture, and a
config change means first working out *which* of those changes is even responsible.

That is the whole argument. Debugging cost does not scale linearly with batch size, because
the work is not fixing the bug, it is isolating it. A run between each piece keeps the
suspect list at one.

## The loop

1. Write one piece.
2. Run the narrowest command that covers it.
3. Show the actual output - pass or fail.
4. Only then start the next piece.

Never write the next piece while a run is pending or a failure is unexplained.

## Commands, narrowest first

```bash
npx playwright test --project=web --grep "session lifecycle"   # one describe block
npx playwright test tests/web/login.spec.ts                     # one spec file
npm run test:web                                                # one project
npm run test:api
npm run typecheck                                               # after any type or config change
npm run validate                                                # before every commit
```

Prefer `--grep` and single files during a build. Save `validate` for commit time.

## Building a table-driven test

Add **one** case, run it, then expand the table. A parameterized block that fails on its
first run fails for every row at once, and the shared cause is hidden behind the noise.

## Reporting back

Show the run output, not a summary of it. "Tests pass" is not a result; the pass line with
its count and timing is. When something fails, show the failure and the diagnosis before
writing the fix - the fix is a new piece and gets its own run.

## When a run is expensive

If a piece genuinely cannot be verified in isolation - a config change that only shows up
across the whole suite, say - say so explicitly and run the wider command. The rule is about
keeping the suspect list short, not about the size of the command.
