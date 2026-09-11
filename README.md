# QA Automation Framework

Test automation for two targets in one suite: the **SauceDemo** storefront and the
**JSONPlaceholder** API. TypeScript, Playwright, Zod.

**87 tests · 12 spec files · ~17 seconds · one command**

Built for a Staff QA Engineer take-home exercise. It finds real bugs — see
[Defects found](#defects-found).

---

## Contents

[Quick start](#quick-start) · [What is covered](#what-is-covered) · [Layout](#layout) ·
[Design decisions](#design-decisions) · [How the framework validates itself](#how-the-framework-validates-itself) ·
[Defects found](#defects-found) · [Documentation](#documentation) · [Commands](#commands)

---

## Quick start

Requires **Node 22** and a network connection — both targets are live public sites.

```bash
git clone git@github.com:blargen/qa-automation-framework.git
cd qa-automation-framework
npm ci
npx playwright install chromium
npm test
```

That runs everything.

```bash
npm run report        # open the HTML report
```

---

## What is covered

| Project | Tests | What it exercises                                                                      |
| ------- | ----- | -------------------------------------------------------------------------------------- |
| `api`   | 27    | Response contracts for posts, comments and users; filtering; 404s; the write endpoints |
| `setup` | 5     | Signs in once per account and saves the session                                        |
| `web`   | 55    | Login, sorting, cart, checkout, price arithmetic, and 10 defect probes                 |

**Web, in more detail**

| Area           | Tests | Notes                                                                               |
| -------------- | ----- | ----------------------------------------------------------------------------------- |
| Authentication | 17    | Weighted toward failure: 6 credential cases, 3 route-guard paths, session lifecycle |
| Sorting        | 6     | All four orderings, plus "nothing lost or duplicated"                               |
| Cart           | 9     | Badge counts, contents match selection, removal, persistence across navigation      |
| Checkout       | 13    | Full journey, field validation, cancel paths, totals checked against the catalogue  |
| Defect probes  | 10    | Real bugs, pinned — see below                                                       |

---

## Layout

```
src/
  api/         Typed clients over Playwright's request fixture
  schemas/     Zod response contracts
  pages/       Page objects, one per page
  fixtures/    Injects clients and page objects into specs
  data/        Accounts, products, shopper details, session paths
tests/
  api/         API specs
  web/         Web specs, including defect probes
  setup/       Saves an authenticated session per account
docs/          Strategy, prompt log, API behaviour, defect reports
.claude/skills/  Conventions that bind, not just describe
```

---

## Design decisions

### One runner for both targets

Playwright's `request` fixture handles the API natively, so web and API share one config, one
reporter, one HTML report and one command. No second toolchain to justify or maintain.

### Page objects act. Tests assert.

Every assertion in the suite lives in a spec file. Page objects expose locators and perform
actions; they never verify. This is enforced, not merely encouraged — **nothing under `src/`
may import `expect`**, and `npm run lint:assertions` fails the build if it does.

The payoff is concrete: `LoginPage.login()` asserts nothing, so one method drives the success
case _and_ all six failure cases. Had it verified a successful landing, every negative test
would need a second method.

Full conventions: [`.claude/skills/page-object-model/SKILL.md`](.claude/skills/page-object-model/SKILL.md)

### Contracts, not persistence

**JSONPlaceholder fakes every write.** `POST` returns `201` and an id, and nothing is saved.
The obvious test — create a resource, then fetch it to confirm — is not merely wrong here; it
can _pass for the wrong reason_, because the API returns a well-formed success response either
way.

So the response contract is the assertion: exact status codes, strict Zod schemas that reject
unexpected fields, echoed values matching what was sent. Then the limitation itself is
asserted — that a created post is **not** retrievable, that a deleted post **is**.

Verified behaviour and re-check commands: [`docs/api-behavior.md`](docs/api-behavior.md)

### Defects get probes, not skips

SauceDemo ships deliberately broken accounts. Tests that expose them assert the **correct**
behaviour and are marked `test.fail()`. They execute on every run, report as expected
failures, and turn the suite **red the day a bug is fixed**.

Nothing is skipped. A skipped test is invisible; a probe is a defect log that maintains itself.

### One sign-in per account

`performance_glitch_user` takes ~5.7 seconds to authenticate _by design_. Sessions are saved
once per account in setup and reused, so that latency is paid once rather than per test.
Authentication itself has its own dedicated suite, so nothing is lost by skipping login
elsewhere.

### Credentials live in configuration

No credentials in specs. `SAUCE_PASSWORD` is read from the environment with a fallback to the
public demo value, so the seam for CI secrets or a vault exists while the repository still
clones and runs with zero setup. Base URLs are overridable the same way
(`WEB_BASE_URL`, `API_BASE_URL`).

---

## How the framework validates itself

A suite that cannot fail proves nothing. Four layers check this one:

| Gate                              | What it catches                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`               | No `any`, and a **missing `await` is a compile error** — clients return `Promise<ApiResult>`, so `.status` on an un-awaited call will not build |
| `npm run lint:assertions`         | Any assertion that leaked into `src/`                                                                                                           |
| `tests/api/schema-guards.spec.ts` | Feeds the contracts an extra field, a stringified id, a missing field and a junk coordinate, and asserts each is **rejected**                   |
| 10 `test.fail()` probes           | Confirm the suite still detects known bugs, and alarm when one is fixed                                                                         |

`npm run validate` runs all of it.

The schema guards exist for a specific risk: someone changing `z.strictObject` to `z.object`
would silently disable contract detection across the whole API suite while every test stayed
green.

---

## Defects found

Ten probes pin nine defects. Full reports: [`docs/defects.md`](docs/defects.md)

| Account         | Defect                                               |
| --------------- | ---------------------------------------------------- |
| `standard_user` | Checkout subtotal renders as `$57.980000000000004`   |
| `problem_user`  | All six products share one image                     |
| `problem_user`  | Sorting does not reorder                             |
| `problem_user`  | Remove button does not remove                        |
| `problem_user`  | **Last name field writes into the first name field** |
| `error_user`    | Sorting does not reorder                             |
| `error_user`    | Remove button does not remove                        |
| `error_user`    | **Finish silently drops the order**                  |
| `visual_user`   | Prices are wrong and **change on every page load**   |

Three of these are worth a reviewer's attention.

**The subtotal bug is on the account that works** — not one SauceDemo advertises. It survives
`toBeCloseTo(57.98, 2)`, so only an assertion on the rendered string catches it. What it
reveals is money held as binary floating point, which is a pricing-layer problem, not a
formatting one.

**`error_user` reaches the overview page with correct items and totals**, then loses the order
at the final click with no error shown. Any smoke test that stops before that click reports the
account as healthy.

**`visual_user` has no visual defects.** Its prices are simply wrong, and regenerated on every
render — three consecutive reads returned three different price sets. That also explains why
its sorting appears broken: the values change between the sort and the read.

---

## Documentation

| Document                                         | What it holds                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| [`docs/inputs.md`](docs/inputs.md)               | The brief, project conventions, and target research done before writing code    |
| [`docs/prompts.md`](docs/prompts.md)             | Every prompt used during development, with what came back and what was decided  |
| [`docs/ai-evaluation.md`](docs/ai-evaluation.md) | What the AI-assisted process got right, what it got wrong, and what was changed |
| [`docs/api-behavior.md`](docs/api-behavior.md)   | JSONPlaceholder's verified write behaviour and why nothing persists             |
| [`docs/defects.md`](docs/defects.md)             | Defect reports with evidence and reproduction steps                             |

Three conventions are written as skills in [`.claude/skills/`](.claude/skills/) so they
constrain future work rather than merely describing past work:
[page object rules](.claude/skills/page-object-model/SKILL.md),
[incremental verification](.claude/skills/incremental-verification/SKILL.md), and
[dependency verification](.claude/skills/dependency-verification/SKILL.md).

---

## Commands

| Command                   | Does                                        |
| ------------------------- | ------------------------------------------- |
| `npm test`                | Everything                                  |
| `npm run test:api`        | API project only                            |
| `npm run test:web`        | Web project only (runs session setup first) |
| `npm run typecheck`       | TypeScript, no emit                         |
| `npm run lint:assertions` | Fails if `src/` imports `expect`            |
| `npm run validate`        | Typecheck, then lint, then the full suite   |
| `npm run report`          | Open the HTML report                        |

Narrow a run while working:

```bash
npx playwright test --project=web --grep "session lifecycle"
npx playwright test tests/web/checkout.spec.ts
```

Point at another environment:

```bash
WEB_BASE_URL=https://staging.example.com npm run test:web
```
