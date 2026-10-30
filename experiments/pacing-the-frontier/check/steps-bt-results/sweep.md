# Step gaps under BOXU 0.25: box-settings sweep

[[ai gen]] 29 October 2026, 14:37 to 14:56 (19 min wall clock), 4 node processes at most. Bot play only. Status: `verified` (checks run), not `human_validated`. `prototype.html` unchanged, nothing committed.

## Short answer

1. **No setting of the two layout-preserving levers reaches the reference.** And neither lever preserves layout (point 4).
2. **Best point: `C.NOWARN` 0.8, with `K.riseScale` 100 or 92.** On the held-out campaign it gets win and falls part of the way back; extinction gets about half of the way back.
3. **Dissolution cannot be fixed with box shape.** It sits at about 45%, against a reference of 24%, at every point tried, including stepFit. It comes from scrape strikes (0.46 scrapes per race against 0.20), and box shape barely moves scrapes. The lever for it is `strikeGap` or the strike count, not the boxes.
4. **Layout is not preserved by riseScale or NOWARN.** In the current generator the width is capped at `cleanW(rise)·stepFit`, so a different rise refits the width and shifts every later obstacle. Results: riseScale 120 changed all 109 tracks checked (9 campaign maps and free seeds 0–99). NOWARN 0.8 changed 102 of 109 (6 of the 9 maps), and the n80r92 point changed 109 of 109.
5. **stepFit is worse.** stepFit 120 makes 60% of boxes near-max (hNeedBot ≥ 0.9) and makes crawl the top player again (rank 1 of 11). With NOWARN 0.8 it overshoots, with falls at 0.23 per race and win at 13.6.

Prediction made first (`sweep/prediction.txt`): NOWARN 0.35–0.45 with riseScale about 110 restores falls of about 0.1 and extinction of about 9%. **Wrong.** Falls plateau at about 0.075 even at NOWARN 1.0. Lower rises, not taller ones, add falls, because a lower rise lets a floorless box be wider.

## Held-out (campaign noise ids 400–499, Medium, 3 strikes, chill off; 10 lesson probes plus crawl)

Errors are ± SE, clustered by map/tier/noise id. Δ is the paired difference from the reference.

| Metric | Reference (steps off) | NOWARN 0.8, riseScale 92 | NOWARN 0.8, riseScale 100 |
|---|---|---|---|
| Lesson win | 23.1 ± 0.3 | 20.2 ± 0.4 (Δ −2.8 ± 0.5) | 22.7 ± 0.5 (Δ −0.4 ± 0.5) |
| Dissolution | 24.3 ± 0.4 | 45.3 ± 0.6 (Δ +21.1) | 46.4 ± 0.7 (Δ +22.2) |
| Extinction per race | 9.4 ± 0.4 | 5.0 ± 0.3 | 4.4 ± 0.3 |
| Falls per race | 0.096 ± 0.002 | 0.072 ± 0.003 (Δ −0.024) | 0.056 ± 0.002 (Δ −0.040) |
| Scrapes per race | 0.20 | 0.46 | 0.47 |
| Lesson stopRev p50/p75/max (share above 3) | 1/2/7 (5.3%) | 2/2/7 (6.0%) | 2/2/7 (6.4%) |
| Crawl rank of 11 (win) | 2 (33.6) | 5 (24.7) | 5 (26.4) |

The calibration base, shipped shape (noise ids 1–30), was: win 32.0, dissolution 43.9, extinction 0.1%, falls 0.001.

**Daily** (offsets 1300–1499, steps forced on). NOWARN 0.8 overshoots the daily. Win is 11.8 against 20.4 (Δ −8.6 ± 0.8) and extinction is 12.3% against 8.6%. Falls match: 0.216 against 0.207. So the daily and the campaign want different NOWARN values.

**Chill on** (campaign, noise ids 1–15). The final point loses 0.9 ± 0.3 win against chill off, and extinction rises from 5.0–5.8% to 8.7%. Against the chill-on reference: Δ −2.5 ± 1.2. The shipped shape loses 1.1 ± 0.4 under chill.

## Races used

The run used 405,765 races, including about 97k for calibration across 17 settings, each at noise ids 1–30. Tools: `sweep/sweep.mjs` (race.mjs on `audit/page-timing.html` with K/C overrides), `sweep/an.mjs` and `sweep/lay.mjs`. The calibration tables are reproduced by `node an.mjs c-ref <names>`.

## What would show this wrong

1. A held-out run of NOWARN 0.8 whose falls are below 0.05 or whose win is above 25.
2. A rise and width setting that reaches falls of 0.1 without stepFit or near-max boxes. I did not try RISEFLOOR or BOXU-aware fitting (the fit still assumes u0 0.5).
3. Human play: bots fall only through `sideSurvives` misjudgements and forced encounters.
