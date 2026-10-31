# Lesson maps: audit on fresh seeds

[[ai gen]] Written by Claude, 2026-10-31. Four Opus agents each built one lesson (their own write-ups are in each folder's `NOTES.md`). They tuned on seeds 1 to 40 and reported seeds 1001 to 1040. This audit reran every claim on seeds 2001 to 2040, which no agent saw, with the full rule grid:

```
node check.mjs --only <lesson> --start 2001 --grid
```

Status: `verified` by bots only. Nothing here is `human_validated` until Cole plays it.

## Summary

| # | Map | Lesson | Score (need) | Rule grid | Notes |
|---|---|---|---|---|---|
| 1 | close-footsteps | A close race leaves no slack | 20 (10) | 13 of 13 | |
| 2 | close-wall | A close race leaves no slack | 35 (20) | 13 of 13 | Cole's leader-wall idea. The build posture's extinction rate is high (about half of runs) |
| 3 | close-spend | A close race leaves no slack | 33 (15) | 12 of 13; breaks at strikes 2 | Big lead, and the map says which box is cheap, so the choice is partly told |
| 4 | see-early-brake | See before you need to | 33 (15) | 13 of 13 | Only 10 variants |
| 5 | see-early-bravo | See before you need to | 35 (15) | 13 of 13 | Only 10 variants |
| 6 | see-early-pack | See before you need to | 35 (15) | 13 of 13 | Only 10 variants |
| 7 | sr-landing | Small risks add up to ruin | 93 (30) | 13 of 13 | Cole's rhythm-trap idea: small boxes right after barriers |
| 8 | sr-odds | Small risks add up to ruin | 45 (30) | 13 of 13 | 11 of 13 on the agent's own held-out block, so treat as less robust than it looks here |
| 9 | sr-lastbox | Small risks add up to ruin | 57 (30) | 10 of 13; breaks at sight 70, sight 130, strikes 2 | Leans on sight and strikes |
| 10 | steward-minefield | The Steward in the pack | 30 (20) | 7 of 13; breaks at narrow 50, sight 70 and 130, build 10 and 18, strikes 2 | Weak. Only 8 variants, and the rival start was tuned on seeds 1 to 40. Four other steward ideas failed (see its NOTES) |

## What this doesn't show

- Bots aren't people. A claim that holds for bots says the map can teach the lesson, not that a player will feel it.
- The score is a bot win-rate gap. A high score on one map and a low one on another doesn't rank them as lessons.
- The six rule knobs are moved one at a time. Two moved together could break a map that survives each alone.

## Raw output

### close-race


[[ai gen]] Bot play only, seeds 2001 to 2040. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## close-footsteps: Footsteps

Claim: Checking the mirror wins most: it looks when Racer is far and rushes when it is close. Score 20, needs 10: **holds**. Variants seen: 27.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 70% | 30% | 0% | 10% | 5% | 0.05 | 11.7 s |
| crLook | 70% | 0% | 0% | 5% | 0% | 0.1 | 19.6 s |
| crMirror | 90% | 10% | 0% | 5% | 5% | 0.05 | 17.3 s |

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

## close-wall: The Leader’s Wall

Claim: Stopping at the edge wins more than rushing or stopping back. Score 35, needs 20: **holds**. Variants seen: 20.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 65% | 35% | 0% | 23% | 13% | 0.6 | 9.6 s |
| build | 28% | 0% | 0% | 53% | 0% | 1.88 | 15.9 s |
| crPlant | 100% | 0% | 0% | 0% | 0% | 0 | 14.3 s |

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

## close-spend: Spend It Once

Claim: Rushing the cheap box and spending the lead on the dear one wins more than rushing both or taking care at both. Score 33, needs 15: **holds**. Variants seen: 39.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 3% | 98% | 0% | 45% | 5% | 0.47 | 20.6 s |
| crLook | 15% | 0% | 0% | 0% | 0% | 0 | 31 s |
| crSave | 48% | 43% | 0% | 25% | 5% | 0.47 | 31.5 s |

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


[[ai gen]] Bot play only, seeds 2001 to 2040. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## see-early-brake: Too Late to Brake

Claim: Seeing early wins more than rushing, late care, or slowing down blind. Score 33, needs 15: **holds**. Variants seen: 10.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seeearly | 98% | 0% | 0% | 3% | 0% | 0.68 | 21.2 s |
| rush | 65% | 35% | 0% | 3% | 0% | 0.33 | 17.6 s |
| build | 65% | 35% | 0% | 3% | 0% | 0.65 | 18.2 s |
| seecreep | 0% | 0% | 0% | 3% | 0% | 0.35 | - |

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

## see-early-bravo: The Box Behind the Box

Claim: Looking past the first box wins more than rushing, careful box-by-box play, or bracing for the worst at every box. Score 35, needs 15: **holds**. Variants seen: 10.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seeearly | 100% | 0% | 0% | 0% | 0% | 1.05 | 25.6 s |
| rush | 65% | 35% | 0% | 0% | 35% | 1.05 | 22.2 s |
| build | 65% | 35% | 0% | 0% | 35% | 1.05 | 23.3 s |
| seemax | 35% | 0% | 0% | 0% | 0% | 1.05 | 32.3 s |

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

## see-early-pack: The Pack Dives Together

Claim: Breaking out of the pack and then looking wins more than staying in it, dropping back, rushing, looking from inside it, or breaking out without looking. Score 35, needs 15: **holds**. Variants seen: 10.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seebreak | 98% | 0% | 0% | 3% | 0% | 0.68 | 27.3 s |
| tail | 0% | 33% | 0% | 3% | 0% | 0.35 | - |
| build | 0% | 0% | 0% | 3% | 0% | 0.35 | - |
| rush | 0% | 35% | 0% | 8% | 28% | 0.97 | - |
| seeearly | 0% | 35% | 0% | 8% | 28% | 0.97 | - |
| seeblind | 63% | 33% | 0% | 10% | 28% | 1.65 | 24 s |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 37 | holds |
| Fall odds | 150 (default 100) | 32 | holds |
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


### small-risks


[[ai gen]] Bot play only, seeds 2001 to 2040. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## sr-landing: Still in the Air

Claim: Pacing wins and rushing dissolves. Score 93, needs 30: **holds**. Variants seen: 40.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| sr-fast | 0% | 0% | 90% | 0% | 3% | 0 | - |
| sr-pace | 93% | 0% | 0% | 0% | 0% | 0 | 20.4 s |
| rush | 23% | 0% | 33% | 0% | 0% | 0 | 20.5 s |
| build | 0% | 0% | 0% | 0% | 0% | 0 | - |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 93 | holds |
| Fall odds | 150 (default 100) | 93 | holds |
| Follower share | 20 (default 40) | 93 | holds |
| Follower share | 70 (default 40) | 93 | holds |
| Narrowing distance | 12 (default 25) | 95 | holds |
| Narrowing distance | 50 (default 25) | 95 | holds |
| Sight per point | 70 (default 100) | 95 | holds |
| Sight per point | 130 (default 100) | 98 | holds |
| Build rate | 10 (default 14) | 98 | holds |
| Build rate | 18 (default 14) | 93 | holds |
| Strikes | 2 (default 3) | 95 | holds |
| Strikes | 4 (default 3) | 90 | holds |

## sr-odds: Six Unknown Boxes

Claim: Looking wins more than rushing, and rushing rarely survives all six. Score 45, needs 30: **holds**. Variants seen: 40.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| sr-fast | 20% | 78% | 0% | 13% | 63% | 1.38 | 29.5 s |
| sr-look | 65% | 3% | 0% | 10% | 3% | 1.55 | 45.3 s |
| sr-care | 65% | 3% | 0% | 10% | 3% | 1.55 | 45.6 s |

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

## sr-lastbox: The Last Box

Claim: Spending one near miss at the last box wins; caution everywhere loses to Careful; rushing everywhere is ruin. Score 57, needs 30: **holds**. Variants seen: 40.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| sr-fast | 0% | 83% | 18% | 0% | 0% | 1 | - |
| sr-care | 43% | 0% | 0% | 0% | 0% | 0.2 | 32.8 s |
| sr-early | 10% | 90% | 0% | 0% | 0% | 0.2 | 28.7 s |
| sr-last | 100% | 0% | 0% | 0% | 0% | 0.2 | 31 s |

Rule grid: the claim holds in **10 of 13** rule sets; breaks at sight 70, sight 130, strikes 2.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 57 | holds |
| Fall odds | 150 (default 100) | 57 | holds |
| Follower share | 20 (default 40) | 57 | holds |
| Follower share | 70 (default 40) | 57 | holds |
| Narrowing distance | 12 (default 25) | 55 | holds |
| Narrowing distance | 50 (default 25) | 57 | holds |
| Sight per point | 70 (default 100) | 25 | **breaks** |
| Sight per point | 130 (default 100) | 23 | **breaks** |
| Build rate | 10 (default 14) | 73 | holds |
| Build rate | 18 (default 14) | 45 | holds |
| Strikes | 2 (default 3) | 25 | **breaks** |
| Strikes | 4 (default 3) | 100 | holds |


### steward-pack


[[ai gen]] Bot play only, seeds 2001 to 2040. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## steward-minefield: The Minefield

Claim: The steward wins more often than the lab that stops and falls behind, and more often than the lab that tails blind. Score 30, needs 20: **holds**. Variants seen: 8.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| steward-pack-steward | 55% | 5% | 0% | 13% | 0% | 1.98 | 44.4 s |
| steward-pack-tail | 0% | 65% | 0% | 15% | 0% | 1.9 | - |
| steward-pack-stop | 25% | 10% | 0% | 15% | 0% | 2.02 | 40.8 s |
| rush | 18% | 65% | 0% | 15% | 0% | 1.9 | 26.8 s |

Rule grid: the claim holds in **7 of 13** rule sets; breaks at narrow 50, sight 70, sight 130, build 10, build 18, strikes 2.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 25 | holds |
| Fall odds | 150 (default 100) | 28 | holds |
| Follower share | 20 (default 40) | 27 | holds |
| Follower share | 70 (default 40) | 20 | holds |
| Narrowing distance | 12 (default 25) | 28 | holds |
| Narrowing distance | 50 (default 25) | 0 | **breaks** |
| Sight per point | 70 (default 100) | -25 | **breaks** |
| Sight per point | 130 (default 100) | 8 | **breaks** |
| Build rate | 10 (default 14) | 7 | **breaks** |
| Build rate | 18 (default 14) | -7 | **breaks** |
| Strikes | 2 (default 3) | -10 | **breaks** |
| Strikes | 4 (default 3) | 30 | holds |

