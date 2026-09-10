# Defects found

> **On voice:** written by me, Eben Smith. Throughout `docs/`, *I* and *my* mean the author.
> The AI assistant is always named.

Defects this framework found in SauceDemo, each pinned by a `test.fail()` probe so the suite
reports it on every run and turns red the day it is fixed. See
`.claude/skills/page-object-model/SKILL.md` for why probes rather than skipped tests.

---

## DEFECT-01 — Checkout subtotal renders unrounded floating point

**Severity:** low visually, high in what it implies
**Account:** `standard_user` — **not** one of SauceDemo's advertised broken accounts
**Pinned by:** `tests/web/checkout.spec.ts` → *known defects* → *the subtotal should be
rendered to two decimal places*

### Steps

1. Sign in as `standard_user`
2. Add **Sauce Labs Fleece Jacket** ($49.99) and **Sauce Labs Onesie** ($7.99) to the cart
3. Check out and reach the overview page
4. Read the item total

### Expected

`Item total: $57.98`

### Actual

```
subtotal-label   raw -> "Item total: $57.980000000000004"
tax-label        raw -> "Tax: $4.64"
total-label      raw -> "Total: $62.62"
```

### Analysis

`49.99 + 7.99` in IEEE-754 double precision is `57.980000000000004`. The application sums
item prices as raw floats and renders the subtotal with no rounding or currency formatting.
Tax and total *are* formatted correctly, so the defect is isolated to the subtotal display —
the arithmetic itself is right.

**It is data-dependent.** A basket of Sauce Labs Backpack ($29.99) and Bike Light ($9.99)
renders a clean `$39.98`, because that pair happens to sum exactly in binary floating point.
This is why the probe pins a specific basket: a test written against the wrong two products
would pass and report the bug as absent.

### Why it matters more than it looks

The visible symptom is cosmetic. What it reveals is that money is being handled as binary
floating point, which is the wrong representation for currency. On a real storefront the same
underlying choice produces rounding discrepancies in totals, tax, and reconciliation — and
those are not cosmetic. I would raise this as a data-type issue in the pricing layer, not as a
formatting bug in the view.

### Notable

Every other defect in this document is one SauceDemo advertises through its broken accounts.
This one is on the account that is supposed to work, and I found it by checking raw response
text rather than parsed numbers — the parsed value `57.980000000000004` compares equal to
`57.98` under `toBeCloseTo`, so an assertion on the number alone passes cleanly and the bug
stays invisible. It only surfaces when you look at what the user actually sees.
