# Defects found

> **On voice:** written by me, Eben Smith. Throughout `docs/`, *I* and *my* mean the author.
> The AI assistant is always named.

Defects this framework found in SauceDemo. Each is pinned by a `test.fail()` probe that
asserts the **correct** behaviour, so it runs on every execution, reports as an expected
failure while the bug exists, and turns the suite **red the day it is fixed**. Nothing is
skipped. See `.claude/skills/page-object-model/SKILL.md` for why probes rather than
`test.skip()`.

All behaviour below was verified against the live site on 2026-09-10, not taken from
SauceDemo's documentation.

## Summary

| ID | Account | Defect |
| --- | --- | --- |
| [01](#defect-01) | `standard_user` | Checkout subtotal renders unrounded floating point |
| [02](#defect-02) | `problem_user` | Every product shows the same image |
| [03](#defect-03) | `problem_user` | Sorting does not reorder the catalogue |
| [04](#defect-04) | `problem_user` | Remove button does not remove |
| [05](#defect-05) | `problem_user` | Last name field writes into the first name field |
| [06](#defect-06) | `error_user` | Sorting does not reorder the catalogue |
| [07](#defect-07) | `error_user` | Remove button does not remove |
| [08](#defect-08) | `error_user` | Finishing checkout does not complete the order |
| [09](#defect-09) | `visual_user` | Prices are wrong and change on every page load |

`locked_out_user` is covered in `tests/web/login.spec.ts` rather than here, because it fails
at authentication and never reaches the application. `performance_glitch_user` authenticates
and behaves correctly; its defect is latency (measured at ~5.7s to sign in), which the
framework absorbs by saving its session once in setup rather than logging in per test.

---

<a id="defect-01"></a>
## DEFECT-01 — Checkout subtotal renders unrounded floating point

**Account:** `standard_user` — **not** one of the advertised broken accounts
**Probe:** `tests/web/checkout.spec.ts` → *known defects*

Add **Sauce Labs Fleece Jacket** ($49.99) and **Sauce Labs Onesie** ($7.99), then check out.

Expected `Item total: $57.98`. Actual:

```
subtotal-label   raw -> "Item total: $57.980000000000004"
tax-label        raw -> "Tax: $4.64"
total-label      raw -> "Total: $62.62"
```

`49.99 + 7.99` in IEEE-754 double precision is `57.980000000000004`. Prices are summed as raw
floats and the subtotal is rendered with no rounding. Tax and total *are* formatted, so the
arithmetic is right and only the subtotal display is wrong.

**Data-dependent.** Backpack ($29.99) + Bike Light ($9.99) renders a clean `$39.98`, because
that pair sums exactly in binary. A probe pinned to the wrong basket would report the bug as
absent.

**Invisible to the obvious assertion.** `57.980000000000004` passes `toBeCloseTo(57.98, 2)`.
Only asserting on the rendered string catches it.

**Why it matters more than it looks.** The symptom is cosmetic; what it reveals is that money
is held as binary floating point, which is the wrong representation for currency. On a real
storefront the same choice produces rounding discrepancies in totals and reconciliation. I
would raise this against the pricing layer, not the view.

---

<a id="defect-02"></a>
## DEFECT-02 — Every product shows the same image

**Account:** `problem_user` · **Probe:** *every product should have its own image*

Six products, six `<img>` elements, **one unique `src`** between them. Product names, prices,
and descriptions are all correct, so a suite that only checks text passes cleanly.

---

<a id="defect-03"></a>
## DEFECT-03 — Sorting does not reorder the catalogue

**Account:** `problem_user` · **Probe:** *sorting by price high to low should reorder the catalogue*

Selecting *Price (high to low)* leaves the order untouched:

```
before: 29.99, 9.99, 15.99, 49.99, 7.99, 15.99
after:  29.99, 9.99, 15.99, 49.99, 7.99, 15.99
```

The dropdown updates its own label, so the control looks like it responded.

---

<a id="defect-04"></a>
## DEFECT-04 — Remove button does not remove

**Account:** `problem_user` · **Probe:** *removing a product should restore the add to cart button*

Adding works and the button correctly becomes **Remove**. Clicking Remove does nothing — the
button stays, and the cart is never emptied. A shopper can add items and cannot take them
back out.

---

<a id="defect-05"></a>
## DEFECT-05 — Last name field writes into the first name field

**Account:** `problem_user` · **Probe:** *the last name field should keep what is typed into it*

The clearest bug on the site. Typing into **Last Name** overwrites **First Name** and leaves
Last Name empty:

```
after typing first only  -> first="FIRSTVALUE" last=""
after typing last        -> first="LASTVALUE"  last=""
```

Checkout is therefore impossible for this account: continuing always reports
`Error: Last Name is required`. The two inputs are bound to the same piece of state.

---

<a id="defect-06"></a>
## DEFECT-06 — Sorting does not reorder the catalogue

**Account:** `error_user` · **Probe:** *sorting by price high to low should reorder the catalogue*

Identical to [DEFECT-03](#defect-03), on a different account. Worth pinning separately: they
are the same symptom but nothing guarantees they share a cause, and fixing one would not
close the other.

---

<a id="defect-07"></a>
## DEFECT-07 — Remove button does not remove

**Account:** `error_user` · **Probe:** *removing a product should restore the add to cart button*

Identical to [DEFECT-04](#defect-04), on a different account.

---

<a id="defect-08"></a>
## DEFECT-08 — Finishing checkout does not complete the order

**Account:** `error_user` · **Probe:** *finishing checkout should complete the order*

This account gets *further* than `problem_user` — it reaches the overview page with correct
items and totals — and then fails at the last step. Clicking **Finish** leaves the browser on
`/checkout-step-two.html` with no confirmation and no error message. The order is silently
lost.

Worth noting how late this surfaces. Every earlier step succeeds, so a smoke test that stops
before the final click would report this account as healthy.

---

<a id="defect-09"></a>
## DEFECT-09 — Prices are wrong and change on every page load

**Account:** `visual_user` · **Probes:** *product prices should match the catalogue*, *product
prices should be stable across page loads*

Prices bear no relation to the catalogue **and are regenerated on every render**. Three
consecutive reads of the same six products:

```
read 1: $62.35, $61.39, $70.85, $10.80, $79.81, $68.97
read 2: $30.23, $32.14, $40.52, $36.50, $42.93, $0.89
read 3: $64.48, $63.38, $29.64, $63.74, $19.66, $34.86
```

Control — `standard_user`, same reads, stable:

```
read 1: $29.99, $9.99, $15.99, $49.99, $7.99, $15.99
read 2: $29.99, $9.99, $15.99, $49.99, $7.99, $15.99
```

I expected this account's defects to be layout and styling. They are not: this is wrong data,
and non-deterministic wrong data at that. It also explains why sorting appears broken for this
account — the values are re-randomised between the sort and the read, so no ordering could
ever hold. Two probes rather than one, because "wrong" and "unstable" are separate failures
and a fix for either could leave the other in place.
