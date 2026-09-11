# Inputs

The material that shaped the prompts in [prompts.md](./prompts.md): the brief I was working
from, the conventions every prompt inherited, and what I knew about the two test targets
before writing a line of code.

> **On voice:** these documents are written by me, Eben Smith. Throughout `docs/`, *I* and
> *my* mean the author. The AI assistant is always named — *Claude*, or *the assistant* —
> and never speaks in first person.

---

## 1. The brief

From the *Senior QA Engineer Take-Home Exercise*:

**Targets** — SauceDemo (`https://www.saucedemo.com/`) and JSONPlaceholder
(`https://jsonplaceholder.typicode.com/`).

**Mine to decide** — the brief leaves language and tooling, framework structure, which
scenarios to automate, how tests are organised and executed, how the framework is
validated, and what needed fixing after reviewing the AI output to the candidate. Every one
of those calls in this repository is mine; Claude argued for and against options, and I
picked.

**Deliverables** — a repository built from scratch, a working framework covering both
targets, every prompt used, the inputs behind those prompts, and an evaluation of the
AI-generated output.

**Budget** — approximately four hours, with the brief stating that technical decisions,
testing approach, and evaluation of the AI output count for more than the number of tests.

Two things I took from that last line. The documentation is half the exercise, not a
cover letter attached to it — so it gets close to half the time. And a small suite of
scenarios chosen for a reason beats a large one generated because generating was cheap.

---

## 2. Project conventions

Standing rules that applied to every prompt, whether or not I restated them:

- **No `any`.** Anywhere. This is what pushed API response handling toward schema-derived
  types rather than casting `res.json()`.
- **No comments in code** unless specifically asked for. Names and structure carry the
  intent; prose explanation belongs in `docs/`.
- **No `console.log`.** Reporters and traces, not print statements.
- **Build in small pieces, and run each piece immediately.** No generating six files and
  then debugging them together.
- **Never skip tests.** A test that cannot pass gets removed or gets an honest mechanism —
  which is exactly why `test.fail()` probes were the right answer for the known defects and
  `test.skip()` was not.
- **Run the tests before committing.**
- **Explicit file paths when staging commits**, never `git add .`.
- **One branch per layer**, small enough to read in a sitting. In order: `zod-schema`,
  `api-client-first-pass`, `web-auth`, `qas-be-shopping`, `defect-probes`, `readme` — each
  merged to `main` before the next began.

---

## 3. Target research

Notes gathered before scoping the scenarios. Both targets have characteristics that punish
a naively generated suite, and designing around them drove most of the interesting
decisions.

### SauceDemo

A deliberately flawed storefront used for QA training. Six accounts share one password, and
five of the six are broken on purpose:

| Account | Behaviour |
| --- | --- |
| `standard_user` | Works correctly |
| `locked_out_user` | Rejected at login with an error |
| `problem_user` | Same placeholder image for every product; checkout last-name field rejects input; several Remove buttons do nothing |
| `performance_glitch_user` | Several seconds of injected latency |
| `error_user` | Fails partway through checkout |
| `visual_user` | Layout and styling defects |

**Consequence for the framework.** A suite that only drives `standard_user` passes every
run and demonstrates nothing, against an application whose entire purpose is to contain
bugs. The broken accounts are the most valuable thing on the site, so the same journeys run
across them and the failures are captured as `test.fail()` probes — assertions of correct
behaviour that currently fail by design, and that will turn the suite red the day SauceDemo
fixes one.

### JSONPlaceholder

A read-only fixture API that *simulates* writes. `POST` returns `201` and an echoed body
with `id: 101` every time; `PUT`, `PATCH`, and `DELETE` return success codes. None of it
persists — a `GET` afterward returns the original resource, and `GET /posts/101` is a 404.

**Full verified behaviour is in [api-behavior.md](./api-behavior.md)** — every status code,
every response body, the `collection size + 1` id rule, and the commands to re-verify it.
That document is the reference; this section is the summary.

**Consequence for the framework.** The obvious generated test — create a resource, then
fetch it to confirm — is wrong here, and can appear to pass for the wrong reason. Since a
write cannot be verified by reading it back, the response contract is the only assertion
available: status codes, headers, and full schema validation of every field, with the
persistence limitation documented rather than worked around. This is what made rigorous
schema validation worth a dependency instead of a handful of `expect` calls.

**Payload shapes, verified rather than assumed.** Before writing the schemas I fetched each
endpoint and tested the validators against the real values. Every row below is a field where
the obvious, confident-looking schema is wrong — and a generated one would very likely
contain at least the first two:

| Field | Actual value | The plausible guess | Why it fails |
| --- | --- | --- | --- |
| `user.website` | `hildegard.org` | `z.url()` | A bare hostname with no protocol. `z.url()` rejects it outright. |
| `user.address.geo.lat` / `.lng` | `"-37.3159"` | `z.number()` | They are strings. 12 of the 20 coordinates in the dataset are negative, so the sign has to be part of the pattern. |
| `user.address.zipcode` | `"92998-3874"` | five-digit pattern | ZIP+4 |
| `user.phone` | `"1-770-736-8031 x56442"` | phone regex | Carries an extension |
| `post.body` | contains `\n` | single-line string | Multi-line |
| `user.email` | `Sincere@april.biz` | `z.email()` | Correct as-is — worth confirming rather than assuming, since the neighbouring fields are not |

The general lesson, and the one I would carry to a real API: a schema that *looks* right is
the most dangerous artifact in contract testing, because it fails against production data
rather than in review. Checking the payload takes two minutes.

**`GET /users` returns ids 1–10 exactly.** That is an identity contract, and asserting it
beats asserting a count of ten — ten arbitrary users would satisfy a length check.

---

## 4. Stack

| Choice | Reasoning |
| --- | --- |
| TypeScript | Type safety at the test-authoring boundary; no `any` is enforceable |
| Playwright Test | One runner for both targets — the `request` fixture covers the API natively, so web and API share a config, a reporter, and a single command |
| Zod | Runtime contract validation and static types from a single schema, so the two cannot drift |

**No CI.** I planned a GitHub Actions workflow and dropped it. It is not asked for by the
brief, and it was my own suggestion that survived into an approved plan unexamined — see
[P-30](./prompts.md). The deciding factor was that both targets are live third-party sites, so
a bad day at SauceDemo produces a red badge that says nothing about this framework. The
validation gates run locally through `npm run validate` and would drop into any CI system
unchanged.
