# Daily challenge with step gaps: backtest

[[ai gen]] 29 October 2026. Bot play only. Status: `verified` (checks run), not `human_validated`.

## What was run

- Harness `check/steps-bt.mjs`, daily mode, unchanged. Driver, analysis and raw rows are in `steps-bt-results/daily/` (`run.mjs`, `analyze.mjs`, `compare.mjs`, `raw/*.jsonl.gz`, full tables in `tables.md` and `relief.md`).
- Each race: the date's briefing twist applied as `dailyPrep` does, `DAILY_TIERS` rosters, chill off (the star run), player strikes = `K.strikes`, perfect hands. Players: the custom bot plus the 10 probe strategies (runup, climber, gamble, scout, balanced, bold, rush, drafter, follower, twin), no jitter.
- Blocks: calibrate on day offsets 0–199 (from 2026-10-28), report from held-out offsets 400–799. All 10 briefings share one `added` date, so the briefing is `dayNum % 10`. Each twist is covered in both blocks: held out has Hard Lessons 120 dates, Only 2 Strikes 80, Wider Gaps 80, Wider Singularity 80, Rivals Copy You More 40 (calibration has half of each).
- 11 players × 3 tiers × 400 dates = 13,200 races per held-out configuration. About 15 ms a race.
- SEs: single rates use the binomial SE. Paired deltas (same date, tier and player) use per-date means, so they are clustered by date. A `?` marks a delta under 3 SE (provisional).
- "Best player" verdicts pick the best player on the calibration block and score it on held out. The max over 11 players on the same block is biased upward, and is shown only as a ceiling.
- Shipped defaults for the knobs the other agents tune. Sensitivity runs cover NOWARN 0.06/0.2, strikes ±1 (the Only 2 Strikes twist moves with the base) and extinction odds ×0.5/×1.5 (p1, pstep, singOdds together).

**Caveat on falls (from the coordinator, confirmed in `prototype.html` around lines 2415–2418).** A bot enters a box through the side only if `sideSurvives` says it will survive the sink. So bot falls and extinctions understate what a human who misjudges a box will get. The fall and extinction columns below are lower bounds for people. I have not built a human model.

## 1. Steps off vs on, per twist and tier (held out)

The mean is over all 11 players. Δ is on minus off, paired, in percentage points.

| Twist | Tier | Mean win off → on | Δ | Best player (picked on calibration) off → on | Verdict with steps on |
|---|---|---|---|---|---|
| Hard Lessons | solo | 35 → 4 | −31 ± 2 | follower 85 → twin 7 ± 2 | near-unwinnable |
| Hard Lessons | vs Steward | 19 → 7 | −12 ± 2 | 39 → 10 ± 3 | near-unwinnable (provisional) |
| Hard Lessons | vs Sprinter+Steward | 16 → 7 | −9 ± 2 | 26 → 12 ± 3 | near-unwinnable (provisional) |
| Only 2 Strikes | solo | 21 → 3 | −18 ± 2 | 74 → 5 ± 2 | near-unwinnable |
| Only 2 Strikes | vs Steward | 18 → 4 | −14 ± 2 | 20 → 8 ± 3 | near-unwinnable |
| Only 2 Strikes | vs S+S | 15 → 4 | −11 ± 2 | 19 → 9 ± 3 | near-unwinnable (provisional) |
| Wider Gaps | solo | 32 → 6 | −26 ± 2 | 85 → 10 ± 3 | near-unwinnable (provisional) |
| Wider Gaps | vs Steward | 18 → 8 | −11 ± 2 | 56 → 13 ± 4 | near-unwinnable (provisional) |
| Wider Gaps | vs S+S | 14 → 9 | −5 ± 2 ? | 46 → 24 ± 5 | ok |
| Rivals Copy You More | solo | 31 → 5 | −26 ± 4 | 80 → 5 ± 3 | near-unwinnable |
| Rivals Copy You More | vs Steward | 23 → 7 | −16 ± 3 | 55 → 10 ± 5 | near-unwinnable (provisional) |
| Rivals Copy You More | vs S+S | 19 → 10 | −9 ± 3 | 50 → 20 ± 6 | ok |
| Wider Singularity | solo | 30 → 5 | −25 ± 2 | 78 → 6 ± 3 | near-unwinnable |
| Wider Singularity | vs Steward | 16 → 8 | −9 ± 2 | 51 → 14 ± 4 | near-unwinnable (provisional) |
| Wider Singularity | vs S+S | 14 → 9 | −5 ± 2 ? | 36 → 13 ± 4 | near-unwinnable (provisional) |

No cell is trivial with steps on. With steps off, solo is close to trivial for the follower (74–85%), which matches the old daily.

Here is the outcome mix, pooled over players. For each twist the solo cell is shown and the versus tiers follow the same pattern; the full table is in `daily/tables.md`.

| Twist (solo) | Dissolved off → on | Extinct | Scrapes per race | Falls per race | stopRev p50/p75/max off → on |
|---|---|---|---|---|---|
| Hard Lessons | 48 → 54% | 3 → 7% | 0.55 → 1.00 | 0.17 → 0.41 | 3/4/9 → 2/3/7 |
| Only 2 Strikes | 64 → 76% | 3 → 3% | 0.43 → 0.89 | 0.15 → 0.21 | 2/3/8 → 1/2/6 |
| Wider Gaps | 43 → 59% | 3 → 3% | 0.79 → 1.12 | 0.25 → 0.34 | 3/4/9 → 2/2/5 |
| Rivals Copy You More | 42 → 58% | 4 → 3% | 0.97 → 1.16 | 0.27 → 0.36 | 2/4/8 → 2/2/5 |
| Wider Singularity | 42 → 53% | 6 → 5% | 0.69 → 1.10 | 0.25 → 0.42 | 2/4/9 → 2/2/6 |

On the versus tiers, dissolution rises much more with steps on (for example Only 2 Strikes vs Steward goes from 51% to 81%). Extinction falls there, because rivals dissolve before they reach the gaps. Stop-and-reverse stays inside the design rule, with p75 at 3 or less everywhere.

**Main finding: steps on is the whole effect, and the twists barely matter on top of it.** I ran each date with no twist as a control (held out, mean over players):

| Twist minus no twist | steps off | steps on |
|---|---|---|
| Hard Lessons solo / Steward / S+S | −7 / −7 / −8 | −1? / −2? / −4 |
| Only 2 Strikes | −21 / −8 / −7 | −3? / −5 / −5 |
| Wider Gaps | −7 / −5 / −7 | 0 / 0 / 0 |
| Rivals Copy You More | −13 / −5? / −4? | 0 / +1? / 0 |
| Wider Singularity | −9 / −6 / −8 | 0 / 0 / +0 |

Even with no twist, a steps-on daily already sits at a 5–11% mean win rate (best player 9–24%). With steps on, about half of all strikes in dissolved races are scrapes: 1.47 scrapes per dissolved race, against 0.80 with steps off.

**Three twists do nothing to the boxes. This is a mechanism, not noise.** `setRises` overwrites each box's width from `cleanW` and `stepFit`, so these knobs change no box:

- `gapScale` (Wider Gaps), `singGap` (Wider Singularity) and `airH` (Rivals Copy You More) leave every box's width and rise identical. I checked 60 daily tracks with `trackStats`. They only move the finish 80–110 units further out, through the run-up zones.
- Box flight uses `flightAlt` and `jumpDur`, with no `airH`. That follows the settled rule "no height buys air time".
- In solo, Rivals Copy You More is an exact no-op with steps on (Δ +0 ± 0), because `shareRiv` needs rivals.

**Sensitivity (held out, steps on).** Every cell keeps the same sign and verdict under all of these:

- NOWARN 0.06 or 0.2 moves the mean win rate by 2 points or less.
- Extinction odds ×0.5 or ×1.5 change no win rate. Your own fall loses the race whatever the roll, so the odds only move which loss gets recorded.
- Strikes −1 drives every cell to 0–4%.
- Strikes +1 is the only lever that matters, and it is not enough: best player 16–33%, mean 5–15%.

So the conclusions do not depend on what the tuning agent picks for NOWARN or odds. They do depend on the strike limit.

## 2. Step-gap-specific adjustments

Candidates were picked on calibration and checked on held out. Each Δ is against the same configuration without the twist, so it is the twist's own effect.

1. **Steps-on base: strikes 4, as a strikes floor.** This is not a twist; it applies on step days. Against strikes 3 it adds +4 to +7 points in every cell, and 14 of 15 cells clear 3 SE. Cole's step-gap rules allow more strikes overall. It still leaves bots low (mean 9–16%, best 18–33%). **It is not enough on its own.** The base difficulty of generated boxes, chill off, is the limiting factor, and that belongs to the tuning and campaign work. I would not ship step dailies until the best probe reaches about 25% solo with the no-twist control.
2. **Only 2 Strikes → "base minus one", floor 3.** Today's literal value of 2 strikes on a step day gives a best player of 5–9%. At 3 strikes on a strikes-4 base, the twist effect is −4 / −5 / −4 (all at 3 SE or more), and the best player is 16 / 19 / 23% (max over 11, so biased up).
3. **Wider Gaps: add `stepW: 125`** and keep `gapScale: 125` for the steps-off past. It widens boxes without making any of them near-max: the bot's height need rises from 0.65 to 0.70 of the ceiling. Held-out twist effect: solo −4 ± 1 (passes), Steward −1 ± 1 ?, S+S −2 ± 1 ?. `stepW: 150` was stronger on calibration (−2 / −5 / −4) and is the next value to try if 125 stays too weak.
4. **Wider Singularity needs a new knob.** No existing knob widens only the singularity box: it already sits at the clean-fit cap, so `stepW` cannot reach it. I tested a sing-only `singFit` (a patched copy in the scratchpad, identical to the page when unset). At 110 the effect was 0 / −2? / −1?. At 115 every singularity becomes a near-max box. **Not proven with bots.** Because bots enter a box only when they would survive, they mostly avoid exactly this danger, so a person playing it is the real test.
5. **Rivals Copy You More: drop `airH: 12`.** It does nothing with boxes and contradicts the "no air time" rule. With `riseScale: 105` added, the effect was −1? / +1? / −1?, so no lever I tried works. Either accept that this twist is versus-only on step days (the story is about rivals anyway), or test another lever later.

Three things no longer hold with steps on, and need an update when steps go in:

- The `TWISTS` comment ("each one lowered the custom bot's wins on all three daily tiers")
- DESIGN-NOTES "Daily twists"
- `check/content-check.mjs` check (b), which will fail for the three no-op twists

## 3. Copy that is wrong with boxes

The facts stay the same; only the game wording changes.

1. `hf-malicious-models`, twist.why: "…every shared model is another place the track can drop out from under you." With boxes, the track never drops out. Rewrite: "Supply-chain attacks widen the attack surface: every shared model is one more risk to get over. Today every gap is wider."
2. `distillation-allegations`, twist.why: "…and height you paid for buys less air on every jump." Jumps over boxes have no air-time term. Rewrite: "Distillation lets a rival soak up your gains for far less than you paid. Today rivals get 80 percent of each level-up the leader wins, not 40."
3. `superalignment-dissolved` and `chatgpt-redis-leak`, "two strikes, not three": wrong if the step base becomes 4. Rewrite: "Today every lab gets one strike fewer than usual, and a scrape across a gap still costs one."
4. `asl3-bio` ("the wider the jump you have to clear") is correct only once Wider Gaps carries `stepW`. With `gapScale` alone, nothing widens.
5. `statement-on-ai-risk` ("the singularity gap is wider, and a fall there can end the run for everyone") and `ai-2027-race-ending` ("the singularity gap is wider too") are correct only once a sing-only width knob exists. Otherwise the line is false on step days.
6. Hard Lessons copy ("walls are a little taller…") still holds, because track barriers still exist and `barScale` and `spill` still apply.
7. The `ov-msg` help ("Miss a gap and you drop…") is general help rather than daily copy. With boxes the player enters through the side and sinks. Outside this brief, but worth fixing in the same change.

## 4. Rollout

**Recommendation: switch steps on for every daily from a fixed future start date, but only after the base difficulty is fixed** (point 1 in section 2). Do not ship it as its own twist.

- Dailies are keyed by date and shared as `?daily=<date>`. The share link carries no steps flag, so the date alone has to decide the rules. A `DAILY_STEPS_FROM` date checked in `dailyPrep`, under the same "never change a past date" rule as `BRIEFINGS.added`, keeps every past daily replayable and comparable.
- **Every day from a date.** Pros: one rule set to learn, and everyone on a given day still faces the same race. Cons: scores before and after the date are not comparable, and every twist needs its step version on day one (section 2).
- **As its own twist.** Pros: a gentle introduction, and no stacking with no-op twists. Cons: twists come from briefings, so this needs new briefings appended. It would come up about 1 day in 11, so players rarely practise boxes. It also makes the daily's difficulty swing hard from day to day: on bot evidence, a step day is 3 to 5 times harder in solo.
- *Inference:* box skills (stop, build, cross) are what the campaign now teaches, so a daily that rarely shows boxes works against that.
- **What would show this wrong:** a week of human step dailies after base tuning in which almost nobody earns a star while chill-on chair wins stay normal, or players reporting that the switch broke comparison with friends. Either would argue for the twist route, or for steps on chill-on runs only.

## Limits

- **Bots only, perfect hands, chill off.** With chill on (calibration, no twist), the mean steps-on win rate is 18–20% against 5–10% with chill off. Chill-off bots are worst at timing jumps at boxes. Humans may do better or worse.
- **Falls and extinctions are lower bounds** (the side-entry caveat above).
- The probes were tuned for the campaign without steps, and none sets `side`, so "near-unwinnable" means "for these 11 policies".
- The best-player rates are the best of 11 policies. A human who adapts each day could beat that.
- The test of point 4 used a patched copy of the page that is not in the repo. `singFit` would need to be added to the page before anyone relies on it.
