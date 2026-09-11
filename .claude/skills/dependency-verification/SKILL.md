---
name: dependency-verification
description: Check what a library actually installs before writing code against it. Use whenever adding a dependency, using an unfamiliar API, upgrading a major version, or writing code from a remembered idiom or a web example. Covers version checks, API probes, and which gates do and do not catch version drift.
---

# Check the installed API, not the remembered one

## The rule

**Before writing code against a dependency, confirm the version on disk and probe the API you
are about to use.** Never write from a remembered idiom or a copied example without checking
it against what is actually installed.

This takes about thirty seconds and has already prevented two defects in this repository.

## Why this repository works this way

Two failures, same cause, within one hour of each other.

**`baseUrl` was written into `tsconfig.json`.** TypeScript 7 removed the option outright. The
config looked completely ordinary — `baseUrl` has been standard for a decade — and the error
only appeared when `tsc` ran:

```
tsconfig.json(21,5): error TS5102: Option 'baseUrl' has been removed.
```

**Zod v3 idioms were nearly used against v4.** `.strict()` and `z.number().int()` are the
familiar v3 forms, and most examples online still show them. The installed version is 4.x,
where `z.strictObject()` and `z.int()` are the current forms.

The second one matters more than the first, because of what the gates do **not** catch.

## What the gates catch, and what they miss

| | Caught by `npm run typecheck`? |
| --- | --- |
| An option or export that was **removed** (`baseUrl` in TS 7) | **Yes** — it fails to compile |
| An API that still exists but is **deprecated or superseded** (`.strict()`, `z.number().int()` in Zod 4) | **No** — both compile clean |

Verified: in the installed Zod 4, `o.strict()` and `z.number().int()` are both still functions
and `tsc --noEmit` reports no error on either. So the typecheck gate is a partial net with a
real hole in it, and the hole is exactly where remembered idioms land — code that works today,
carries no warning, and quietly diverges from how the library is meant to be used.

Nothing automated closes that gap. Checking is the only guard.

## How to check

**Version actually installed** — read it from `node_modules`, not from the range in
`package.json`. The range says what is permitted; only the lockfile and the installed tree say
what is there.

```bash
node -e "console.error(require('zod/package.json').version)"
```

**Probe the API before using it.** Confirm the members exist and behave as expected:

```bash
node --input-type=module -e "
import { z } from 'zod'
console.error('strictObject:', typeof z.strictObject)
console.error('int:', typeof z.int)
console.error('rejects unknown key:', !z.strictObject({ a: z.int() }).safeParse({ a: 1, b: 2 }).success)
"
```

**For config and tooling, run the tool early.** A config file cannot be probed — write the
smallest version that expresses the intent and run `npx tsc --noEmit` or `npx playwright test`
before building on it. Both scaffold errors in this repository surfaced on the first run of a
gate that existed before any tests did.

**When a check contradicts a plausible memory, believe the check.** `z.url()` rejecting
`hildegard.org` and `geo.lat` being a string both looked wrong and were correct.

## When this applies

- Adding any dependency
- Using an API for the first time in this repository
- Any major version that is recent, or any library with a well-known older idiom
- Writing code from a web example, documentation snippet, or memory
- A test failing in a way that suggests the library behaves differently than expected

## What not to do

Do not pin exact versions to avoid this. `npm ci` plus the committed lockfile already gives
every machine the same tree, which is why the README says `npm ci` and not `npm install`.
Pinning trades one problem for a staler one. The fix is checking, not freezing.
