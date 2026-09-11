# Evaluating the AI-assisted build

> **On voice:** written by me, Eben Smith. Throughout `docs/`, *I* and *my* mean the author.
> The AI assistant is always named.
>
> **Status: draft — factual spine only.** Every incident below is cited to an entry in
> [prompts.md](./prompts.md) and is verifiable from the git history. The assessment sections
> marked **⟨my take⟩** are mine to write and are not finished. I am keeping this file as a
> running record rather than writing it at the end, for the same reason the prompt log is
> kept as work happens: the interesting failures are easy to forget once they are fixed.

---

## What worked

**Framing the exercise.** Handed the brief and an empty repository, Claude read the
deliverables and pointed out that three of the six are documents, and that the brief
explicitly ranks technical decisions and AI evaluation above test count — so the docs deserve
close to half the budget and the prompt log has to be written as work happens rather than
reconstructed. I had been thinking of the writeup as something to do at the end. That
reframing shaped the whole schedule. (P-01)

**Surfacing the traps in the targets.** Unprompted, it identified the two characteristics
that punish a naive suite: SauceDemo's five deliberately broken accounts, and
JSONPlaceholder's simulated writes. Both became central design constraints rather than
things I discovered halfway through. (P-01)

**Extending a rule I set, rather than just following it.** I gave the page object ground rule
— actions in pages, assertions in tests. Claude added three things I had not: that a page
method which asserts cannot be reused for negative tests (so `login()` verifying success
forces a second `loginExpectingFailure()`); that waiting and asserting are different and the
rule erodes at that boundary; and that using `waitFor()` instead of `expect()` inside `src/`
makes the rule *greppable*, which is what turned a convention into the `lint:assertions` gate
in `npm run validate`. (P-06)

**Verifying instead of assuming, once pushed to.** The live-payload checks caught that
`z.url()` rejects `hildegard.org`, that `geo.lat`/`lng` are strings, and that `POST` returns
`collection size + 1` rather than an allocated id. (P-10, P-15)

**Proposing work I did not ask for, and flagging it as such.** `schema-guards.spec.ts` —
feeding the contracts bad data to prove they can fail — was Claude's idea, and it announced
that it went beyond the approved plan rather than adding it quietly. (P-13)

---

## What did not work

Ordered by how much it would have cost me if I had not caught it.

**1. It fabricated my professional experience.** Drafting the prompt log in my first-person
voice, Claude wrote that I had "watched this decay on three teams." I have not said that. It
was invented to make the reasoning sound lived-in, in a document I submit under my own name
to people who might ask me about it. Caught on review and removed. The standing rule since:
every claim in `docs/` traces to something in this session, and anything about my background
is left out or flagged for me to fill. (P-05)

**2. It wrote six files without running any of them — and then did it again.** The result
type, three clients, a fixture, and a refactored spec, all generated before a single
execution. I stopped it. The code happened to pass, which is close to the worst outcome,
because it teaches the wrong lesson. (P-16)

Two phases later it wrote a 120-line authentication spec in one block, having been corrected
once and with my standing conventions already saying to work in small verified pieces. That
run failed, and the cause sat two layers from the failing line. **The correction did not
carry forward on its own.** Prose preferences — mine or anyone's — do not change behaviour
across sessions; that is why the fix was a skill file committed to the repository rather than
another instruction. (P-23)

**3. Version assumptions, twice, in the same way.** It wrote `baseUrl` into `tsconfig.json`,
which TypeScript 7 removed outright, and would have used Zod v3 idioms (`.strict()`) had it
not checked the installed v4 first. Both are the same error: generating against a remembered
version of a library rather than the one on disk. (P-08, P-09)

**4. An assertion that verified nothing.** The users spec asserted `toHaveLength(10)`, which
passes for *any* ten users. It checked the shape of the response while proving nothing about
its content — a test that looks like coverage and is not. This is the one that worries me
most in a generated suite, because it is invisible in review unless you are specifically
asking "what would still pass if this were broken?" (P-12)

**5. Vocabulary drift across files.** The client method was `remove()`, the variable
`removed`, the test name "a deleted post", the HTTP verb `DELETE`. Every file individually
reasonable, the vocabulary quietly diverging. Nothing in the toolchain flags this. (P-19)

**6. Unmarked voice, and overlong commit messages.** It wrote both docs in first person
without establishing whose, and produced a twenty-line commit message for a five-line change.
Small, but both needed correcting explicitly and neither self-corrected. (P-05)

---

## The pattern underneath

⟨my take — to write⟩

The through-line I see so far: **the output is consistently plausible, and plausibility is
not verification.** Every failure above produced code or prose that read as competent. The
`baseUrl` line looked like a normal tsconfig. `toHaveLength(10)` looked like a real
assertion. "Three teams" read like something I would say.

Which means the review burden does not go down — it changes shape. Instead of reading for
*obvious* errors, I am reading for *confident* ones, and an assistant generates confident
material faster than I can check it. Two things followed from that:

- **Verification cadence has to be enforced by the human.** Nothing in the loop asks whether
  the last six files were ever executed.
- **Rules belong where they bind.** The no-assertions-in-page-objects rule became a grep in
  the validation gate.
  The persistence limitation went into the skill file, not just `api-behavior.md`. Prose
  documentation is advisory; a gate is not.

*(Expand: where this net out on whether it was worth it, and what I would do differently on
a real codebase with no fixture APIs and real consequences.)*

---

## What I changed

⟨my take — to write⟩

*(Assemble from: the `test.fail()` decision over characterization tests; splitting write
specs into two describes so intent survives a cold read; the fixture deliberately not
re-exporting `expect` to keep the lint gate honest; asserting identity over shape in the
users spec; documenting persistence in three places including an enforceable one.)*

---

## Would I use it this way again

⟨my take — to write⟩
