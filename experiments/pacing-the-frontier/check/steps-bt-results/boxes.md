# Step-gap boxes: are they generated too hard?

[[ai gen]] 29 October 2026. Bot play and geometry only. Status: `verified` (checks run), not `human_validated`. `prototype.html` is untouched; every change was tested in `boxes/proto-patched.html` (diff: `boxes/generator.diff`). Calibration: free seeds 0–999, daily offsets 0–199. Every number below is held out (free 3000–3999 plus daily offsets 400–799) unless it says "cal". Predictions are in `boxes/prereg.txt`.

## 1. Feasibility, independent of bot skill

**Reference lab.** For each level I used the arrivals of 7 decent probes in steps-off races (follower, scout, balanced, runup, climber, twin, custom; 33,600 arrivals, calibration seeds only, `boxes/ref-cal.json`). These labs reach a gap at full height (median height/ceiling 1.00, 85% at 0.97 or more), going at about 46% of top speed.

**Classes.**
- *At speed*: half or more of the reference arrivals clear the box cleanly as they come.
- *After stopping*: a lab at its ceiling clears it on the run-up it has back to the previous barrier or box.
- *Scrape-only*: that lab only scrapes.
- *Infeasible*: that lab falls.

The class depends heavily on **jump timing**, so each timing model is shown:

| Generator | Timing at the face | At speed | After stop | Scrape-only | Infeasible | Near-max (harness) |
|---|---|---|---|---|---|---|
| current | arc peak (bots, and the "jump now" bar) | 25.4% | 45.7% | 28.8% | 0 | 0% |
| current | chill auto-jump | 71.9 | 21.5 | 6.5 | 0 | 0 |
| current | 25% into the arc | 83.2 | 15.6 | 1.1 | 0 | 0 |
| current | any 100 ms press window | 99.2 | 0.8 | 0 | 0 | 0 |
| proposed | 25% into the arc | 88.7 | 11.3 | 0 | 0 | 2.1 |
| proposed | 100 ms window | 98.9 | 1.1 | 0 | 0 | 2.1 |

The current generator puts 7,711 boxes on the held-out tracks, and none is infeasible. With peak timing, 72% of singularities are scrape-only.

## 2. Cause

The geometry is not the main problem. **Jump timing is.**
- The jump arc is flat at its top from about 15% to 85% of the jump.
- Bots, the cleanW width fit, and the "your jump now" bar all aim the arc's *peak* at the face. That throws away half the flat part while the lab is over the box.
- A lab is already above most boxes (rise is at most 97.5% of the ceiling, and labs arrive at the ceiling), so the best press is late: about 25% into the arc at the face.

Second cause: **widths are fitted at 61% of full speed**, but a lab that stops can only reach `sqrt(2·40·runway)`, about 110–126 on 170–210 of runway. From level 3 up, the fit speed is higher than that. So stopping to build cannot clear the box, which works against the rule "boxes reward stopping".

One-at-a-time sweeps (cal) confirm this:
- stepV and stepFit move scrape-only by 15–30 points.
- RISEFLOOR (0–1.2), RISEPOW (1–3) and RISEMAX (0.85–0.975) each move it by 4 points or less.
- gapScale and singGap do nothing; stepW does bite.

## 3. Generator change (seed-stable, no new draws)

`C.BOXFIT=1` sets a box's width to `WIDLO..WIDHI` (0.6..1.0, chosen by the existing w draw) of its own *stop-and-build fit*, times `stepW × gapScale (× singGap for the singularity)`, floored at `fit × stepFit/100` (default 125).
- The fit is the widest box a lab at its ceiling clears cleanly at `min(stepV speed, sqrt(2·ACC·(runway−8)))`, where the runway runs back to the last barrier or box.
- `BOXFIT=0` with stepFit 103 reproduces today's tracks exactly (checked: identical class counts).

`C.BOXU` sets the box-jump timing for bot presses, bot planning and the hand bar. 0.5 is today's behaviour; I propose 0.25.

**Proposed values:** BOXFIT 1, WIDLO 0.6, WIDHI 1.0, stepW 110, stepFit 125, BOXU 0.25. Leave RISE* and stepV as they are.

Step-day twists: Wider Gaps `gapScale 110`, Wider Singularity `singGap 115`, and drop `airH` from Rivals Copy You More. At 125 and 140, those two twists now make boxes scrape-only.

**Caveat:** stepW 110 needs BOXU 0.25. With peak timing it makes 25% of boxes scrape-only. Without BOXU, keep stepW at 100.

## 4. Daily seed filter

A day's seed is candidate k = 0, 1, 2…, where k = 0 is `dailySeed(ds)` and k ≥ 1 is `dailySeed(ds+'#'+k)`. The first candidate that passes is used. A candidate passes if it has no infeasible boxes, no scrape-only boxes, a near-max share of 20% or less, at most 1 no-warning box, and at most 3 boxes that need a stop.

| | Pass at k=0 | Mean tries | Max |
|---|---|---|---|
| current | 21.5% | 5.2 | >30 |
| proposed + step twists | 76.5% | 1.42 | 10 |

The filter enforces the rules; it does not make days easier. Paired held-out deltas are within ±4 points: follower −1.6 ± 1.1, runup +1.1 ± 1.0, smart −3.6 ± 0.9.

**Lesson catalog** (`boxes/lesson.mjs`). Each pair was picked on cal (offsets 0–39) and searched on held-out seeds (offsets 400–599). A seed passes when it passes the filter and the strategy beats the foil by at least 3 SE on 6 calibration noise ids, then again on 6 held-out noise ids.

| Kind / twist | Lesson | Strategy > foil | Pass, current | Pass, proposed |
|---|---|---|---|---|
| barrier / Hard Lessons | Build your own height; drafting gets nothing | climber > drafter | 1% | 2% |
| strike / 2 Strikes | Slow down and build before boxes | runup > bold | 5.5 | 21.5 |
| race / 2 Strikes | Cutting safety gets you dissolved | runup > rush | 5.5 | 25 |
| gap / Wider Gaps | Stop and build at wide gaps | smart > rush | 10 | 3.5 (lesson alone 14; 105 seeds fail on near-max) |
| shadow / Rivals Copy | Let copiers lead, then pass | follower > rush | 1.5 | 14.5 |
| singularity / Wider Sing. | Build before the last leap | climber > rush | 1.5 | 6.5 |

The generator change fixes strike, race and shadow. Barrier fails because of the lesson design, not the generator: the strategy-foil gap is about 0.05. It needs a difference-in-differences test (does the twist hurt the drafter more than the climber?). Gap needs gapScale near 105, or a looser near-max limit on Wider Gaps days.

**Delivery: search offline and ship a date→k table.**
- The lesson check costs about 72 races, roughly 1.5 s per candidate on a desktop under load. At 1/p tries (5–50 candidates), that is tens of seconds on a phone.
- The races are chaotic and use `Math.sin`, `exp` and `pow`, which are not guaranteed to give bit-identical results across JS engines. Safari and Chrome could pick different seeds, which breaks shared dailies.
- A small `DAILY_K` table, appended like BRIEFINGS, plus a check script that re-runs the filter and the lesson, keeps the seed found by search and the same on every device.
- The filter alone would work in the browser (about 10 ms per candidate), but it carries the same engine risk at threshold edges.

## 5. Held-out win rates (daily, chill off, solo / Steward / S+S)

| Player | No twist, current | No twist, proposed | Twists, current | Twists, proposed (step twists) |
|---|---|---|---|---|
| follower | 11 / 16 / 17 | 50 / 43 / 22 | 8 / 12 / 12 | 36 / 36 / 25 |
| runup | 8 / 13 / 20 | 47 / 32 / 32 | 8 / 11 / 15 | 36 / 30 / 34 |
| smart (tuning probe) | 9 / 21 / 18 | 17 / 22 / 17 | 8 / 16 / 15 | 13 / 18 / 15 |
| custom | 6 / 6 / 6 | 26 / 28 / 19 | 6 / 4 / 5 | 19 / 17 / 12 |

Each cell has SE ≤ 2.5 (n = 400 per cell). Most of the gain is BOXU: on cal, timing alone took the follower from 16 to 35% and the generator change alone from 16 to 20%. Bot stopRev reaches a max of 4–5 (p75 is 1–3), which is over the rule.

## What would show this wrong

1. Humans pressing by eye do worse than the 100 ms-window model, so the boxes really are too hard for people.
2. Phone players using the BOXU 0.25 bar still scrape on more than a quarter of their boxes.
3. A rerun with the box-competent `smart` probe after it adopts BOXU still sits below 20%.
