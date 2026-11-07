# Quick tests for fun: step 1 back-test (issue 36)

[[ai gen]] Written by Claude (map designer session), 2026-11-07. Status: `implemented` and `verified` (the bot runs below were run and are reproducible). The tests are bot proxies, not evidence that anyone enjoys a map.

## The answer

1. **Two per-map tests separate fun maps from boring ones better than chance, and they hold when the map itself is left out:**
   1. **Adaptation pays (test c):** the map's adaptive lesson bot beats the generic bot that most often leads at half distance by at least 38 points. 68% balanced accuracy with the map left out.
   2. **The winner keeps deciding (test a2):** whoever wins makes at least about 26 control changes a minute. 63% with the map left out.
2. **One set-level test separates the PR 38 days cleanly:** variety (test f). Across the 12 fun maps, 7 different generic bots are best. Across PR 38's 26 Elbows days, one bot is best on every day; the same holds for the 16 Ladder days, and 3 bots across the 18 Two Endings days. No per-map test can fail those days, because each is a near copy of a fun map. Their problem is sameness, which only shows across a set.
3. **Failed to separate** (at or below chance with the map left out): micro measured on the lesson bot, dominance by one generic bot, decisions right after a reveal, and rival survival.
4. **The director's catch was right.** Micro measured on the lesson bot scored Takeoff as having no decisions at all, because its lesson bot floors the whole race. Measured over races that were won, by whichever bot won them, Takeoff has a decision about every 4 seconds. The winner-based version (a2) is the one to keep.

## How each test is measured

Code: `fun/tests.mjs`. Every race is driven through `ship/hdnode.mjs`, the ship manager's Node port of the browser key driver (decisions every 0.25 to 0.4 s, arriving 0.25 to 0.4 s late, keys only). Each map gets 40 seeds for its lesson bot and for each of 8 generic bots: `maxout`, `coleFollow`, `sp-hs-eyes`, `sp-hs-slow`, `sp-hs-tail`, `sp-even-slow`, `sp-s-bold`, `sp-h-eyes`.

1. **a. Micro, lesson bot:** a decision point is any change of split preset, pace quarter, floor or back. Changes under 0.5 s apart are merged. The test reports the longest stretch without one, and changes per minute.
2. **a2. Micro, winner:** the same two numbers, over every race the player won, whichever bot won it.
3. **b. Dominance:** the highest win share of any one generic bot.
4. **c. Interruption:** take the generic bot that most often leads at half distance. The test reports how often it leads at half and then fails to win, and how far the adaptive lesson bot's win share beats it.
5. **d. Information:** the share of the lesson bot's decisions that come within 1 s of a box or wall first becoming known to it. Two earlier versions were dropped: making everything public, and giving 40 free sight points. Both lowered the bots' wins, because scripted bots aren't built to use extra information.
6. **e. Rivals survive:** the share of races where at least one rival is still racing at the end.
7. **f. Variety:** how many different generic bots are best across a set of maps.

## The labeled set

`fun/labels.json` has 108 rows, each with its source. It was built from primary sources: issues 34 and 36, the commits, and Cole's play notes. Cole's private notes are paraphrased, never quoted.

- **Fun (12 used):** the 10 shipped maps Cole played and certified (issue 34, 2026-11-07). Eight of those are labeled at group level, The Ladder and Two Endings by name. Also two round 1 lesson maps he enjoyed (The Last Box and The Minefield at commit `bba125c`).
- **Boring (80 used):**
  - Two round 1 maps he called boring (see-early brake and pack at `bba125c`).
  - The 18 maps of the 2026-11-05 lessons page. **This label is inferred** from one remark about the whole page, and the weakest in the set.
  - PR 38's 60 generated days (issue 36 verdict, group level).
- **Not used:** The Only Box and Second Order (not played); neutral maps; the old `genTrack` generator. It is fun as a family, but lives in an older sim and has no per-seed labels.

## Results

Tuning seeds 1001-1040, held-out seeds 9601-9640. BA is balanced accuracy: the fun hit rate and the mean boring hit rate (equal weight to each boring group), averaged.

| Test | Rule (fit on tune) | Tune BA | Held-out seeds BA | Map left out BA | Fun pass | Round 1 boring fail | Round 2 boring fail | PR 38 fail |
|---|---|---|---|---|---|---|---|---|
| a. longest stretch, lesson bot | ≤ 13.6 s | 59% | 56% | 27% | 75% | 100% | 11% | 0% |
| a. decisions/min, lesson bot | ≥ 23.1 | 65% | 63% | 54% | 75% | 100% | 50% | 0% |
| a2. longest stretch, winner | ≤ 5.9 s | 63% | 58% | 32% | 50% | 100% | 67% | 30% |
| **a2. decisions/min, winner** | ≥ 26.5 | 75% | 72% | **63%** | 83% | 100% | 83% | 0% |
| b. best generic bot win share | ≤ 0.95 | 63% | 61% | 40% | 92% | 50% | 0% | 42% |
| c. half-leader fails to win | ≥ 0.40 | 67% | 59% | 59% | 58% | 100% | 33% | 43% |
| **c. lesson bot beats half-leader by** | ≥ 0.38 | 72% | 72% | **68%** | 67% | 100% | 89% | 43% |
| d. decisions after a reveal | ≤ 0.23 | 58% | 58% | 46% | 58% | 50% | 56% | 70% |
| e. a rival survives | ≤ 0.82 | 61% | 52% | 31% | 67% | 50% | 6% | 57% |

The hit-rate columns are on the held-out seeds. "Map left out" fits each rule without that map, then judges the map on held-out seeds. That's the honest number, because new maps are what a generator makes.

**Variety (f):** 7 distinct best bots over the 12 fun maps (both blocks); 6 to 7 over the 18 round 2 maps; PR 38 days: Elbows 1 over 26, Ladder 1 over 16, Two Endings 3 over 18.

Two of the rules point the wrong way, which is why they're dropped:
- **d:** fun maps had fewer reveal-driven decisions.
- **e:** fun maps had *fewer* surviving rivals.

Rival survival stays a guard rail because Cole asked for it directly (issue 36), not because it separates. It also missed the suspected Elbows redraw day: a rival survived in 90% of that day's races.

## What this does not show

1. Only 12 fun maps, and most labels are group-level. The round 2 labels are inferred. Every percentage above moves by about 8 points per map.
2. **Confound:** the fun maps are hand-built and human-played; the boring ones are mostly generated or bot-tuned. A test may be detecting "hand-built", not fun.
3. Shipped maps use the browser driver's tuned knobs for their lesson bot; other maps use generic knobs. That may flatter the shipped maps on a, a2 and c.
4. Thresholds were fit on these same maps. The left-out-map numbers are the honest ones, and they are modest.
5. No human played anything for this. Nothing here is `human_validated`.

## Recommendation for step 2

Keep three filters for generated maps:
1. Adaptation pays (c, lesson beats half-leader by about 0.4).
2. The winner keeps deciding (a2, at least about 26 changes a minute).
3. Across a set of days, the best generic bot must vary (f).

Add "a rival survives some races" as a guard rail only. What would show this wrong: Cole finds a generated map that passes all three boring, or one that fails them fun.

## Reproduce

Run from `check/lessons`. The round 1 maps come from commit `bba125c`, renamed `<key>@r1`:

```
for f in small-risks steward-pack see-early; do mkdir -p r1-$f; git show bba125c:experiments/pacing-the-frontier/check/lessons/$f/maps.js | sed -E "s/key:'([a-z0-9-]+)'/key:'\1@r1'/" > r1-$f/maps.js; done
node build.mjs --only campaign+r1-see-early+r1-small-risks+r1-steward-pack+ship+reader && mv reader/page.html fun/r1.html
node build.mjs --only campaign+close-race+see-early+small-risks+steward-pack+look-pays+act5+ship+reader && mv reader/page.html fun/r2.html
node fun/tests.mjs --page fun/r2.html --maps picket,elbows --start 1001 --n 40 --json ship-1001.json
git show origin/claude/daily-generator:experiments/pacing-the-frontier/check/lessons/ship/gen-days.js > gen-days.js
node fun/tests.mjs --page fun/r2.html --gen gen-days.js --start 1001 --n 40 --json gen-1001.json
node fun/score.mjs --tune ship-1001.json,r1-1001.json,r2-1001.json,gen-1001.json --hold ship-9601.json,r1-9601.json,r2-9601.json,gen-9601.json
```

Delete the `r1-*` folders afterwards. They are scratch copies and are not committed.
