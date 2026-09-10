# Prompt Log

Every prompt I gave Claude while building this framework, in order, with what it produced
and what I decided as a result. Entries are appended as work happens and committed
alongside the code they produced, so the git history shows the log growing with the
framework rather than being assembled at the end.

> **On voice:** these documents are written by me, Eben Smith. Throughout `docs/`, *I* and
> *my* mean the author — the quoted prompts are mine, and every **What I decided** line is
> my call. The AI assistant is always named, and never speaks in first person.

Standing constraints that apply to every prompt in this log (project conventions, house
rules, and background research on the two test targets) live in [inputs.md](./inputs.md).
My assessment of where the AI output was good, wrong, or needed rework lives in
[ai-evaluation.md](./ai-evaluation.md).

**Tooling:** Claude Code (Opus 5), CLI, working directly in this repository.

---

## Phase 0 — Planning

### P-01 · Read the brief and propose a strategy

*2026-09-10*

> Heya Shirt Brother. This is a repo that I created for a coding test that I am taking for
> a new company that I applied for. I'm going to give you the directions and then let's put
> together a plan of action for our testing strategy. Read the Senior QA Engineer Take-Home
> Exercise pdf, and let's start planning!

**What Claude produced:** Located and read the exercise PDF, inspected the empty repo, and produced a
plan: TypeScript + Playwright for both targets, a proposed directory structure, ~25
scenarios split across web and API, and a build order. Two observations I had not prompted
for and had not considered:

1. Three of the six deliverables are documents, and the brief explicitly says technical
   decisions and AI evaluation matter more than test count — so the docs deserve close to
   half the four-hour budget, and the prompt log has to be written as work happens.
2. SauceDemo's broken users and JSONPlaceholder's non-persisting writes are the two traps
   the framework has to be designed around, not around.

**What I decided:** Accepted the stack and structure. Flagged that the "known issues" handling
needed more explanation before I could choose, which became P-02.

---

### P-02 · Expand the options for handling known site defects

*2026-09-10*

> Ask the questions again, but can you give more information around the option for handling
> the known issues in the site?

**What Claude produced:** Three concrete approaches with code samples, run output, and tradeoffs for
each: `test.fail()` defect probes, characterization tests that assert the buggy behavior,
or exercising `standard_user` only.

**What I decided:** Chose `test.fail()` defect probes. Deciding factor was the failure mode
when SauceDemo eventually fixes something — a probe turns the suite red and tells me,
whereas a characterization test fails in a way that reads like my test regressed. It also
respects my rule against skipped tests: the probe executes on every run.

---

### P-03 · Justify Zod over plain Playwright assertions

*2026-09-10*

> What is zod and why do I want to use this? Why can't we just use playwright to make the
> calls?

**What Claude produced:** The distinction I was missing — Playwright makes the HTTP calls either way;
the open question is what validates the response. `res.json()` returns `any`, which both
breaks the project's no-`any` rule and means assertions only cover the fields I happened to
remember. Zod derives the runtime check and the static type from one schema. The point that
settled it: because JSONPlaceholder fakes its writes, a create cannot be verified by
re-reading it, so the response contract is the only assertion available and needs to be
airtight. Also offered hand-rolled type guards as a zero-dependency alternative at roughly
40 minutes more work.

**What I decided:** Chose Zod as a devDependency.

---

### P-04 · Start the prompt log

*2026-09-10*

> Let's use zod. Also when are we going to start keeping track of prompts?

**What Claude produced:** This file and [inputs.md](./inputs.md), backfilled from the session so far.

**What I decided:** Adopted the discipline of appending an entry per meaningful exchange and
committing it with the related code.

---

### P-05 · Fix the authorial voice in the docs

*2026-09-10*

> when it says that it is "My choice to make" is that me as in Eben or me as in Claude? Can
> you clarify? I want it to be me as in Eben.

**What Claude produced:** An explicit voice convention added to the top of both documents,
the ambiguous line rewritten to state that the brief leaves those decisions to the
candidate and that every one of them in this repository is mine, and the two halves of each
log entry renamed to **What Claude produced** / **What I decided** so they cannot blur
together.

**What I decided:** Kept it. First person had to mean me in a document a hiring reviewer
reads, and the ambiguity was mine to catch — Claude had written both docs in my voice
without ever establishing whose voice it was. Also noted that `ai-evaluation.md` gets
written in my own words at the end rather than generated; a self-assessment of AI output
that reads as though the AI wrote it is worth very little.

---

### P-06 · Page Object Model ground rules, captured as a team skill

*2026-09-10*

> Yes, but let's also discuss the layout and structure. I enjoy using the page object model
> layout for all web/e2e testing. We also need to set up some ground rules for the pages.
> Pages should contain actions and not tests when we can help it. The tests themselves
> should contain all of the actual assertions. This will ensure that we only test what we
> intended, and helps alleviate situations where a failing test could actually hide another
> failure. Let's create a skill for this endeavor and put it in our repo for checkin with
> the team.

**What Claude produced:** The directory layout, plus three additions to the rule I set:

1. A fourth argument for it I had not made — a page method that asserts cannot be reused in
   negative tests, so `login()` verifying success forces a second `loginExpectingFailure()`
   and the duplication spreads.
2. The boundary case that erodes the rule in practice: page objects must wait for state in
   order to act, and `await expect(x).toBeVisible()` is an assertion. Resolved by allowing
   `locator.waitFor()` (a timeout) and banning `expect()` (a verification) inside `src/`,
   which makes the rule greppable in CI rather than aspirational.
3. The retry tradeoff between exposing locators and exposing query methods — web-first
   assertions retry, data getters snapshot once — settled as locators by default, query
   methods only where the test computes.

Then applied the same rule to the API clients: return status, headers, and an unparsed
body; let the spec run `Schema.parse()`.

**What I decided:** All of it, written to `.claude/skills/page-object-model/SKILL.md` so it
serves as both team documentation and a working constraint on future AI-assisted changes in
this repo. The enforceable version of the rule is the part that matters: "no assertions in
page objects" is a convention every team agrees to and few sustain, because nothing checks
it. A grep in CI checks it.

---

## Phase 1 — Scaffold

### P-07 · Build the scaffold

*2026-09-10*

> Let's do this, shirt brother!

**What Claude produced:** Zod installed, `.gitignore`, a strict `tsconfig.json`,
`playwright.config.ts` carrying only the `api` project so far, npm scripts including
`typecheck` and `lint:assertions` (the grep that enforces the no-`expect`-in-`src` rule),
and a single API smoke test asserting status and content type against `/posts/1`.

**What I decided:** Kept the incremental shape — configuring only the `api` project rather
than declaring `web` and `defects` ahead of any file existing. The smoke test deliberately
uses the raw `request` fixture with no client and no schema, because its only job is to
prove the config, base URL, and runner work before anything is built on top of them.
Passed in 249ms.

---

### P-08 · `baseUrl` in TypeScript 7

*2026-09-10*

> Can't you make it the actual baseUrl?

**What Claude produced:** The `typecheck` gate caught `TS5102: Option 'baseUrl' has been
removed` — TypeScript 7 deleted the option outright. Claude's first move was to drop it and
keep only the `@/*` alias, which I pushed back on. The behaviour is recoverable, because
TS 7 resolves `paths` relative to the tsconfig's own directory, so `"*": ["./*"]` is the
literal equivalent of `baseUrl: "."`. Both styles are now configured.

**What I decided:** Kept both — `@/pages/login.page` and `src/pages/login.page` each
resolve. Also asked for runtime verification rather than trusting the typecheck, since
`tsc` passing does not prove Playwright resolves the same aliases; a throwaway probe spec
confirmed both, and was deleted. Worth noting that the scaffold's own gate caught a real
configuration error on its first run, which is the argument for building the gates before
the tests.

---

## Phase 2 — API contract schemas

### P-09 · Branch strategy

*2026-09-10*

> yes, let's do that. Let's create a branch from main that is called "zod-schema". Let's do
> our work in this branch so we can keep them small and easy to read, please.

**What Claude produced:** Branched `zod-schema` from `main` and, before writing anything,
verified the Zod 4 API surface — `z.strictObject` replaces the deprecated `.strict()`, and
`z.int()` is now a top-level type. Most Zod examples online are still v3.

**What I decided:** One branch per layer, each small enough to review in a sitting, merged
before the next begins. Also adopted the habit of checking the installed library's actual
API rather than accepting code written against a remembered version — the same class of
error as the `baseUrl` removal in P-08, and both were caught by verifying instead of
assuming.

---

### P-10 · Plan before implementing

*2026-09-10*

> Please do this, my cat just jumped on my machine.

**What Claude produced:** The cat had triggered plan mode. Rather than treat it as noise,
Claude used the detour to fetch all three endpoints live, test the validators against the
real values, and write the plan around what came back — which is where the `z.url()` and
`geo` string findings in [inputs.md](./inputs.md) came from.

**What I decided:** Kept the plan and approved it. The accident was useful: I had been
about to write schemas from what the payloads obviously looked like, and two of the fields
did not look like what they are. The verification step is now part of how I approach any
contract work, not a one-off.

---

### P-11 · Justify the regex

*2026-09-10*

> but can you tell me why we are using the "-?" in the regex? I know that it is for "zero or
> 1" of a character, but I'm not sure why we are doing it.

**What Claude produced:** A breakdown of `/^-?\d+(\.\d+)?$/` — `-?` is the optional minus
sign for negative coordinates, and `$` is what stops `"-37.3159abc"` passing. Then, instead
of arguing from the one sample, it ran the pattern across all 20 coordinates in the live
dataset: **12 are negative**, so without `-?` the schema rejects most of the data.

**What I decided:** Kept it, and asked the same question of the rest of the pattern. That
turned up something the sample would not have shown — every coordinate in the dataset has a
decimal point, so `(\.\d+)?` is never exercised. I left it optional anyway, because a
coordinate of exactly `0` or `45` is legitimate and a contract test that flagged it would be
reporting a defect that does not exist. Contract tests should be tight against wrong data
and generous toward valid data that simply has not appeared yet.

---

### P-12 · Assert identity, not shape

*2026-09-10*

> but I think we might want to be more specific. Just making sure that we have 10 users
> doesn't ensure that they are the correct users.

**What Claude produced:** Confirmed `GET /users` returns ids `1–10` exactly, and rewrote the
spec to assert that set rather than a length, pin the identifying fields of user 1, and
cross-check `/users/1` against the same record inside `/users` so the two endpoints must
agree.

**What I decided:** This was the weakest test in the branch and it was mine to catch.
`toHaveLength(10)` passes for any ten users, so it verified the *shape* of the response
while proving nothing about its *content* — a test that looks like coverage and is not. The
cross-endpoint check is the one I would keep above the others: it catches a real class of
bug that neither a count nor a schema ever will.

---

### P-13 · Prove the contracts can fail

*2026-09-10*

Not a typed prompt — Claude proposed this unprompted, flagging that it went beyond the
approved plan rather than adding it quietly.

**What Claude produced:** `tests/api/schema-guards.spec.ts`, which feeds the contracts an
unexpected field, a stringified id, a missing field, and a non-numeric coordinate, and
asserts each is rejected.

**What I decided:** Kept it. Thirteen green tests prove nothing on their own if the
assertions cannot fail, and the specific risk is real: someone changing `z.strictObject` to
`z.object` would silently disable contract detection across the entire suite while every
test stayed green. This is the framework testing its own safety net, and it is the honest
answer to the brief's question about how the framework is validated.

---

## Phase 3 — API client layer

### P-14 · Branch the client layer

*2026-09-10*

> ok, it's merged, let's pull down main and branch. Let's call it "api-client-first-pass"
> and let's get started.

**What Claude produced:** Before writing anything, exercised every write endpoint live and
recorded the results — `POST` → `201` with `id: 101`, `PUT` → `200` full replace, `PATCH` →
`200` merged against the stored record, `DELETE` → `200` `{}`, and `GET /posts/1` afterwards
still returning the original title. Then the client layer: `ApiResult`
(`{ status, headers, body: unknown, text }`), three resource clients, and a fixture injecting
them.

**What I decided:** Approved the shape. One detail I would not have thought of: the fixture
deliberately does **not** re-export `expect` alongside `test`, which is the usual Playwright
idiom, because doing so would put the word `expect` inside `src/` and trip our own
`lint:assertions` gate. Specs import `test` from the fixture and `expect` from Playwright.
Slightly unusual, and worth the consistency.

---

### P-15 · Document the persistence behaviour

*2026-09-10*

> let's also make sure we add some documentation about the way that things persist here,
> please. It seems like an important piece of information for us going forward.

**What Claude produced:** [api-behavior.md](./api-behavior.md), and — checking rather than
repeating the folklore — a finding I had not seen written down anywhere: **`POST` returns
`collection size + 1`, computed and not allocated.** Two consecutive `POST`s to `/posts` both
return `101`; `/comments` returns `501`, `/users` returns `11`, `/todos` returns `201`. The
id is deterministic, so it is safe to assert, but it identifies nothing.

**What I decided:** Wrote it in three places on purpose, because a fact this important should
not live in one file. `docs/api-behavior.md` is the reference with the commands to re-verify
it, `docs/inputs.md` summarises and links, and — the part that matters — a rule went into
`.claude/skills/page-object-model/SKILL.md` so it constrains anyone (or anything) writing
tests in this repo later. Documentation that only humans read gets skipped; the skill file
does not.

---

### P-16 · Run the tests

*2026-09-10*

> and let's make sure we are running the tests. This is a lot of work that hasn't really been
> verified yet.

**What Claude produced:** Stopped and ran everything. It passed, but that was luck as much as
anything.

**What I decided:** This is the correction I would most want a reviewer to see, because it is
the failure mode of AI-assisted development in one line. Claude had written six files —
result type, three clients, a fixture, a refactored spec — without executing any of them,
which is exactly the "generate a lot, debug it all at once" pattern my own conventions in
[inputs.md](./inputs.md) exist to prevent. The output looked plausible the whole way, which
is the problem: plausibility is not verification, and an assistant produces plausible code
faster than I can review it. **Verification cadence has to be enforced by me.** The tooling
will not ask.

---

### P-17 · Missing awaits

*2026-09-10*

> but do we need an await for the results?

**What Claude produced:** Confirmed the calls were awaited — the two that looked bare are
`Promise.all` array elements, deliberately not awaited individually so the requests go out in
parallel. Then, rather than asking me to take that on faith, it deliberately removed an
`await` and ran the typechecker:

```
tests/api/users.spec.ts(25,17): error TS2339:
  Property 'status' does not exist on type 'Promise<ApiResult>'.
```

**What I decided:** Kept the pattern, and noted the payoff. Because clients return
`Promise<ApiResult>` and not `any`, a forgotten `await` cannot ship — it fails the typecheck
gate before a single test runs. Had I let `res.json()` stay `any`, the same mistake would
silently produce `undefined` and either pass for the wrong reason or fail somewhere
unrelated. This is the concrete argument for the no-`any` rule that I would give in an
interview.

---

### P-18 · Confirm the intent of the delete tests

*2026-09-10*

> just to verify that we are deleting but not expecting it to delete due to the persistence
> issues, correct?

**What Claude produced:** Confirmed, and named the pair: one test asserts the API *claims*
success (`200`, `{}`), the other asserts nothing actually happened (the post is still
retrievable). It also drew a distinction I had not made explicit — SauceDemo's bugs get
`test.fail()` probes because they are genuine defects, while JSONPlaceholder's
non-persistence is documented, intended behaviour of a fixture API and so is asserted
directly.

**What I decided:** Kept it, and had the file restructured into two `test.describe` blocks —
`write response contracts` and `writes report success but never persist`. Read cold, a test
named *a deleted post is still retrievable afterwards* looks like someone endorsing broken
behaviour. Comments are banned in this repo, so the grouping carries the intent instead, and
it shows up in the report output where a reviewer will actually see it.

---

### P-19 · Consistent naming

*2026-09-10*

> hey can we keep the syntax consistent? the test itself calls it a deleted post, but the
> variable name is removed. Let's keep it as deleted, please.

**What Claude produced:** Traced it one level further than I had — the client method was
`remove()` as well — and renamed the whole chain so the HTTP verb, the client method, the
variable, and the test name all say the same word: `DELETE` → `delete()` → `deleted` → *a
deleted post*.

**What I decided:** Kept it. Small, but this is the kind of drift that accumulates in
generated code: each file is individually reasonable and the vocabulary quietly diverges
across them. Nothing in the toolchain flags it, so it is on review to catch.

---

## Phase 4 — Web authentication

### P-20 · Authentication is its own suite, weighted toward failure

*2026-09-10*

> as far as authentication: I believe that this should be its own set of tests, and we can
> really do a ton of work here. The big thing is that we need to make sure we are verifying
> failure states, too, using the logins that will cause failures.

**What Claude produced:** Drove the real site with a browser before designing anything, and
came back with a correction to my framing: **only `locked_out_user` actually fails at
login.** `problem_user`, `performance_glitch_user`, `error_user`, and `visual_user` all
authenticate successfully and land on `/inventory.html` — their defects are entirely
post-login. It also captured the exact error strings, and found that the username is
validated before the password, and that the route guard names the specific path it blocked.

**What I decided:** Split the coverage accordingly — auth owns the locked account plus the
credential-level failures, and the other four accounts move to `defect-probes`. I had been
loosely thinking of "the broken users" as a single group that would fail somewhere; they do
not, and the suite is organised better for knowing where.

This is also where the page object rule paid off concretely. `LoginPage.login()` asserts
nothing, so one method drives the success case and all six failure cases. Had it verified a
successful landing, every failure test would need a second method and the negative coverage
would have been second-class — which is exactly the argument Claude made back in P-06.

---

### P-21 · Where `baseURL` lives

*2026-09-10*

> why aren't we using the baseUrl in the playwright config?

**What Claude produced:** It was there, but per-project rather than top-level, and the
reason is that the two projects point at different hosts — the `api` project at
JSONPlaceholder, the `web` project at SauceDemo. Playwright merges top-level `use` with each
project's, so shared settings (`trace`, `testIdAttribute`) sit up top and the host sits per
project. Both are env-overridable for pointing at a staging host.

**What I decided:** Kept it. Worth writing down because the same word means two unrelated
things in this repository: `baseUrl` in `tsconfig.json` (removed in TypeScript 7, see P-08)
and `baseURL` in the Playwright config. They are unconnected, and I conflated them.

---

### P-22 · Credentials out of the specs

*2026-09-10*

> do you think we should create a file that allows us to keep the users and the passwords
> out of the tests? I don't know if they will care about this or not, but it seems like an
> important thing to me. I usually put a ton of that in a file you can get from a secrets
> vault.

**What Claude produced:** Agreed on the pattern and pushed back on the scale. SauceDemo's
credentials are printed on its own login page — they are not secrets, and building vault
integration around public demo values would be padding a reviewer could read as such. What it
did instead: one module owns credentials, no literals in specs, and the password reads
`process.env.SAUCE_PASSWORD` with a fallback to the public value. The seam for a real vault
or CI secret exists; the repository still clones and runs with zero setup.

It also flagged something I did not know: Playwright traces capture `fill()` values, so on a
real system the password field needs masking in tracing rather than relying on
`type="password"`.

**What I decided:** Took the middle path. The instinct behind the question is the one I would
defend in an interview — credentials belong in configuration with an environment seam, and
that is true whether or not these particular values matter.

---

### P-23 · Enforce the verification cadence

*2026-09-10*

> but let's make sure that we are running tests after creation. I don't do well with large
> blocks of code, and prefer to verify as we go, please. Can you add that as a skill? I want
> to try and approve a small piece of code, run the tests and then move on to the next small
> block. I find it works better for me.

**What Claude produced:** `.claude/skills/incremental-verification/SKILL.md`, and an
admission that it had just done the thing again — a 120-line auth spec written in one block
without a single run.

Then the run, which is the part that makes the case. Two of seventeen tests failed, and the
cause was two layers from the failing line: `data-test="open-menu"` sits on a decorative
`<img>` inside the burger button, so clicking it fails with "intercepts pointer events"
because the real `<button>` overlays it.

**What I decided:** This is the second time I have had to give this correction (see P-16),
which is the point — the assistant did not carry the lesson forward on its own, and my global
conventions already said to work this way. Stating a preference in prose does not change
behaviour; the skill file is in the repository so it binds the next session too.

The failure itself was worth having. Finding that selector problem inside one new test is two
minutes. Finding it inside seventeen new tests, three page objects, a new fixture, and a
config change means first working out which change is even responsible. Debugging cost does
not scale with batch size, because the work is isolation, not repair.

It also produced a second correction to a rule I had accepted earlier: "prefer `getByTestId`"
is not unconditional. Playwright reads `data-testid` by default, so the config needs
`testIdAttribute: 'data-test'` or every call silently times out — and a test id is not always
on the element you can actually click. Both caveats went into the page object skill.

---

## Phase 5 — Shopping journey

### P-24 · Branch the shopping journey

*2026-09-10*

> I agree with the shopping journey. Let's call it "qas-be-shopping" for funsies. You should
> be able to pull main and branch now, shirt brother!

**What Claude produced:** Probed the whole flow before writing anything — catalogue, sort
option values (`az`/`za`/`lohi`/`hilo`), cart, all three checkout pages, and the validation
messages. Confirmed tax is exactly 8% of subtotal and total is subtotal plus tax, against two
different baskets rather than one.

Then, checking raw text rather than parsed numbers, it found a **real defect on
`standard_user`**: the checkout subtotal renders as `Item total: $57.980000000000004`. Full
writeup in [defects.md](./defects.md).

**What I decided:** Kept the finding and pinned it with a `test.fail()` probe rather than
filing it away in prose. Two things make it worth more than its cosmetic severity. It is not
one of the bugs SauceDemo advertises — it is on the account that is supposed to work. And it
is invisible to a numeric assertion: `57.980000000000004` passes `toBeCloseTo(57.98, 2)`
without complaint, so only an assertion on the rendered string catches it. That is a lesson
about assertion choice, not about SauceDemo.

---

### P-25 · Parameterise the saved sessions

*2026-09-10*

> but wouldn't it be easier to let them select a user and then use storageState to keep it
> going? Or do you have an argument for actually just using standard user?

**What Claude produced:** Conceded immediately — it had built the session setup for this
branch instead of the next one. Rewrote it to save a session per account, keyed by user, with
`storageStatePath(user)`.

The measurement that settled it: `performance_glitch_user` takes **5.7 seconds** to log in by
design. The `defect-probes` branch will run several tests against it. Logging in through the
UI per test pays that latency every time; one saved session pays it once. Setup tests run in
parallel, so all five sessions cost about one slow login of wall clock.

**What I decided:** Mine, and I would make the same call again. The point was not that the
parameterised version is more elegant — it is that the very next branch needs four other
accounts, so building it for one user was work that would be thrown away within the hour.
Adding an account is now a data change rather than a code change, which is what you want on
a real application with roles.

---

### P-26 · Name things for what they do

*2026-09-10*

> but why is it called slug? I don't think that is a very good descriptive name for our
> variable.

**What Claude produced:** Renamed it to `productTestId`, and noticed while doing so that the
function had been duplicated into both `InventoryPage` and `CartPage`. Extracted it to
`src/pages/product-test-id.ts` so both import one copy.

**What I decided:** Kept both changes. "Slug" is URL jargon borrowed from a different problem
domain; what the function actually does is map a product's display name to the identifier
SauceDemo embeds in its `data-test` attributes. The rename says that, the old name said
nothing.

Worth noting the duplication came along for free — the question was about a name and it
surfaced a copy-paste. This is the second naming issue in this repository (see P-19), and both
times the drift was invisible to the toolchain and only caught by reading.

---

### P-27 · A name for the shopper

*2026-09-10*

> but can you change the user to be "Bart-Harley Jarvis"?

**What Claude produced:** Changed the checkout shopper, and wired the validation cases to read
from the same `SHOPPER` constant instead of carrying their own copies of the name.

**What I decided:** Took the constant refactor as well. Three literal copies of a name across
one file is exactly how the `remove`/`deleted` drift in P-19 started. The hyphenated first
name is also a slightly better test input than a plain one.

---

## Phase 6 — Defect probes

### P-28 · Probe the broken accounts

*2026-09-10*

> ok, it's merged, Shirt Brother! Let's move on to the next piece, please!

**What Claude produced:** Drove all four authenticating accounts through the same battery —
images, names, prices, sorting, add, remove, checkout, finish — against `standard_user` as a
control, then re-verified the two most surprising results before writing anything. Nine
defects, each pinned by a `test.fail()` probe. Full writeup in [defects.md](./defects.md).

Two findings I would not have predicted:

**`visual_user` does not have visual defects.** I assumed layout and styling, which is what
the name suggests. Its prices are simply *wrong*, and **regenerated on every page load** —
three consecutive reads of the same six products returned three completely different price
sets, while `standard_user` stayed stable. That also explains why sorting looks broken for
this account: the values are re-randomised between the sort and the read, so no ordering could
ever hold.

**`problem_user`'s last name field is bound to the first name field.** Typing `LASTVALUE` into
Last Name produced `first="LASTVALUE" last=""`. Checkout is impossible for this account.

**What I decided:** Kept all nine, and pinned `problem_user` and `error_user`'s shared
symptoms as separate probes rather than one parameterised pair. They look identical, but
nothing guarantees they share a cause, and a fix for one would not close the other. Also kept
`error_user`'s two probes for sorting and remove even though they duplicate `problem_user`'s,
for the same reason.

The one I would put in front of a reviewer is [DEFECT-08](./defects.md#defect-08).
`error_user` gets *further* than the others — correct items, correct totals on the overview
page — and then swallows the order at the final click, with no error shown. Every earlier step
passes, so a smoke test that stops short of the last click reports the account as healthy.
That is the argument for driving journeys to completion rather than asserting on intermediate
pages.

**On the framework side:** extracted `SHOPPER` to `src/data/shopper.ts` when the checkout
details were about to be duplicated into a second spec, which is the same drift caught in P-19
and P-26 — the third time in this project, and the first time it was caught before the
duplication landed rather than after.

---

## Decisions made through the question/answer tool

Some of my choices were made by picking from options Claude laid out rather than by typing
a prompt. Recording them here so the log is complete.

| Decision | Choice | Reasoning |
| --- | --- | --- |
| Handling known site defects | `test.fail()` defect probes | Self-maintaining defect log; goes red when the app is fixed; nothing is skipped |
| Disclosing AI assistance | Full disclosure in docs and commit trailers | The exercise is explicitly about AI-assisted development, so hiding it would undercut the submission |
| API contract validation | Zod | One schema yields both the runtime check and the type, so they cannot drift |
