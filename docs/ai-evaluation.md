# Evaluating the AI-assisted build

> **On voice:** written by me, Eben Smith. Throughout `docs/`, *I* and *my* mean the author.
> The AI assistant is always named.

## Section 1 — The pattern underneath

### 1a. Was it worth it — as an accounting, not a verdict

Where did it genuinely save time? (name the artifact, rough hours)

- Zod schemas — These were ok, but felt like overkill by the end. I think I would use this in something that was long running, but probably avoid it for a one off solution like this.
- API client scaffolding — This is probably the part that feels the most like magic to me. I can remember agonizing over all of the decisions when originally putting these things together, but the ease with which it creates it takes a great deal of pressure off of the developer. The ability to quickly restructure using AI is something else that makes it a ton easier to work with these things.
- Doc structure / framing the deliverables (P-01) — This was a bit of a mixed bag, as it is kind of difficult to actually quantify. I find it to be a net positive, though.

Where did it cost time you would not otherwise have spent?

- Reviewing six files that had never been run (P-16) — When we get large code blocks like this, it makes it really difficult to make sure that you stay on point. It's the reason many organizations had line limits placed on checkins in the past. I find it better to keep the iteration tight, and to work through one after another. Not only do you see an increase in the quality of the tests, but subsequent tests are often one shots for Claude. This is because it now has a good example of what you are looking for, and you have probably built up some skills/agent/rules to help guide Claude as you run into issues.
- The 120-line auth spec that failed, cause two layers from the failing line (P-23) —
- Catching the fabricated "three teams" claim (P-05) — This is the kind of thing that AI gets a horrible name for, and I find that, while it doesn't happen as much as people seem to think, when it does, it is dangerous! The real struggle with working with AI is to not become complacent. We have to remain vigilant so that the last method it creates adheres to the quality and decisions made on the first method. It's the ability to get 9 things right that leads to us missing the tenth. Constant vigilance is the watchword!
- Version assumptions — tsconfig `baseUrl`, Zod v3 idioms (P-08, P-09) — These were kind of minor, and easy to move past. I think that this is kind of a neutral, as I feel that humans are pretty horrible at this, too. Versioning is a problem with a thousand solutions that no two people seem to agree on.
- Finding `toHaveLength(10)` asserted nothing (P-12) — This is probably the worst offender of the bunch in many ways. It looks like great testing, but it lacks the specificity that would actually make a test useful. Just ensuring that there are 10 users is ok, but making sure it is the correct 10 users is such a huge step up. This happens less and less as we create rules and skills to help lead Claude, but it stays a challenge. The problem stems from a lack of vigilance, most of the time. We miss it once, and the agent assumes that's an acceptable way to do business.

### 1b. What changes on a real codebase

- What made verification cheap here? (both targets are fixtures — the truth was one curl
  away. SauceDemo's bugs are _documented_). This means that I know the failures, and they are intended. In a normal organization, I would be working closely with a developer to highlight issues before they went out to production. We wouldn't ship broken code and write tests around the broken functionality. We would do one of the following in a real organization:
  - If the issue was found before the feature was released, we would work closely with the developer to ensure that the correct behavior is actually happening. This would become a roadblock, or at least give us pause, to releasing the feature.
  - If it was found afterwards, we would continue to run the test and let it fail, set it to a test.fail (as we know it will fail), or just comment out the test. Much of this is related to the pain tolerance of failing tests on behalf of the dev team. Failing tests are insidious, in that they erode the organization's trust in the tests. Soon we are shipping code without even running the tests, if we aren't careful. Tests that fail also have a mental rent associated with them: we have to remember that we expected that test to fail.
- What does not exist on a real system?
  - We can't just look at users and know that they will fail. We have to create users that try and cover as many of the combinitorics as possible, and then add to them, as we inevitably find more permutations. We also wouldn't allow code to ship with these kinds of defects.
- So what happens to the cost of every unverified generated line?
- What would you do differently where the consequences are real?
  - Familiarity with the system is paramount. We need to understand what the features we are testing are not only doing in isolation, but how they contribute to the overarching system. This means that there is an ongoing need to learn about the system, and even portions that your team isn't directly responsible for. It means that the best automated qa are often those that have the ability to do good manual testing. It means that we need to be present when decisions are made, so that we can understand the end goal.
  - Very little of my time would probably be around making sure that the infrastructure was correct in my testing. Instead, I'd spend most of it writing new tests. The lion's share of my time would be spent making sure that tests that I write are worthwhile and solid. Flaky tests are worse than failing tests for lowering faith in QA.
  - Much of my time immediately after being hired would be around understanding what our automation is doing, and ensuring that I honor that through my work. It's made doubly difficult with AI, as it can be incredibly opinionated about how to write things. Sometimes there are reasons for the quirks within our test suites that aren't readily apparent to even senior developers. All of this means that we need to really try and understand not just the code itself, but the whys behind the code. History still matters!

---

## Section 2 — What I changed

### 1. `test.fail()` probes over characterization tests

- **Assistant produced:** three approaches with code samples, run output and tradeoffs —
  `test.fail()` probes, characterization tests asserting the buggy behaviour, or exercising
  `standard_user` only
- **I chose:** `test.fail()` defect probes
- **Why:** This was a difficult one to determine the right way to do it. I chose this way, because it allowed me to write tests that I can show as failing without giving me a bunch of background noise to dig through. In a normal organization this would probably be a bad way to do business, as we wouldn't want to release code with known defects.
- **Cite:** P-02

### 2. Agent not respecting our tight iteration loop

- **Assistant produced:** Multiple files without running the tests.
- **I Chose:** to create a skill that would help to keep the agent from continuing to build without verifying.
- **Why:** When we are working with agents, it is important to get good examples in place as quickly as possible. Before AI, it was very similar, in that we would often spend the most time on the initial tests, ensuring that things were rock solid. This work, in turn, would make it easier for us to get the subsequent tests working in much less time (hopefully). In a real organization, the creation of skills can have a large amount of lift when shared among the team: a rising tide lifts all boats. It gives our agent context and history that allows it to arrive at the right code, faster. It also is a place for us to store information for the rest of the team. Most skills should have an example, and that helps humans, too!
- **Cite:** P-23

### 3. Write specs split into two `describe` blocks

- **Assistant produced:** confirmed the delete-test pair and named the split — one test
  asserts the API _claims_ success (`200`, `{}`), the other asserts nothing actually happened
- **I changed:** restructured into `write response contracts` and
  `writes report success but never persist`
- **Why:** Tests should be written in such a way that an engineer can quickly and easily see why they are failing. Unless a test is a true end-to-end test, then it should test only one item as often as possible. This means that we need to make sure that all of our code has to be for humans on some level.
- **Cite:** P-18

### 4. Users spec — identity over shape

- **Assistant produced:** `toHaveLength(10)`
- **I changed:** assert ids 1–10 exactly, pin the identifying fields of user 1, and
  cross-check `/users/1` against the same record inside `/users` so the two endpoints must
  agree
- **Why:** Agents often lack the understanding of what is important to test. This is because organizations care about quality to varying degrees based upon the needs of their users. So it becomes difficult for an agent to know the degree to which a feature should be tested. Humans can give it the necessary context to help create the best possible test suite. Specificity in automated testing is a very important part of the tests we create.
- **Cite:** P-12

### 5. Persistence documented in three places, one enforceable

- **Assistant produced:** `api-behavior.md`, plus the finding that `POST` returns
  _collection size + 1_ — computed, not allocated, so deterministic but identifying nothing
- **I changed:** put it in three places deliberately — `api-behavior.md` as the reference
  with re-verify commands, `inputs.md` as summary and link, and a rule in the skill file
- **Why:** Skills and provided examples allow us to shape the way that agents create code. It means fewer iterations on lines created, which means we produce more code, faster. It also helps our teammates if we share them!
- **Cite:** P-15

---

## Section 3 — Would I use it this way again

I've been working with AI in my personal and professional life. It is a force multiplier, but not an oracle. AI is only as good as the developer behind the prompts.

- Which phases did it pay in?
  - It pays in all phases as it is a force multiplier. There are few areas that it can't speed us up, but we just have to know where we are heading. Running faster in the wrong direction isn't a good way to win a race.
- Which phases would you not use it in again?
  - AI can help in most of the areas of my job. I used it for much of the work that I did, but it comes with the caveat that you still need a human in the loop.
- What is the one rule you would carry to a real team?
  - The rule that I always bring is: trust but verify. We were hired for our ability to write and maintain quality code, at least partially. Use your skills to verify what you are building, as you are building it.
- What would have to be true for you to trust it further?
  - I think that we have to keep learning and pushing ourselves. One of the things we say in my AI club is that if you aren't at least 15% sure it will fail, you probably aren't pushing hard enough. AI will continually surprise you with both the ability to do something in exactly the way that you yourself would do it, and also find ways to do things that can make you want to just shake your head in disgust. It often comes back to the way that we work with it, and finding the right way for you. For me: doing manual approvals with smallish amounts of code helps me to understand the system we are building a brick at a time. I have friends that auto-accept everything and then do a huge code review at the end. Both camps are capable of producing more code with ai than a developer alone, but they just cater to individual strengths and weaknesses.
