---
name: page-object-model
description: Conventions for page objects, component objects, API clients, fixtures, and specs in this repository. Use when creating or reviewing any file under src/pages, src/api, src/fixtures, or tests/ - covers where assertions are allowed to live, the waiting-vs-asserting boundary, locator exposure, and naming.
---

# Page Object Model conventions

## The one rule

**Page objects and API clients perform actions and expose state. Tests make assertions.**

Everything below follows from that.

## Why

An assertion inside a page object causes four problems.

**It hides failures.** An assertion throws at the point it fails, so every later assertion
in the calling test never runs. One broken thing masks the others, and the next run only
reveals the second failure after the first is fixed.

**It misattributes failures.** A page method is called by many tests. When its internal
assertion breaks, the test that reports red is often unrelated to the thing that actually
broke, and diagnosis starts in the wrong place.

**It makes tests unreadable as specifications.** If half the verification happens offscreen,
you cannot tell what a test covers by reading it, and reviewers cannot tell whether it
covers what it claims.

**It blocks negative testing.** A `login()` that verifies a successful landing cannot be
used to test a locked-out account. Teams work around this by adding
`loginExpectingFailure()`, and the duplication spreads through the whole object.

## Waiting is not asserting

Page objects may wait for the application to reach a state they need in order to continue.
They may not verify that the state is correct.

Use `locator.waitFor()`, which throws a timeout when the app never gets there. Do not use
`expect()`, which reports a verification failure.

Allowed in a page object:

```ts
async removeItem(name: string): Promise<void> {
  const row = this.itemRow(name)
  await row.getByTestId('remove').click()
  await row.getByTestId('add-to-cart').waitFor()
}
```

Not allowed in a page object:

```ts
async removeItem(name: string): Promise<void> {
  await this.itemRow(name).getByTestId('remove').click()
  await expect(this.cartBadge).toHaveText('0')
}
```

The second version silently verifies cart arithmetic on behalf of every test that removes
an item, and no test file says so.

**This is enforced, not merely encouraged:** nothing under `src/` may import `expect`.
`npm run lint:assertions` greps for it, and `npm run validate` runs that before the suite. If a page object seems to need `expect`, it needs `waitFor` instead, or the
check belongs in the test.

## Exposing state

Default to exposing readonly locators and letting tests use web-first assertions on them.
Those retry until timeout, which makes them substantially less flaky than reading a value
once.

```ts
readonly cartBadge: Locator
readonly errorMessage: Locator
```

```ts
await expect(inventory.cartBadge).toHaveText('1')
```

Add a query method returning data only when the test genuinely has to compute something -
ordering, arithmetic, set comparison:

```ts
async itemNames(): Promise<string[]>
async itemPrices(): Promise<number[]>
```

```ts
const prices = await inventory.itemPrices()
expect(prices).toEqual([...prices].sort((a, b) => a - b))
```

Query methods snapshot a single moment, so the page must already be settled when they are
called. Prefer a locator wherever a locator will do.

## Page object shape

- Constructor takes `page` and assigns locators. It never navigates and never waits.
- Navigation is explicit: `await loginPage.goto()`.
- An action that lands the user on a different page returns that page object.
- Methods are named for user intent, not mechanics: `addItemToCart`, not `clickAddButton`.
- Selectors appear in exactly one place. A raw selector string in a spec file is a bug.
- Prefer `getByTestId`, `getByRole`, and `getByLabel`. SauceDemo exposes `data-test`
  attributes throughout, so `getByTestId` is the default here. Two caveats, both learned the
  hard way:
  - Playwright's `getByTestId` reads `data-testid` by default, not `data-test`. The config
    sets `testIdAttribute: 'data-test'`; without it every `getByTestId` call silently times
    out against an element that is plainly in the DOM.
  - A test id is not always on the element you can click. `data-test="open-menu"` sits on a
    decorative `<img>` inside the burger button, and clicking it fails with "intercepts
    pointer events" because the real `<button>` overlays it. When a test id resolves to a
    non-interactive node, target the interactive element instead and prefer a stable id.
- One object per page. Anything appearing on several pages - the header, the cart badge,
  the sort dropdown - is a component object under `pages/components/` and is composed in.
- No `any`. No `page.waitForTimeout()`. Ever.

## API clients

The same rule, for the same reasons.

A client issues the request and returns the status, headers, and an unparsed body. It does
not check status codes and does not run schema validation, because a client that throws on
a non-2xx response cannot test a 404, and a client that parses internally turns a contract
violation into a client crash instead of a readable assertion.

```ts
const res = await postsApi.getById(1)

expect(res.status).toBe(200)
const post = PostSchema.parse(res.body)
expect(post.id).toBe(1)
```

The body is typed `unknown` until a Zod schema narrows it. That is the only sanctioned way
to get a typed response, and it keeps the contract check visible in the test where it
belongs.

### Writes never persist

JSONPlaceholder simulates every write: `POST` returns `201` with `id: collection size + 1`,
`PUT` and `PATCH` return `200` with a convincing body, `DELETE` returns `200` and `{}`, and
the server state never changes. Full verified behaviour is in `docs/api-behavior.md`.

**Never write a test that creates a resource and then fetches it to confirm.** That test is
wrong here in a dangerous way - it does not simply fail, it can pass for the wrong reason,
because the API returns a well-formed success response either way. A green write test that
verifies nothing is worse than no write test.

Assert the response contract exhaustively instead: exact status code, strict schema, echoed
values matching what was sent, and the assigned id matching the documented rule. Then assert
the limitation itself - that the resource is *not* retrievable afterwards - so the suite
turns red if the API ever gains a real backend.

## Test files

- Every assertion in the suite lives in a spec file.
- No `if`, no `try/catch` around assertions, no loops that might assert zero times. A test
  that branches is not a deterministic test.
- Tests do not depend on other tests, on execution order, or on shared mutable state. Fresh
  authentication comes from a fixture.
- One scenario per test. If the name needs "and", it is probably two tests.
- Test names state the expected behaviour, not the steps: `rejects a locked out account`,
  not `enters credentials and clicks login`.
- Never `test.skip()`. A test that cannot pass is either deleted or written as a
  `test.fail()` defect probe that asserts the correct behaviour and documents the bug.

## Fixtures

Specs receive constructed page objects and API clients through the extended `test` in
`src/fixtures/`. A spec should not call `new LoginPage(page)`.

## Review checklist

- [ ] No `expect` imported anywhere under `src/`
- [ ] No `any`, no `console.log`, no `waitForTimeout`, no code comments
- [ ] Page methods either act and return void, or return data - not both
- [ ] Every selector lives in a page or component object
- [ ] Every assertion lives in a spec
- [ ] Page methods are usable in both positive and negative tests
- [ ] Test names describe behaviour and would still read correctly to someone who has never
      seen the application
