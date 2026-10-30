# Campaign maps with step gaps: backtest and re-pick

[[ai gen]] Bot play only, in `check/steps-bt.mjs` (campaign semantics, `CAMP_STEPS` on, `steps:1`). Nothing here is played by a person.
Status: proposals are **implemented** (as `campaign-proposed.js`) and **verified** in the harness. They are not applied to the page and not human-validated.

## Method

1. Baseline: steps on, the current seeds, Medium, noise 1-50. Maps 1, 4 and 9 had zero wins for every probe. Rush won 0 on map 7, bold 0 on map 6 and follower 0.007 on map 8.
2. Calibration: candidates screened on noise 1-50 (n 150 per probe). These were box re-shapes per slot (uniform grids, random leans and single-box edits) plus seed searches for slots 6, 7 and 8.
3. Held-out report: noise 100-199 (n 300 per probe), plus noise 0 (the shipped draws, n 3). Margins are paired by tier and noise id. Under 3 SE is provisional.
4. Probes: the 10 harness probes, plus two mechanism probes, `climb0` (climber that never stops for boxes or barriers) and `rush1` (rush that always stops).
5. Coordinator additions:
   - a rough sight-trap count (`campaign/trap.mjs`, noise 100-129)
   - the player strikes 5/4/3 setting
   - the crawl-to-the-box foil `crawl:gamble` from `tuning/boxprobe.mjs` (`campaign/crawlfoil.mjs`)
6. Knobs stay at shipped defaults. Raw output is in `campaign/heldout/` (`report.txt`, `summary.json`, `crawl.txt`, `tracks-traps.json`).

## Verdicts (held-out, Medium, shipped strikes 3)

| Map | Seed | Lesson | Lesson win | Worst listed foil | Margin (z) | Rank of 10 | vs crawl:gamble | 5/4/3 E / M / H |
|---|---|---|---|---|---|---|---|---|
| 1 | 1823 | climber | 0.84 | runup 0.18 | +0.66 (20) | 1 | tie, -0.01 (z -0.5) | 0.92 / 0.92 / 0.88 |
| 2 | 1784 | climber | 0.37 | gamble 0.18 | +0.19 (5) | 2 (runup 0.50) | **loses**, -0.54 | 0.41 / 0.41 / 0.40 |
| 3 | 676 | gamble | 0.59 | balanced 0.15 | +0.44 (12) | 2 (bold 0.82) | **loses**, -0.27 | 0.82 / 0.82 / 0.64 |
| 4 | 717 | scout | 0.55 | climber 0.38 | +0.17 (4) | 3 (runup 0.87) | beats, +0.40 | 0.83 / 0.71 / 0.57 |
| 5 | 2972 | balanced | 0.59 | climber 0.41 | +0.18 (6) | 2 (runup 0.71) | beats, +0.59 (crawl 0) | 0.64 / 0.64 / 0.60 |
| 6 | 625 (new) | bold | 0.76 | balanced 0.10 | +0.66 (21) | 1 | **loses**, -0.14 | 0.88 / 0.88 / 0.74 |
| 7 | 2565 (new) | rush | 0.84 | balanced 0.32 | +0.52 (18) | 2 (gamble 0.85) | beats, +0.15 | **0.40 / 0.07** / 0.83 |
| 8 | 23 (new) | follower | 0.56 | bold 0.04 | +0.52 (17) | 1 | beats, +0.12 (z 3.2) | 0.62 / 0.62 / 0.59 |
| 9 | 2785 | climber | 0.43 | balanced 0.01 | +0.42 (14) | 4 (runup 0.60) | +0.07 (z 1.7, provisional) | 0.88 / 0.64 / 0.40 |

At 5/4/3, the crawl foil beats the lesson on maps 2 and 3 (Hard), 6 (Hard), 7 (Easy, Medium) and 9 (Medium). It ties on map 1 Hard. It loses to the lesson on maps 4, 5 and 8 at every difficulty. Full lines are in `campaign/heldout/crawl.txt`.

Noise 0 (n 3 per probe) agrees with held-out on maps 1, 6, 7 and 8. On maps 2, 4, 5 and 9 the lesson won 0-1 of 3. That is too small to read alone.

## Per map

**1 Build First (re-shaped, lesson changed).**
- The boxes are six tall, narrow boxes rising 56 to 181, then the singularity.
- Climber 0.84 beats runup 0.18 and rush 0. It survives Hard (0.45 at 2 strikes, 0.88 at 3).
- **The "stop" part is not shown.** `climb0` (never stops) also wins 0.84, and 79% of climber wins have no box stop. The map teaches building height, not stopping.
- The crawl foil ties it.
- Sight traps: 0 for climber and runup, 0.43 a race for rush.

**2 The Long Climb (one box re-shaped).**
- Weak. Climber is second to runup (0.50) and the crawl foil wins 0.92.
- Tier 2 is nearly unwinnable for climber (0.01).
- At 5/4/3 Easy, balanced beats climber (d -0.18).
- Unresolved.

**3 Coin Toss (re-shaped).**
- Gamble beats the careful probes, but bold (0.82) and the crawl foil (0.86) are above it.
- Hard at 3 strikes: 0.64.

**4 Fog Line (re-shaped).**
- Scout beats climber by +0.17 (z 4.4), but runup is top (0.87).
- All-stops p50 is 5 and p75 is 6, mostly barriers. Box stops p75 is 1.
- No sight trap was seen for any probe. The expected map-4 trap does not appear with these low boxes. The barrier-heavy track drives the result instead.

**5 Even Keel (re-shaped).**
- Balanced beats climber; runup is top.
- It keeps the campaign's only no-warning box (inner gap 3).
- NOWARN 0.06 lowers the lesson to 0.54.

**6 Nerve (new seed 625; 698 and 1548 go to `was`).**
- Bold 0.76 is rank 1, with no box stops and 0.92 scrapes a race.
- It failed at Hard with 2 strikes (0); at 5/4/3 Hard it wins 0.74.
- The crawl foil is 0.91. Sight traps for bold: 0.47 a race.

**7 Dive (new seed 2565, was 1531 and 1115).**
- Rush wins with no stops at 3 strikes.
- **It breaks with more strikes:** Easy 4 gives 0.06; Medium 4 gives 0.07, with 117 of 153 races dissolved. At 3 strikes, the last-strike wary switch makes rush stop for barriers, and that is what saves it. With 4 or more it keeps crashing barriers.
- Scrapes are only 0.11 a race, so "eat scrapes" is not really taught.
- Gamble ties at top.
- **Unresolved at 5/4/3.** Best candidate is still 2565.

**8 Slipstream (new seed 23, was 322).**
- Follower is rank 1. It beats bold (+0.52) and the crawl foil (+0.12).
- Bold meets sight traps 0.63 a race.

**9 Sheer Face (re-shaped).**
- Climber beats balanced but ranks 4th, with runup top.
- It is close to the crawl foil.
- Dissolution is high across probes (0.73).

## Sensitivity (noise 0 and 100-149, Medium; lesson win, then margin vs worst foil)

- **NOWARN 0.06 / 0.2:** no change except map 5 (0.54 at 0.06). Box overrides clear no-warning boxes, so the knob barely touches these maps.
- **Strikes -1** (player 2, rivals 2): maps 2, 3 and 6 flip or collapse (6 goes to 0.01). Maps 1, 4, 5, 7 and 9 keep a positive margin.
- **Strikes +1** (player 4, rivals 4): map 7 collapses (0.07, margin -0.22). Map 2's margin goes to 0.01. The others hold.
- Exact numbers are in `campaign/heldout/report.txt`.

## Design-rule checks

- Lesson stopRev p75 is 2 or less on maps 1, 2, 3, 5, 7 and 8; it is 3 on map 6.
- Map 4 is 6, all-probes p75 4. Map 9 all-probes max is 7.
- Box-only stops p75 is 1 or less everywhere.
- Maps won without box stops: 1 (mostly), 3, 6, 7 and 8.
- Near-max boxes: 0 on every map.
- No-warning boxes: only map 5, which is perhaps too rare.
- Falls: 0. Extinction: 0 to 0.02.

## Tier order

Ordered by the held-out probe mean per tier. Maps 1, 3, 6 and 8 were re-ordered in the proposal, which reassigns existing stars on those maps. Maps 4 and 5 have differences of 0.03 or less, so they were left alone.

## Caveats

1. Bot play only. Rivals are the page bots; the player is a fixed-policy probe.
2. The crawl foil runs with no policy jitter.
3. Noise 0 is n 3 per probe.
4. Track labels are computed before the overrides and are stale on maps 1, 4, 7 and 9 (map 1 still says "wide, low boxes").
5. The sight-trap count is rough. The tuning agent owns the full classifier.

## What would show these picks are wrong

1. Map 1: players who stop and build do no better than players who climb on the move. The `climb0` result already suggests this.
2. Map 7: playtests at Easy or Medium with 4 or 5 strikes, where rush dissolves.
3. Any map: a person playing the lesson loses to the crawl tactic at about the rates above (maps 2, 3 and 6).
