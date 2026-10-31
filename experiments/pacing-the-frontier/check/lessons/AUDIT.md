# Lesson maps: audit on fresh seeds

[[ai gen]] Written by Claude, 2026-10-31, second pass after Cole's first playtest. Four Opus agents each built one lesson (their write-ups are in each folder's `NOTES.md`). They tuned on seeds 1 to 40 and reported seeds 1001 to 1040. This audit reran every claim on seeds 2001 to 2040, which no agent saw, with the full rule grid:

```
node build.mjs --only <lesson> && node check.mjs --only <lesson> --start 2001 --grid
```

Status: `verified` by bots only. Cole played the maps once (2026-10-31); his notes are below. Nothing is `human_validated`.

## What a score means

Each map has a claim: a formula over bot win rates, written by the agent before the audit. Most are "the lesson's strategy wins this many percentage points more often than the best foil the agent tested". So "Score 33, needs 15" means the lesson's bot won 33 points more often than the strongest alternative on the list, over 40 seeds, and the agent had said 15 was enough.

- It says the map rewards the lesson's strategy over the foils someone thought of. It does not say a person will find that strategy, feel the lesson, or have fun.
- **The rule grid** is resilience: the claim rerun with each of the six rule knobs at its low and high value.
- **The max-out check** (added after the playtest) is completeness: Cole found a simple strategy no agent tested (build height and speed while running, never look, then floor it). If it wins as often as the lesson's strategy, the map doesn't need its lesson, whatever the score says.

## Summary

| # | Map | Score (need) | Rule grid | Max-out wins | Lesson's best wins | Cole's play |
|---|---|---|---|---|---|---|
| 1 | close-footsteps | 20 (10) | 13 of 13 | 15% | 90% | fine |
| 2 | close-wall | 35 (20) | 13 of 13 | 20% | 100% | **couldn't build the wall in time** |
| 3 | close-spend | 33 (15) | 12 of 13; breaks at strikes 2 | 0% | 48% | not played |
| 4 | see-early-brake | 33 (15) | 13 of 13 | **100%** | 98% | **max-out wins; doesn't teach** |
| 5 | see-early-bravo | 35 (15) | 13 of 13 | 75% | 100% | **couldn't judge the landing; too hard to brake** |
| 6 | see-early-pack | 33 (15) | 13 of 13 | **100%** | 98% | **max-out wins; doesn't teach** |
| 7 | sr-landing | 95 (30) | 13 of 13 | 3% | 95% | fine |
| 8 | sr-odds | 45 (30) | 13 of 13 | 40% | 65% | not played |
| 9 | sr-lastbox | 57 (30) | 10 of 13; breaks at sight 70, 130, strikes 2 | **100%** | 100% | fun |
| 10 | steward-minefield | 40 (20) | 8 of 13; breaks at share 20, narrow 50, sight 130, build 10, strikes 2 | 0% | 55% | fun |

The max-out bot agrees with Cole on maps 4 and 6, and finds the same hole in map 9, which he enjoyed anyway. On map 2 the bot plants the wall every time and Cole couldn't: a stopped lab's barrier appears only when it starts forward again, which a bot times perfectly and a person doesn't (see below).

## Harness changes in this pass

The lesson agents found bugs in the segments' stock bots. They are fixed in the lesson build only (`build.mjs`), so the segments page, whose rivals Cole has played, is unchanged:

1. A barrier before a box hid the box from the plan, so the careful bot hit the box at full speed. It now sees it.
2. Seeing a box too late to stop, the careful bots braked into it. They now commit at full speed, as the page's own bots do. (Fix 1 exposed this.)
3. The careful bot crept blind to 8 short of a box face, where its jump press fired and it fell in. It now stops 25 short.
4. The slowest clean speed was found by bisection, but jump time isn't monotonic at low speed. It now steps down from top speed.

One map bot relied on bug 1 (sr-landing's pacing bot braked for barriers only while the box was hidden). It now paces for the barrier explicitly. Against the first audit, scores moved little: steward-minefield 30 to 40 (and 7 to 8 of 13 on the grid), sr-landing 93 to 95, see-early-pack 35 to 33, the rest the same.

On the segments page these fixes would move several segments a lot (Rising Stakes' build bot falls more, not less, without fix 2), so porting them there needs its own pass.

## What this doesn't show

- Bots aren't people. Map 2 is the proof: 100% for the bot, impossible for Cole.
- Max-out is one human strategy. There may be others no bot plays.
- The six rule knobs move one at a time. Two moved together could break a map that survives each alone.

## Raw output

### close-race

#### close-footsteps: Footsteps

Claim: Checking the mirror wins most: it looks when Racer is far and rushes when it is close. Score 20, needs 10: **holds**. Variants seen: 27.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 70% | 30% | 0% | 10% | 5% | 0.05 | 11.7 s |
| crLook | 70% | 0% | 0% | 5% | 0% | 0.1 | 19.6 s |
| crMirror | 90% | 10% | 0% | 5% | 5% | 0.05 | 17.3 s |
| *maxout* | 15% | 83% | 0% | 28% | 5% | 0.05 | 13 s |

Max-out check: building height and speed while running, never looking, wins 15%; the best posture above (crMirror) wins 90%. The lesson beats max-out by 75 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 17 | holds |
| Fall odds | 150 (default 100) | 20 | holds |
| Follower share | 20 (default 40) | 20 | holds |
| Follower share | 70 (default 40) | 20 | holds |
| Narrowing distance | 12 (default 25) | 20 | holds |
| Narrowing distance | 50 (default 25) | 20 | holds |
| Sight per point | 70 (default 100) | 15 | holds |
| Sight per point | 130 (default 100) | 20 | holds |
| Build rate | 10 (default 14) | 18 | holds |
| Build rate | 18 (default 14) | 20 | holds |
| Strikes | 2 (default 3) | 20 | holds |
| Strikes | 4 (default 3) | 20 | holds |

#### close-wall: The Leader’s Wall

Claim: Stopping at the edge wins more than rushing or stopping back. Score 35, needs 20: **holds**. Variants seen: 20.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 65% | 35% | 0% | 23% | 13% | 0.6 | 9.6 s |
| build | 28% | 0% | 0% | 53% | 0% | 1.88 | 15.9 s |
| crPlant | 100% | 0% | 0% | 0% | 0% | 0 | 14.3 s |
| *maxout* | 20% | 80% | 0% | 58% | 18% | 1.25 | 11.1 s |

Max-out check: building height and speed while running, never looking, wins 20%; the best posture above (crPlant) wins 100%. The lesson beats max-out by 80 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 35 | holds |
| Fall odds | 150 (default 100) | 35 | holds |
| Follower share | 20 (default 40) | 35 | holds |
| Follower share | 70 (default 40) | 35 | holds |
| Narrowing distance | 12 (default 25) | 35 | holds |
| Narrowing distance | 50 (default 25) | 35 | holds |
| Sight per point | 70 (default 100) | 35 | holds |
| Sight per point | 130 (default 100) | 35 | holds |
| Build rate | 10 (default 14) | 35 | holds |
| Build rate | 18 (default 14) | 35 | holds |
| Strikes | 2 (default 3) | 35 | holds |
| Strikes | 4 (default 3) | 35 | holds |

#### close-spend: Spend It Once

Claim: Rushing the cheap box and spending the lead on the dear one wins more than rushing both or taking care at both. Score 33, needs 15: **holds**. Variants seen: 39.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 3% | 98% | 0% | 48% | 5% | 0.5 | 20.6 s |
| crLook | 15% | 0% | 0% | 0% | 0% | 0 | 31 s |
| crSave | 48% | 43% | 0% | 28% | 5% | 0.5 | 31.5 s |
| *maxout* | 0% | 100% | 0% | 48% | 8% | 0.6 | - |

Max-out check: building height and speed while running, never looking, wins 0%; the best posture above (crSave) wins 48%. The lesson beats max-out by 48 points.

Rule grid: the claim holds in **12 of 13** rule sets; breaks at strikes 2.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 33 | holds |
| Fall odds | 150 (default 100) | 33 | holds |
| Follower share | 20 (default 40) | 38 | holds |
| Follower share | 70 (default 40) | 25 | holds |
| Narrowing distance | 12 (default 25) | 33 | holds |
| Narrowing distance | 50 (default 25) | 33 | holds |
| Sight per point | 70 (default 100) | 27 | holds |
| Sight per point | 130 (default 100) | 38 | holds |
| Build rate | 10 (default 14) | 15 | holds |
| Build rate | 18 (default 14) | 48 | holds |
| Strikes | 2 (default 3) | -5 | **breaks** |
| Strikes | 4 (default 3) | 33 | holds |


### see-early

#### see-early-brake: Too Late to Brake

Claim: Seeing early wins more than rushing, late care, or slowing down blind. Score 33, needs 15: **holds**. Variants seen: 10.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seeearly | 98% | 0% | 0% | 3% | 0% | 0.68 | 21.2 s |
| rush | 65% | 35% | 0% | 3% | 0% | 0.65 | 17.6 s |
| build | 65% | 35% | 0% | 3% | 0% | 0.65 | 17.6 s |
| seecreep | 0% | 0% | 0% | 3% | 0% | 0.35 | - |
| *maxout* | 100% | 0% | 0% | 0% | 0% | 0 | 16.3 s |

Max-out check: building height and speed while running, never looking, wins 100%; the best posture above (seeearly) wins 98%. **Max-out does as well or better: the map does not need its lesson.**

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 35 | holds |
| Fall odds | 150 (default 100) | 30 | holds |
| Follower share | 20 (default 40) | 33 | holds |
| Follower share | 70 (default 40) | 33 | holds |
| Narrowing distance | 12 (default 25) | 33 | holds |
| Narrowing distance | 50 (default 25) | 33 | holds |
| Sight per point | 70 (default 100) | 33 | holds |
| Sight per point | 130 (default 100) | 25 | holds |
| Build rate | 10 (default 14) | 33 | holds |
| Build rate | 18 (default 14) | 33 | holds |
| Strikes | 2 (default 3) | 33 | holds |
| Strikes | 4 (default 3) | 33 | holds |

#### see-early-bravo: The Box Behind the Box

Claim: Looking past the first box wins more than rushing, careful box-by-box play, or bracing for the worst at every box. Score 35, needs 15: **holds**. Variants seen: 10.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seeearly | 100% | 0% | 0% | 0% | 0% | 1.05 | 25.6 s |
| rush | 65% | 35% | 0% | 0% | 35% | 1.05 | 22.2 s |
| build | 65% | 35% | 0% | 0% | 35% | 1.05 | 22.8 s |
| seemax | 35% | 0% | 0% | 0% | 0% | 1.05 | 32.3 s |
| *maxout* | 75% | 25% | 0% | 0% | 25% | 0.75 | 18.5 s |

Max-out check: building height and speed while running, never looking, wins 75%; the best posture above (seeearly) wins 100%. The lesson beats max-out by 25 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 35 | holds |
| Fall odds | 150 (default 100) | 35 | holds |
| Follower share | 20 (default 40) | 35 | holds |
| Follower share | 70 (default 40) | 35 | holds |
| Narrowing distance | 12 (default 25) | 35 | holds |
| Narrowing distance | 50 (default 25) | 35 | holds |
| Sight per point | 70 (default 100) | 35 | holds |
| Sight per point | 130 (default 100) | 35 | holds |
| Build rate | 10 (default 14) | 35 | holds |
| Build rate | 18 (default 14) | 15 | holds |
| Strikes | 2 (default 3) | 35 | holds |
| Strikes | 4 (default 3) | 35 | holds |

#### see-early-pack: The Pack Dives Together

Claim: Breaking out of the pack and then looking wins more than staying in it, dropping back, rushing, looking from inside it, or breaking out without looking. Score 33, needs 15: **holds**. Variants seen: 10.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seebreak | 98% | 0% | 0% | 3% | 0% | 0.68 | 27.2 s |
| tail | 0% | 33% | 0% | 8% | 28% | 1 | - |
| build | 0% | 33% | 0% | 8% | 28% | 1 | - |
| rush | 0% | 33% | 0% | 8% | 28% | 1 | - |
| seeearly | 0% | 33% | 0% | 8% | 28% | 1 | - |
| seeblind | 65% | 35% | 0% | 8% | 28% | 0.97 | 23.4 s |
| *maxout* | 100% | 0% | 0% | 0% | 0% | 0 | 20.1 s |

Max-out check: building height and speed while running, never looking, wins 100%; the best posture above (seebreak) wins 98%. **Max-out does as well or better: the map does not need its lesson.**

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 35 | holds |
| Fall odds | 150 (default 100) | 30 | holds |
| Follower share | 20 (default 40) | 33 | holds |
| Follower share | 70 (default 40) | 33 | holds |
| Narrowing distance | 12 (default 25) | 33 | holds |
| Narrowing distance | 50 (default 25) | 33 | holds |
| Sight per point | 70 (default 100) | 33 | holds |
| Sight per point | 130 (default 100) | 33 | holds |
| Build rate | 10 (default 14) | 33 | holds |
| Build rate | 18 (default 14) | 33 | holds |
| Strikes | 2 (default 3) | 33 | holds |
| Strikes | 4 (default 3) | 33 | holds |


### small-risks

#### sr-landing: Still in the Air

Claim: Pacing wins and rushing dissolves. Score 95, needs 30: **holds**. Variants seen: 40.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| sr-fast | 0% | 0% | 90% | 0% | 3% | 0 | - |
| sr-pace | 95% | 0% | 0% | 0% | 0% | 0 | 20.3 s |
| rush | 45% | 0% | 20% | 0% | 3% | 0 | 18.3 s |
| build | 35% | 0% | 0% | 0% | 0% | 0 | 20.9 s |
| *maxout* | 3% | 5% | 85% | 0% | 0% | 0 | 23.3 s |

Max-out check: building height and speed while running, never looking, wins 3%; the best posture above (sr-pace) wins 95%. The lesson beats max-out by 92 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 95 | holds |
| Fall odds | 150 (default 100) | 95 | holds |
| Follower share | 20 (default 40) | 95 | holds |
| Follower share | 70 (default 40) | 95 | holds |
| Narrowing distance | 12 (default 25) | 95 | holds |
| Narrowing distance | 50 (default 25) | 95 | holds |
| Sight per point | 70 (default 100) | 95 | holds |
| Sight per point | 130 (default 100) | 95 | holds |
| Build rate | 10 (default 14) | 98 | holds |
| Build rate | 18 (default 14) | 93 | holds |
| Strikes | 2 (default 3) | 95 | holds |
| Strikes | 4 (default 3) | 83 | holds |

#### sr-odds: Six Unknown Boxes

Claim: Looking wins more than rushing, and rushing rarely survives all six. Score 45, needs 30: **holds**. Variants seen: 40.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| sr-fast | 20% | 78% | 0% | 13% | 63% | 1.38 | 29.5 s |
| sr-look | 65% | 3% | 0% | 10% | 3% | 1.55 | 45.4 s |
| sr-care | 65% | 3% | 0% | 10% | 3% | 1.55 | 45.6 s |
| *maxout* | 40% | 28% | 0% | 13% | 25% | 1.55 | 32.7 s |

Max-out check: building height and speed while running, never looking, wins 40%; the best posture above (sr-look) wins 65%. The lesson beats max-out by 25 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 48 | holds |
| Fall odds | 150 (default 100) | 38 | holds |
| Follower share | 20 (default 40) | 45 | holds |
| Follower share | 70 (default 40) | 45 | holds |
| Narrowing distance | 12 (default 25) | 45 | holds |
| Narrowing distance | 50 (default 25) | 45 | holds |
| Sight per point | 70 (default 100) | 45 | holds |
| Sight per point | 130 (default 100) | 45 | holds |
| Build rate | 10 (default 14) | 48 | holds |
| Build rate | 18 (default 14) | 38 | holds |
| Strikes | 2 (default 3) | 45 | holds |
| Strikes | 4 (default 3) | 45 | holds |

#### sr-lastbox: The Last Box

Claim: Spending one near miss at the last box wins; caution everywhere loses to Careful; rushing everywhere is ruin. Score 57, needs 30: **holds**. Variants seen: 40.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| sr-fast | 0% | 83% | 18% | 0% | 0% | 1 | - |
| sr-care | 43% | 0% | 0% | 0% | 0% | 0.2 | 32.8 s |
| sr-early | 10% | 90% | 0% | 0% | 0% | 0.2 | 28.7 s |
| sr-last | 100% | 0% | 0% | 0% | 0% | 0.2 | 31 s |
| *maxout* | 100% | 0% | 0% | 0% | 0% | 0.72 | 28.6 s |

Max-out check: building height and speed while running, never looking, wins 100%; the best posture above (sr-last) wins 100%. **Max-out does as well or better: the map does not need its lesson.**

Rule grid: the claim holds in **10 of 13** rule sets; breaks at sight 70, sight 130, strikes 2.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 57 | holds |
| Fall odds | 150 (default 100) | 57 | holds |
| Follower share | 20 (default 40) | 57 | holds |
| Follower share | 70 (default 40) | 57 | holds |
| Narrowing distance | 12 (default 25) | 57 | holds |
| Narrowing distance | 50 (default 25) | 62 | holds |
| Sight per point | 70 (default 100) | 27 | **breaks** |
| Sight per point | 130 (default 100) | 20 | **breaks** |
| Build rate | 10 (default 14) | 73 | holds |
| Build rate | 18 (default 14) | 50 | holds |
| Strikes | 2 (default 3) | 25 | **breaks** |
| Strikes | 4 (default 3) | 100 | holds |


### steward-pack

#### steward-minefield: The Minefield

Claim: The steward wins more often than the lab that stops and falls behind, and more often than the lab that tails blind. Score 40, needs 20: **holds**. Variants seen: 8.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| steward-pack-steward | 55% | 0% | 13% | 10% | 0% | 1.98 | 39.3 s |
| steward-pack-tail | 10% | 55% | 0% | 15% | 0% | 1.9 | 30.4 s |
| steward-pack-stop | 15% | 0% | 0% | 10% | 0% | 1.9 | 48.4 s |
| rush | 0% | 83% | 0% | 15% | 0% | 1.9 | - |
| *maxout* | 0% | 83% | 0% | 15% | 0% | 1.9 | - |

Max-out check: building height and speed while running, never looking, wins 0%; the best posture above (steward-pack-steward) wins 55%. The lesson beats max-out by 55 points.

Rule grid: the claim holds in **8 of 13** rule sets; breaks at share 20, narrow 50, sight 130, build 10, strikes 2.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 37 | holds |
| Fall odds | 150 (default 100) | 38 | holds |
| Follower share | 20 (default 40) | -10 | **breaks** |
| Follower share | 70 (default 40) | 50 | holds |
| Narrowing distance | 12 (default 25) | 43 | holds |
| Narrowing distance | 50 (default 25) | 0 | **breaks** |
| Sight per point | 70 (default 100) | 28 | holds |
| Sight per point | 130 (default 100) | 5 | **breaks** |
| Build rate | 10 (default 14) | -8 | **breaks** |
| Build rate | 18 (default 14) | 22 | holds |
| Strikes | 2 (default 3) | -25 | **breaks** |
| Strikes | 4 (default 3) | 53 | holds |

