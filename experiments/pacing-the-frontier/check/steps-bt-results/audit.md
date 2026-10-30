# Step gaps: independent audit of the four backtests

[[ai gen]] 29 October 2026. Bot play only. Status: `verified` (checks run), not `human_validated`. Nothing in `prototype.html` was changed and nothing was committed.

## Short answer

1. **All four headline claims reproduce on fresh seeds, with almost no shrinkage.** This round did not repeat the 40–50% shrink seen before.
2. **The timing fix (BOXU 0.25) does nearly all the work.** The generator change (BOXFIT, stepW 110, stepFit 125) adds nothing measurable to campaign win rates (−0.2 ± 0.3). It also costs lesson coverage on Wider Gaps and Wider Singularity days.
3. **With the timing fix, do not add the player +1 strike.** The campaign at 3 strikes already sits 8.5 points above steps off, and +1 takes that to 17 points above.
4. **The timing fix nearly removes falls, and with them extinction, in chill-off play.** Campaign extinction falls from 9.4% of races (steps off) to 0.1%. Nobody predicted this, and it needs a decision.
5. **Crawl-to-the-box is no longer dominant in the campaign.** Gamble now leads instead.
6. **Bots still break the 3 stop-and-reverse rule.** Only 4 of 9 campaign picks stay clearly theirs under the fix.

## How this was run

- **Blocks.** Free seeds 5000–5999 (chill on, the free default, plus a chill-off copy). Campaign noise ids 300–399 at Medium, steps forced on. Daily offsets 900–1199 (chill off). Lesson search on offsets 900–1099.
- **Players.** The 10 harness probes ("lesson mean" is their average). The tuning agent's `crawl` (gamble base) and `smart` (stop and build) controllers, copied. The only change: `smart` now plans with `C.BOXU` when the page has it.
- **Runner.** `audit/race.mjs` runs one step loop and records outcomes, stopRev (as `runRace`) and sight-trap encounters (as `sighttrap.mjs`). It matches `runRace` and `runBoxRace` exactly (150 of 150 checks; `idcheck.mjs`). The patched page with steps off gives identical races to the current page.
- **Pages** (in `audit/`):
  - `page-combined.html`: `generator.diff`, plus BOXU 0.25 and stepW 110.
  - `page-timing.html`: BOXU 0.25 with today's generator. Its tracks are identical to the current page's (`idtim.mjs`).
  - `*-propcamp.html`: the same pages with `campaign-proposed.js` spliced in.
- **Statistics.** SEs are clustered by seed, map/tier/noise id, or date/tier. Deltas are paired. A `?` marks anything under 3 SE. Predictions and results are in `audit/prereg.txt`. Full tables are in `audit/analysis.txt` and `audit/lesson-coverage.txt`.

## 1. Reproduction (fresh blocks)

| Report | Claim | Original | Audit | Shrinkage |
|---|---|---|---|---|
| tuning | +1 player strike, campaign Medium, lesson mean | +9.9 ± 0.3 | +9.8 ± 0.2 | 1% |
| tuning | same, free play | +7.3 ± 0.3 | +6.8 ± 0.3 | 7% |
| tuning | crawl:gamble vs best probe, campaign Medium 3 | 48.5 vs 26.5 | 47.6 vs 24.4 (gap +23.2 ± 1.0) | none |
| tuning | snap share of box encounters, free chill on | 3.3% | 3.2% | none |
| boxes | daily follower, current to proposed (twists, unfiltered) | about +22 | +19.2 ± 1.7 | about 12% |
| boxes | lesson coverage, strike / race / shadow | 21.5 / 25 / 14.5 | 21.5 / 24.0 / 18.5 | none |
| daily | steps on vs off, daily lesson mean | 5–11% on | 6.5% vs 21.4% (−14.9 ± 0.7) | none |
| campaign | 9 picks beat their named worst foil | 9 of 9 | 9 of 9, z 4.1 to 25 | none |

Every claim reproduces well within 3 SE.

**Caveat on the snap share.** The 3.2% is for free play with chill on. With chill off it is 9–11% on the current page (campaign 9.2%, free 10.7%).

## 2. Combined configuration (rivals at 3 strikes)

Columns: lesson mean, crawl and smart are win rates; Dis is the lesson probes' own dissolution. Scr and Fall are the player's scrapes and falls per race. Ext is extinction per race and per fall. StopRev is the lesson probes' p50/p75/max. Snap is the forced share of box encounters.

| Mode | Setting | Lesson mean | Crawl | Smart | Dis | Scr | Fall | Ext race / fall | StopRev | Snap |
|---|---|---|---|---|---|---|---|---|---|---|
| Free (chill on) | steps off, 3 | 19.0 | 31.1 | 27.8 | 14.0 | 0.16 | 0.084 | 12.4 / 28% | 1/2/6 | n/a |
| | combined 3 | 18.9 | 25.4 | 4.5 | 35.7 | 0.34 | 0.017 | 2.6 / 42% | 1/2/6 | 2.4% |
| | combined 4 | 25.7 | 28.5 | 10.1 | 20.8 | 0.38 | 0.016 | 2.6 / 42% | 1/2/7 | 2.5% |
| Campaign, current table | steps off, 3 | 22.7 | 34.1 | 16.9 | 25.0 | 0.20 | 0.099 | 9.4 / 29% | 1/2/7 | n/a |
| | combined 3 | 31.1 | 42.1 | 20.6 | 37.5 | 0.21 | 0.002 | 0.1 / 57% (54 falls) | 2/2/7 | 1.3% |
| | combined 4 | 40.0 | 49.4 | 22.0 | 24.3 | 0.25 | 0.002 | 0.1 / 59% | 2/3/8 | 1.4% |
| Campaign, proposed table | steps off, 3 | 24.4 | 41.9 | 29.3 | 22.5 | 0.20 | 0.105 | 9.6 / 26% | 1/2/6 | n/a |
| | combined 3 | 36.3 | 39.3 | 25.2 | 26.9 | 0.07 | 0.002 | 0.2 / 57% | 1/2/7 | 0.7% |
| | combined 4 | 44.7 | 43.4 | 29.4 | 13.5 | 0.08 | 0.002 | 0.2 / 57% | 1/2/7 | 0.7% |
| Daily (strict filter, step twists) | steps off, 3 | 21.4 | 13.2 | 24.1 | 38.8 | 0.44 | 0.205 | 9.1 / 23% | 2/3/9 | n/a |
| | combined 3 | 19.3 | 37.1 | 10.3 | 64.0 | 0.54 | 0.044 | 2.2 / 29% | 2/3/7 | 1.3% |
| | combined 4 | 30.9 | 51.4 | 22.9 | 47.9 | 0.66 | 0.049 | 2.4 / 29% | 2/3/8 | 1.4% |

Paired lesson-mean deltas against steps off at 3:

| Mode | Combined 3 | Combined 4 | Timing-only 3 |
|---|---|---|---|
| Free | −0.2 ± 0.6 ? | +6.7 ± 0.7 | −0.2 ± 0.6 ? (chill off) |
| Campaign, current table | +8.5 ± 0.4 | +17.3 ± 0.4 | +8.7 ± 0.5 |
| Campaign, proposed table | +12.0 ± 0.5 | +20.4 ± 0.5 | +13.9 ± 0.5 |
| Daily | −2.1 ± 0.8 ? | +9.5 ± 0.9 | +0.2 ± 0.8 ? (relaxed filter) |

Free play with chill on is not a test of BOXU, because the auto-jump ignores it. With chill off, free play goes from −6.7 ± 0.7 on the current page to −0.8 ± 0.6 (?) on the combined page.

## 3. Answers

1. **Is the player +1 strike still needed?** No.
   - The +1 was sized to make up for peak-timed jumps. With BOXU, free play and the daily already match steps off at 3 strikes (deltas within ±2, provisional).
   - The campaign overshoots at 3 already (+8.5). At 4, Medium would sit 17 points above today's Medium.
   - If anything, Medium is now too easy for bots. That is because the fix also removes falls (item 5 below), not because of strikes.

2. **Is crawl-to-the-box still dominant?** No.
   - Campaign: crawl is −6.2 ± 1.4 behind the best probe (gamble) on the current table, and −15.8 ± 1.3 on the proposed one.
   - Free play: −7.8 ± 2.3.
   - Daily: roughly tied with the best probe (+3.2 ± 2.0 ?). It is still far above the lesson mean.
   - Gamble is the new leader among probes in the campaign. The best probe is chosen on the same block, which biases it upward.

3. **Do bots still exceed 3 stop-and-reverses?** Yes.
   - Lesson probes reach a max of 7–8 (p75 is 2–3). More than 3 happens in 8–13% of campaign races and 9–15% of daily races.
   - Rival bots reach a max of 6, in 7–10% of campaign races.
   - The fix does not help this; it is slightly worse than the current page (5.4% to 8.2%). Map 4's lesson probe sits at p75 5–6.

4. **Which campaign picks survive?** The test is: the pick beats its named foil by at least 3 SE, *and* it is top or within 5 points of top. Combined page, Medium 3:
   - **Survive:** 1 Build First, 3 Coin Toss, 5 Even Keel, 8 Slipstream.
   - **Re-pick:**
     - 2 The Long Climb: climber wins 9% against gamble's 83%, a flip.
     - 6 Nerve: bold 72 against gamble 93.
     - 7 Dive: rush 83 against gamble 94. Rush also collapses to 36% at 4 strikes.
     - 4 Fog Line and 9 Sheer Face: runup leads by 16–42 points. That was already true before the fix.
   - The timing-only page gives the same picture, with map 4 also losing its margin.
   - *Inference:* the re-picks come from the timing change, not from BOXOV widths.

5. **Unasked, and the biggest finding:** with BOXU the bots almost never fall in chill-off play.
   - Player falls go from 0.227 to 0.002 per race in the campaign. Extinction goes from 9.8% to 0.1% of races.
   - The timing-only page does the same, so this comes from the timing, not the widths.
   - The tuning agent's advice ("keep odds 4/10/30, NOWARN is the extinction knob") assumed falls happen. Under the fix they barely do, for bots.

## 4. The timing claim, in the page's own code

- `arcY` (line 2113) is `JUMP·clamp(2.2·sin(πu), 0, 1)`, so it is flat from u = 0.150 to 0.850. After the arc ends, the lab sinks at `sinkRate` (`2.2·JUMP·π/jd`).
- `boxOutcome` (the bar) and `botPress` both assume u0 = 0.5 at the face (peak at the face). The real crossing in `stepLab` (around line 2575) follows the lab's actual `jy`, so the physics is not a harness artifact.
- Check on real boxes (`audit/timing.mjs`, 1,084 boxes, lab at its ceiling, half speed):
  - At peak timing, 27% clear clean on the current generator and 34% on the combined one.
  - At u0 0.25, 96% clear clean.
  - The clean window runs from u0 = 0 to about 0.34–0.42. That is about 375–440 ms median, and 280 ms at p10.
  - At full speed, everything clears at either timing.
  - So peak timing sits outside the window for most boxes at moderate speed, and BOXU 0.25 sits inside it.
- **The bar never shows a press point.** It predicts the outcome *if* the press lands at u0. With BOXU 0.25, a hand player who presses for the peak would see "clean" and scrape on about two thirds of boxes at moderate speed.

**Keep two claims apart:**
1. "The timing fix makes boxes clearable" is verified.
2. "It is better for the game" is not shown by bots. Its measured side effects are near-zero falls, a campaign above steps-off difficulty, and gamble dominance.

The real defect was the bar silently assuming a poor press point.

## 5. Scrape-only boxes and the relaxed filter (information, not a defect)

Scrape-only boxes per timing model:

| Page | Timing | Boxes scrape-only | Per map | Maps with ≥1 | Singularity scrape-only |
|---|---|---|---|---|---|
| current, free | peak | 29.3% | 1.59 | 75.5% | 73.5% |
| current, free | u25 | 1.0% | 0.06 | 5.0% | 2.8% |
| combined, free | u25 | 0% | 0 | 0% | 0% |
| combined, daily (k = 0) | peak / u25 | n/a | 1.49 / 0 | 83% / 0% | 79% / 0% |
| campaign, proposed table (combined / timing-only) | u25 | 0% / 4.7% | 0 / 0.22 | 0% / 22% | 0% / 22% |

Daily filter, first-seed pass rate:

| Page | Strict | Relaxed (≤1 scrape-only) |
|---|---|---|
| combined | 79.7% | 79.7% (identical) |
| timing-only | 87.3% | 89.7% |

Combined fails mostly on near-max (42 of 300 dates) and no-warning boxes (21). By twist: Wider Gaps passes 45% and Wider Singularity 67%.

Lesson coverage per briefing kind (filter and lesson, 200 seeds, SE about 2–3):

| Kind | Combined, strict = relaxed | Timing-only, strict / relaxed |
|---|---|---|
| barrier | 2.5 | 2.5 / 2.5 |
| strike | 21.5 | 18.0 / 18.5 |
| race | 24.0 | 21.0 / 21.5 |
| gap | 7.5 | 18.0 / 18.0 |
| shadow | 18.5 | 23.0 / 23.5 |
| singularity | 9.0 | 14.5 / 14.5 |

Relaxing the filter changes almost nothing once timing is fixed. Scrape-only boxes nearly vanish at u25.

## 6. Ready now vs another round

**Ready to integrate:**
1. BOXU 0.25 for bot presses and bot planning (`botPress`, `stepNeed`). It is verified in the page's own math.

**Needs another round:**
1. **The bar.** It should show the press point, or the window, rather than silently assuming one. A phone playtest is needed (human-validated only).
2. **Falls and extinction under the fix.** Decide whether near-zero falls are acceptable. If not, the lever is box shape (no-warning boxes exempt from the fit, or harder ones), not the odds.
3. **The generator change.** Hold it. Against timing-only it adds no win-rate effect (−0.2 ± 0.3), lowers filter pass (80% vs 87%), and halves gap and singularity lesson coverage.
4. **The +1 strike.** Drop it while BOXU ships. Re-tune Medium if the extinction decision changes falls.
5. **Campaign re-picks.** Re-pick maps 2, 6, 7 (and 4 and 9) under the new timing. Gamble needs a foil test on every map.
6. **The stopRev rule.** It still fails for bots, independent of these changes.

## Limits of bot-only evidence

- Every probe has perfect hands (skill 100): its press lands exactly at u0. The whole BOXU gain assumes the player presses 25% into the arc. Nothing here measures whether people can, or whether the bar teaches it.
- Bots enter a box through the side only when `sideSurvives` says they will survive. So "near-zero falls" is a bot result. Humans who misjudge will still fall, so extinction may not vanish for people. It could also be rarer or commoner than the steps-off level; unknown.
- Crawl and smart are hand-written controllers. Gamble's lead is a fact about these 10 policies and the current rival bots.
- The "best probe" columns pick the maximum on the same block, which biases them upward. Paired deltas are the fair comparison.
- I did not re-run the campaign at Easy or Hard.
