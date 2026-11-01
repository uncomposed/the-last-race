# Lesson maps: bot check

[[ai gen]] Bot play only, seeds 1 to 40. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## close-footsteps: Footsteps

Claim: Checking the mirror wins at least 15 points more than the best of rushing, looking, waiting and max-out. Score 27, needs 15: **holds**. Variants seen: 29.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| crMirror | 70% | 30% | 0% | 13% | 0% | 0 | 11.7 s |
| rush | 43% | 58% | 0% | 33% | 0% | 0 | 9.8 s |
| crLook | 38% | 0% | 0% | 0% | 0% | 0 | 15.5 s |
| adv-hs-wait | 30% | 0% | 0% | 0% | 0% | 0 | 15.3 s |
| maxout | 8% | 93% | 0% | 45% | 0% | 0 | 11.2 s |

Max-out check: building height and speed while running, never looking, wins 8%; the best posture above (crMirror) wins 70%. The lesson beats max-out by 62 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 27 | holds |
| Fall odds | 150 (default 100) | 27 | holds |
| Follower share | 20 (default 40) | 27 | holds |
| Follower share | 70 (default 40) | 27 | holds |
| Narrowing distance | 12 (default 25) | 27 | holds |
| Narrowing distance | 50 (default 25) | 27 | holds |
| Sight per point | 70 (default 100) | 17 | holds |
| Sight per point | 130 (default 100) | 30 | holds |
| Build rate | 10 (default 14) | 32 | holds |
| Build rate | 18 (default 14) | 17 | holds |
| Strikes | 2 (default 3) | 27 | holds |
| Strikes | 4 (default 3) | 27 | holds |


## close-wall: The Leader’s Wall

Claim: Pulling up at the edge wins at least 15 points more than the best of stopping back, waiting, rushing and max-out. Score 90, needs 15: **holds**. Variants seen: 18.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| crPlant | 100% | 0% | 0% | 0% | 0% | 0 | 15 s |
| build | 10% | 0% | 0% | 90% | 0% | 1.82 | 17.3 s |
| adv-hs-wait | 10% | 0% | 0% | 90% | 0% | 1.82 | 15.2 s |
| rush | 5% | 35% | 0% | 95% | 0% | 1.52 | 11.6 s |
| maxout | 3% | 8% | 0% | 95% | 3% | 1.82 | 12.8 s |

Max-out check: building height and speed while running, never looking, wins 3%; the best posture above (crPlant) wins 100%. The lesson beats max-out by 97 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 42 | holds |
| Fall odds | 150 (default 100) | 92 | holds |
| Follower share | 20 (default 40) | 90 | holds |
| Follower share | 70 (default 40) | 90 | holds |
| Narrowing distance | 12 (default 25) | 90 | holds |
| Narrowing distance | 50 (default 25) | 90 | holds |
| Sight per point | 70 (default 100) | 90 | holds |
| Sight per point | 130 (default 100) | 90 | holds |
| Build rate | 10 (default 14) | 90 | holds |
| Build rate | 18 (default 14) | 90 | holds |
| Strikes | 2 (default 3) | 90 | holds |
| Strikes | 4 (default 3) | 90 | holds |


## close-spend: Spend It Once

Claim: Racing the cheap box and stopping once at the dear one wins at least 15 points more than waiting, building at both, rushing both or max-out. Score 100, needs 15: **holds**. Variants seen: 37.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| crSpend | 100% | 0% | 0% | 0% | 0% | 0 | 23.9 s |
| adv-hs-wait | 0% | 0% | 0% | 0% | 0% | 0 | - |
| build | 0% | 0% | 0% | 0% | 0% | 0 | - |
| rush | 0% | 100% | 0% | 38% | 0% | 0 | - |
| maxout | 0% | 100% | 0% | 38% | 0% | 0 | - |

Max-out check: building height and speed while running, never looking, wins 0%; the best posture above (crSpend) wins 100%. The lesson beats max-out by 100 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 100 | holds |
| Fall odds | 150 (default 100) | 100 | holds |
| Follower share | 20 (default 40) | 100 | holds |
| Follower share | 70 (default 40) | 100 | holds |
| Narrowing distance | 12 (default 25) | 100 | holds |
| Narrowing distance | 50 (default 25) | 100 | holds |
| Sight per point | 70 (default 100) | 100 | holds |
| Sight per point | 130 (default 100) | 100 | holds |
| Build rate | 10 (default 14) | 100 | holds |
| Build rate | 18 (default 14) | 100 | holds |
| Strikes | 2 (default 3) | 100 | holds |
| Strikes | 4 (default 3) | 100 | holds |

