# Lesson maps: bot check

[[ai gen]] Bot play only, seeds 1001 to 1040. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## close-footsteps: Footsteps

Claim: Checking the mirror wins at least 15 points more than the best of rushing, looking, waiting and max-out. Score 20, needs 15: **holds**. Variants seen: 24.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| crMirror | 80% | 20% | 0% | 8% | 0% | 0 | 12.9 s |
| rush | 43% | 58% | 0% | 13% | 0% | 0 | 9.8 s |
| crLook | 60% | 0% | 0% | 0% | 0% | 0 | 15.4 s |
| adv-hs-wait | 45% | 0% | 0% | 0% | 0% | 0 | 15.2 s |
| maxout | 10% | 90% | 0% | 35% | 0% | 0 | 11.2 s |

Max-out check: building height and speed while running, never looking, wins 10%; the best posture above (crMirror) wins 80%. The lesson beats max-out by 70 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 20 | holds |
| Fall odds | 150 (default 100) | 20 | holds |
| Follower share | 20 (default 40) | 20 | holds |
| Follower share | 70 (default 40) | 20 | holds |
| Narrowing distance | 12 (default 25) | 20 | holds |
| Narrowing distance | 50 (default 25) | 20 | holds |
| Sight per point | 70 (default 100) | 20 | holds |
| Sight per point | 130 (default 100) | 20 | holds |
| Build rate | 10 (default 14) | 20 | holds |
| Build rate | 18 (default 14) | 20 | holds |
| Strikes | 2 (default 3) | 20 | holds |
| Strikes | 4 (default 3) | 20 | holds |


## close-wall: The Leader’s Wall

Claim: Pulling up at the edge wins at least 15 points more than the best of stopping back, waiting, rushing and max-out. Score 85, needs 15: **holds**. Variants seen: 18.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| crPlant | 100% | 0% | 0% | 0% | 0% | 0 | 15 s |
| build | 15% | 0% | 0% | 85% | 0% | 1.88 | 17.3 s |
| adv-hs-wait | 15% | 0% | 0% | 85% | 0% | 1.88 | 15.2 s |
| rush | 8% | 55% | 0% | 85% | 8% | 1.4 | 11.6 s |
| maxout | 3% | 13% | 0% | 85% | 13% | 1.88 | 12.8 s |

Max-out check: building height and speed while running, never looking, wins 3%; the best posture above (crPlant) wins 100%. The lesson beats max-out by 97 points.

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 65 | holds |
| Fall odds | 150 (default 100) | 100 | holds |
| Follower share | 20 (default 40) | 85 | holds |
| Follower share | 70 (default 40) | 85 | holds |
| Narrowing distance | 12 (default 25) | 85 | holds |
| Narrowing distance | 50 (default 25) | 85 | holds |
| Sight per point | 70 (default 100) | 85 | holds |
| Sight per point | 130 (default 100) | 85 | holds |
| Build rate | 10 (default 14) | 85 | holds |
| Build rate | 18 (default 14) | 85 | holds |
| Strikes | 2 (default 3) | 85 | holds |
| Strikes | 4 (default 3) | 85 | holds |


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

