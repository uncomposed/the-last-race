# The pattern generator: step 2 (issue 36)

[[ai gen]] Written by Claude (map designer session), 2026-11-07. Status: `implemented` and `verified` (checks and bot runs, reproducible below). No person has played a drawn map. Nothing here is `human_validated`.

## The answer

1. **The generator can write every shipped map.** All 12 shipped maps, written as block sequences, lay exactly the shipped road on 200 seeds of 200.
2. **6 of 40 drawn maps pass every filter on both seed blocks.** 8 of 40 passed on the tune seeds (1001-1040), and 6 of those 8 still passed on the held-out seeds (9601-9640). For comparison, 7 of the 14 shipped and PR 37 maps pass the same filters. Across those 6, four different generic bots are best (variety f).
3. **Why maps fail:** almost always test c′. In 30 of the 32 rejects, no generic bot beats the half-distance leader by enough, so adapting doesn't pay. Fewer fail the micro filter (9) or the rival rail (9).
4. **7 of the 18 patterns are proven alone; 11 aren't.** Proven means removing the pattern's key feature changes the bots' win shares by at least 0.15 on average, on both seed blocks. Of the five weakest patterns the director named, four are proven (1 wall behind the box, 5 hidden wall, 14 false calm, 17 chicken wall). Pattern 8, scrape-only box, misses on one seed block: its best bot wins 28% there, against a 30% bar. Details below.
5. **Six maps to play** (step 2's output for Cole). Each goes straight into the map:

| Link | Patterns | The interruption | What's hidden |
|---|---|---|---|
| [Drawn map 4](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=4) | pioneer, hidden wall, height gate, scrape-only box, tower and cellar, pothole in a rhythm | a scrape-only box, then a tower late on | a wall behind a box, what's behind the tower, the wide pothole, **and the finish** |
| [Drawn map 6](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=6) | steward ahead, warning signs, tower and cellar, height gate, scrape-only box | a height gate, then a scrape-only box | how wide the signed box is, what's behind the tower |
| [Drawn map 9](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=9) | steward ahead, pattern break, scrape-only box, hidden wall | a scrape-only box, then a hidden wall | a wall behind a box |
| [Drawn map 11](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=11) | bait corridor, pothole in a rhythm, height gate, double box | a height gate | the wide pothole in the rhythm |
| [Drawn map 35](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=35) | bait corridor, height gate, warning signs, pothole in a rhythm, wall behind the box, double box | a wall right behind a box | how wide the signed box is, the wide pothole |
| [Drawn map 37](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=37) | pioneer, wall behind the box, pothole in a rhythm, hidden wall, height gate | a hidden wall, then a height gate | the wide pothole, a wall behind a box, **and the finish** |

The road's dice change every race; the patterns and rivals stay the same for a seed. Passing the filters is a reason to play a map, not evidence it's fun.

### One-block proofs

Effect is the mean change in the 8 generic bots' win shares when the pattern's key feature is removed; best is the top bot's win share with the pattern. The rule (effect ≥ 0.15 and best ≥ 0.30 on both blocks) was fixed before the runs.

| Pattern | Effect 1001 / 9601 | Best 1001 / 9601 | Proven |
|---|---|---|---|
| 1 wall behind the box | 0.36 / 0.38 | 1.00 / 1.00 | yes |
| 2 tower and cellar | 0.06 / 0.08 | 1.00 / 1.00 | no |
| 3 pothole in a rhythm | 0.42 / 0.36 | 0.55 / 0.65 | yes |
| 4 height gate | 0.13 / 0.13 | 1.00 / 1.00 | no |
| 5 hidden wall | 0.25 / 0.24 | 1.00 / 1.00 | yes |
| 6 ceiling-raise box | 0.00 / 0.00 | 1.00 / 1.00 | no |
| 7 warning signs | 0.06 / 0.11 | 1.00 / 1.00 | no |
| 8 scrape-only box | 0.37 / 0.56 | 0.53 / 0.28 | no (best just under 0.30 on one block) |
| 9 double box | 0.01 / 0.00 | 1.00 / 1.00 | no |
| 10 stakes | 0.00 / 0.00 | 0.97 / 0.90 | no |
| 11 steward ahead | 0.22 / 0.18 | 0.60 / 0.60 | yes |
| 12 pioneer | 0.02 / 0.01 | 0.13 / 0.05 | no |
| 13 bait corridor | 0.14 / 0.13 | 0.63 / 0.63 | no (just under) |
| 14 false calm | 0.18 / 0.20 | 0.60 / 0.78 | yes |
| 15 pattern break | 0.43 / 0.44 | 1.00 / 0.95 | yes |
| 16 unknown finish | 0.00 / 0.00 | 1.00 / 1.00 | no |
| 17 chicken wall | 0.28 / 0.30 | 0.80 / 0.57 | yes |
| 18 clump start | 0.11 / 0.12 | 0.90 / 0.93 | no |

How to read the failures:
1. **One bot wins everything (2, 6, 9, 16).** With the pattern and without it, the same bot wins every race, so removing the pattern can't move anything. The pattern may still matter to a person who doesn't play like that bot.
2. **Pattern 16 can't be proven this way.** The scripted bots don't sprint differently when they can't see the finish, so hiding it changes nothing for them. Only a person can judge it.
3. **Pioneer (12)** still pays nobody: the best bot wins 13% at most.

Not retuned after these runs: tuning a pattern after seeing its held-out result would fit the held-out block.

## What's built

Code: `gen/maps.js` (the library and composer), `gen/check.mjs` (completeness and legality), `gen/score.mjs` (filters and one-block proofs). The spec is the director's comment on issue 36 with the 18 patterns.

1. **Blocks.** Each of the 18 patterns is a block: settings, the decision it forces, the road it lays, the rivals it brings, and how the composer fills its settings at a given place on the road. Three plain connectors fill gaps the patterns don't cover: one box, a run of boxes, and a list of rivals.
2. **Overlap.** A block can lay road, add rivals, or both. A rival pattern (a steward ahead, a pioneer, a clump) runs over every road block, so a steward ahead while a hidden wall waits behind the next box is just two blocks in one map.
3. **Composer** (`gnDraw(seed)`). From genTrack it borrows a difficulty shape over the road (steady climb, early wall, staircase, late cliff) and a deception level, which sets how far warning signs lie. It picks one rival pattern and three to five road patterns. Each block gets settings for where it sits, using the real ceiling reached so far. Rules:
   - an interruption (tower, pattern break, height gate, wall behind the box, hidden wall or scrape box) in the second half;
   - at least one hidden-information pattern;
   - a run-up after a block that leaves you slow when the next wants you fast;
   - the micro rule from Cole's PR 38 verdict: any stretch over 600 without a wall or box gets one, either a wall needing a little more height than a default build or a small box with a low wall right behind it. A false calm is exempt, because the empty stretch is its point;
   - a hidden finish on about a third of draws.
4. **One-block mode** (`gnOne(id)`, keys `blk-<id>`). One pattern alone, with a short run-in and run-out. A pattern with no rivals of its own races one steady Reader, so there is someone to beat.
5. **Completeness.** All 12 shipped maps are written as block sequences (`ex-<key>`). `gen/check.mjs` shows each one lays exactly the shipped road on 200 seeds: every wall and box, with position, width, rise, odds and ceiling, plus the finish, the player and the rivals.

| Shipped map | As blocks |
|---|---|
| Three Strikes | rivals + scrape-only (8) |
| Long Sight | rivals + pothole in a rhythm (3), several wide |
| Elbows | clump start (18) + pothole in a rhythm (3) |
| The Steward | steward ahead (11) + a run |
| Takeoff | rivals + rhythm (3) + tower (2) + height gate (4) + box + height gate (4) + box |
| Red Box | bait corridor (13) + box |
| Trailbreaker | pioneer (12) + a run |
| The Picket | rivals + height gate (4), with one box inside |
| Two Endings | rivals + a run + height gate (4) + double box (9) + tower and cellar (2) |
| The Only Box | rivals + false calm (14) |
| The Ladder | rivals + ceiling-raise box (6) |
| Second Order | rivals + tower (2), with a wall, a box or nothing behind |

Patterns no shipped map uses yet: 1 (wall behind the box; PR 37's Fence Behind uses it), 5, 7, 10, 15, 16 and 17.

6. **Hidden finish (pattern 16).** On a drawn map with this pattern, the finish stays unknown until it is within sight:
   - **In the game page:** the flag and the minimap's finish mark don't appear until the finish is within your sight range. Until then the minimap is scaled to what you know (the labs, what you've seen, and your sight), not to the finish. Checked in the browser on drawn map 4: nothing shows at 1,400 from the finish, and the flag and mark show at 120.
   - **For bots:** every bot posture is wrapped so that, while it decides for a lab, it sees the finish a long way off until the finish is within that lab's sight (`gnBlind` in `gen/maps.js`). Two postures read the finish: tail (it stops following near the end) and coleFollow (it sprints near the end). Rivals in drawn maps don't read it.
   - **SIM_ID:** the generator goes into the game page after the hashed simulation section (game/build.mjs), so the shipped campaign's SIM_ID is unchanged at `e76ea276436eed44`. The wrapper passes straight through on every map without the pattern, and `node game/check.mjs` passes.
7. **Playable drawn maps.** `lessons.html?gen=1&seed=N` (and `game.html?gen=1&seed=N`) goes straight to drawn map N's start card. Nothing is saved, and no best time or leaderboard is involved. The end screen offers Race again and the start page.

## Limits

1. **Pattern 16 (unknown finish) is only on drawn maps.** Cole asked to try it per map, on new maps first, so no shipped map uses it.
2. Drawn maps have no hand-tuned lesson bot, so test c uses its lesson-free form: the best generic bot beats the half-distance leader. On step 1's maps that version scores 69% balanced accuracy on held-out seeds and 62% with the map left out (the lesson-bot version: 72% and 68%).
3. The filters are bot proxies fit on 12 fun maps (fun/NOTES.md). Passing them is a reason to play a map, not evidence it's fun.
4. Rivals in drawn maps use a fixed set per rival pattern. The composer doesn't yet tune rival builds to the road.
5. Only 40 draws were raced. A run of draws 41-80 was stopped partway to free the Mac's CPU, and no result from it is used. So the 6-of-40 pass rate rests on one batch.
6. No person has played a drawn map yet.

## Reproduce

Run from `check/lessons`:

```
node build.mjs --only campaign+ship+reader+gen
node gen/check.mjs --seeds 200
node fun/tests.mjs --page gen/page.html --maps blk-fence,blk-tower,... --start 1001 --n 40 --json blk-1001.json
node fun/tests.mjs --page gen/page.html --maps abl-fence,abl-tower,... --start 1001 --n 40 --json abl-1001.json
node fun/tests.mjs --page gen/page.html --draw 1-40 --start 1001 --n 40 --json gn-1001.json
node gen/score.mjs --blocks blk-1001.json,blk-9601.json,abl-1001.json,abl-9601.json --tune gn-1001.json --hold gn-9601.json
node ../game/build.mjs
node ../game/check.mjs
```
