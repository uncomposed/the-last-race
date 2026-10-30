# Combo lab: change 4 plus long boxes

[[ai gen]] Bot-only experiments, 2026-10-29, about 13 minutes of wall-clock time and about 169,000 races. Not committed. Folder: `combo/`.

## Setup

- Page: `economy/page-econ.html` (BOXU 0.25 timing, economy knobs). Change 4 is knobs `spill 10, barScale 100, eRun 15`.
- Long boxes come from `scenarios/genpatch.mjs`. The long-box spec is passed as JSON in `CFG`.
- Runners: `combo/gen.mjs` (a copy of `economy/gen.mjs` that also keeps the stop-and-reverse count) and `combo/camp.mjs` (9 campaign maps, steps off, Medium, chill off, noise ids 0–19, 10 lesson probes).
- Analysis: `combo/an.mjs` (seed-clustered SEs), `combo/paired.mjs` (paired per-seed deltas, `?` under 3 SE) and `combo/campan.mjs`. Output is in `an-cal.txt`, `an-held.txt`, `an-off.txt` and `an-camp.txt`.
- Classes and probes are as in the economy lab. Every run uses 200 seeds × 6 draws × 12 probes, so 14,400 races.

## Variants, calibration seeds 0–199 (SE about 1)

| Variant | Fast boxes C/S/F | Fast win | Build win | Ext | Lab-0 dis | StopRev p75 |
|---|---|---|---|---|---|---|
| target | ~75 / most S / some F | 13–18 | ~20 | ~13 (steps off) | not ~40 | ≤ 2–3 |
| base (current, steps on) | 89/10/1 | 16 | 20 | 2 | 37 | 2 |
| change 4 alone (economy run) | 88/9/2 | 18 | 7 | 9 | 11 | – |
| V1: change 4 + midLong (25%, 1.2–1.4×) | 82/16/2 | 15 | 10 | 8 | 15 | 1 |
| V2: midLong at 35% | 80/18/2 | 14 | 11 | 7 | 16 | 1 |
| V3: midLong 25%, width 1.4–1.6× | 81/15/4 | 14 | 14 | 9 | 15 | 1 |
| **V4: 35%, width 1.4–1.6×** | **78/17/5** | **13** | **16** | **8** | **18** | **1** |
| V5: V4 + barScale 120 | 80/16/4 | 11 | 19 | 6 | 29 | 2 |

Why these knobs:

- V2–V4: build lost to change 4 because running now pays into speed, so stopping matters only where a box needs more run-up than running gives. More and wider long boxes create more of those spots.
- V5: under change 4, runup and climber lost most at the lower walls, so I tried taller walls. That brought height saturation back (h 0.82), and fast wins fell.

## Recommended: V4. Held-out seeds 3000–3199

| Metric | Base | Change 4 alone | V4 |
|---|---|---|---|
| Fast boxes C/S/F | 90/10/1 | 88/10/3 | 76/17/7 |
| h rush/bold | 0.91 | 0.73 | 0.74 |
| Class win: fast / build / careful / gamble | 13 / 20 / 21 / 31 | 18 / 7 / 14 / 34 | 12 / 17 / 21 / 30 |
| Extinction | 3 | 9 | 11 |
| Lab-0 dissolved | 39 | 11 | 19 |
| StopRev p50/p75/max | 1/2/9 | – | 1/1/6 |

Paired deltas:

- V4 minus base: extinction +8.0 ± 1.1, dissolution −20.4 ± 1.5. Fast −1.1 ± 1.1 (?) and build −2.9 ± 1.5 (?). Class wins are back at base, within noise.
- V4 minus change 4 alone: build +10.0 ± 1.1, careful +6.8 ± 1.1, fast −6.2 ± 0.9.

## Steps-off side effects (seeds 0–199, 6 draws)

The economy part (change 4) with steps off:

| Metric | Current game | Change 4 | Paired delta |
|---|---|---|---|
| Extinction | 12.8 | 3.2 | −9.7 ± 1.1 |
| Lab-0 dissolved | 18.3 | 8.7 | −9.6 ± 0.7 |
| Fast win | 4.6 | 11.9 | +7.3 ± 1.1 |
| Build win | 21.8 | 21.8 | 0.0 ± 1.2 |
| Careful win | 27.4 | 17.8 | −9.6 ± 1.6 |
| Gamble win | 23.8 | 29.9 | +6.1 ± 2.3 (?) |

Build stays flat only because smart and crawl rise (26→43 and 24→33). The lesson probes in that class fall: runup 29→5, climber 9→6.

### Campaign lesson probes, steps off

Lesson win %, then rank among the 10 probes. Each cell is 60 races per probe, SE about 6.

| Map | Lesson | Current | Change 4 | Status |
|---|---|---|---|---|
| 1 Long Approach | runup | 68, #1 | 15, #6 | breaks (twin 57) |
| 2 The Long Climb | climber | 50, #1 | 50, #1 | holds |
| 3 Coin Toss | gamble | 78, #1 | 38, #1 | holds but weak (scout 33) |
| 4 Fog Line | scout | 63, #3 | 22, #4 | breaks (balanced 85) |
| 5 Even Keel | balanced | 57, #2 | 25, #4 | breaks |
| 6 Nerve | bold | 60, #2 | 25, #4 | breaks |
| 7 Open Throttle | rush | 53, #1 | 2, #10 | breaks badly |
| 8 Slipstream | follower | 63, #2 | 12, #4 | breaks |
| 9 Sheer Face | climber | 60, #1 | 13, #8 | breaks |

So 7 of 9 lessons break. Balanced wins 3 maps, twin 2. Rush on Open Throttle collapses even though the fast class gains overall. Any of this changes `check/reference.json` hashes.

## Gaps and what would show this wrong

- Fast wins are at the low edge (12 held-out). Build is 17 against a target of about 20, and extinction is 11 against 3 on the current steps-on game.
- Falls on long boxes are now 7%, not "few".
- The campaign would need re-picking (or re-tuning) under change 4. That is the biggest cost.
- Wrong if a 2-draw re-run on new seeds puts build under 13 or fast under 10.
- Wrong if humans clear the 1.5× long boxes without stopping. The bots never improvise a run-up.
