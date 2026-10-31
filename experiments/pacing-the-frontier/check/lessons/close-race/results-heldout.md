# Lesson maps: bot check

[[ai gen]] Bot play only, seeds 1001 to 1040. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## close-footsteps: Footsteps

Claim: Checking the mirror wins most: it looks when Racer is far and rushes when it is close. Score 17, needs 10: **holds**. Variants seen: 26.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 58% | 43% | 0% | 15% | 5% | 0.07 | 11.7 s |
| crLook | 68% | 0% | 0% | 8% | 0% | 0.15 | 19.8 s |
| crMirror | 85% | 15% | 0% | 10% | 5% | 0.07 | 17.2 s |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 15 | holds |
| Fall odds | 150 (default 100) | 17 | holds |
| Follower share | 20 (default 40) | 17 | holds |
| Follower share | 70 (default 40) | 17 | holds |
| Narrowing distance | 12 (default 25) | 17 | holds |
| Narrowing distance | 50 (default 25) | 17 | holds |
| Sight per point | 70 (default 100) | 12 | holds |
| Sight per point | 130 (default 100) | 17 | holds |
| Build rate | 10 (default 14) | 17 | holds |
| Build rate | 18 (default 14) | 17 | holds |
| Strikes | 2 (default 3) | 17 | holds |
| Strikes | 4 (default 3) | 17 | holds |

## close-wall: The Leader’s Wall

Claim: Stopping at the edge wins more than rushing or stopping back. Score 40, needs 20: **holds**. Variants seen: 26.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 60% | 40% | 0% | 33% | 8% | 0.47 | 9.6 s |
| build | 15% | 0% | 0% | 55% | 0% | 1.38 | 16.6 s |
| crPlant | 100% | 0% | 0% | 0% | 0% | 0 | 14.3 s |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 40 | holds |
| Fall odds | 150 (default 100) | 40 | holds |
| Follower share | 20 (default 40) | 40 | holds |
| Follower share | 70 (default 40) | 40 | holds |
| Narrowing distance | 12 (default 25) | 40 | holds |
| Narrowing distance | 50 (default 25) | 40 | holds |
| Sight per point | 70 (default 100) | 40 | holds |
| Sight per point | 130 (default 100) | 40 | holds |
| Build rate | 10 (default 14) | 40 | holds |
| Build rate | 18 (default 14) | 40 | holds |
| Strikes | 2 (default 3) | 40 | holds |
| Strikes | 4 (default 3) | 40 | holds |

## close-spend: Spend It Once

Claim: Rushing the cheap box and spending the lead on the dear one wins more than rushing both or taking care at both. Score 38, needs 15: **holds**. Variants seen: 39.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 5% | 95% | 0% | 38% | 5% | 0.42 | 20.6 s |
| crLook | 20% | 0% | 0% | 0% | 0% | 0 | 31 s |
| crSave | 58% | 35% | 0% | 20% | 5% | 0.42 | 31.5 s |

Rule grid: the claim holds in **12 of 13** rule sets; breaks at strikes 2.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 38 | holds |
| Fall odds | 150 (default 100) | 38 | holds |
| Follower share | 20 (default 40) | 40 | holds |
| Follower share | 70 (default 40) | 30 | holds |
| Narrowing distance | 12 (default 25) | 38 | holds |
| Narrowing distance | 50 (default 25) | 38 | holds |
| Sight per point | 70 (default 100) | 28 | holds |
| Sight per point | 130 (default 100) | 35 | holds |
| Build rate | 10 (default 14) | 17 | holds |
| Build rate | 18 (default 14) | 50 | holds |
| Strikes | 2 (default 3) | -5 | **breaks** |
| Strikes | 4 (default 3) | 38 | holds |

