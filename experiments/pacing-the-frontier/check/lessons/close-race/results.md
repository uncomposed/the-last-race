# Lesson maps: bot check

[[ai gen]] Bot play only, seeds 1 to 40. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## close-footsteps: Footsteps

Claim: Checking the mirror wins most: it looks when Racer is far and rushes when it is close. Score 15, needs 10: **holds**. Variants seen: 28.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 65% | 35% | 0% | 30% | 3% | 0.15 | 11.7 s |
| crLook | 53% | 0% | 0% | 5% | 0% | 0.2 | 20.2 s |
| crMirror | 80% | 20% | 0% | 18% | 3% | 0.15 | 15.3 s |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 15 | holds |
| Fall odds | 150 (default 100) | 15 | holds |
| Follower share | 20 (default 40) | 15 | holds |
| Follower share | 70 (default 40) | 15 | holds |
| Narrowing distance | 12 (default 25) | 15 | holds |
| Narrowing distance | 50 (default 25) | 15 | holds |
| Sight per point | 70 (default 100) | 15 | holds |
| Sight per point | 130 (default 100) | 15 | holds |
| Build rate | 10 (default 14) | 20 | holds |
| Build rate | 18 (default 14) | 15 | holds |
| Strikes | 2 (default 3) | 15 | holds |
| Strikes | 4 (default 3) | 15 | holds |

## close-wall: The Leader’s Wall

Claim: Stopping at the edge wins more than rushing or stopping back. Score 62, needs 20: **holds**. Variants seen: 24.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 38% | 63% | 0% | 40% | 23% | 0.97 | 9.6 s |
| build | 33% | 0% | 0% | 53% | 0% | 1.85 | 16.9 s |
| crPlant | 100% | 0% | 0% | 0% | 0% | 0 | 14.4 s |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 50 | holds |
| Fall odds | 150 (default 100) | 62 | holds |
| Follower share | 20 (default 40) | 62 | holds |
| Follower share | 70 (default 40) | 62 | holds |
| Narrowing distance | 12 (default 25) | 62 | holds |
| Narrowing distance | 50 (default 25) | 62 | holds |
| Sight per point | 70 (default 100) | 62 | holds |
| Sight per point | 130 (default 100) | 62 | holds |
| Build rate | 10 (default 14) | 62 | holds |
| Build rate | 18 (default 14) | 62 | holds |
| Strikes | 2 (default 3) | 62 | holds |
| Strikes | 4 (default 3) | 62 | holds |

## close-spend: Spend It Once

Claim: Rushing the cheap box and spending the lead on the dear one wins more than rushing both or taking care at both. Score 52, needs 15: **holds**. Variants seen: 39.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| rush | 13% | 88% | 0% | 35% | 8% | 0.35 | 20.6 s |
| crLook | 23% | 0% | 0% | 0% | 0% | 0 | 30.9 s |
| crSave | 75% | 25% | 0% | 13% | 8% | 0.35 | 31.3 s |

Rule grid: the claim holds in **12 of 13** rule sets; breaks at strikes 2.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 52 | holds |
| Fall odds | 150 (default 100) | 52 | holds |
| Follower share | 20 (default 40) | 52 | holds |
| Follower share | 70 (default 40) | 45 | holds |
| Narrowing distance | 12 (default 25) | 52 | holds |
| Narrowing distance | 50 (default 25) | 52 | holds |
| Sight per point | 70 (default 100) | 40 | holds |
| Sight per point | 130 (default 100) | 30 | holds |
| Build rate | 10 (default 14) | 28 | holds |
| Build rate | 18 (default 14) | 37 | holds |
| Strikes | 2 (default 3) | 0 | **breaks** |
| Strikes | 4 (default 3) | 52 | holds |

