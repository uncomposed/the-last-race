# Lesson maps: bot check

[[ai gen]] Bot play only, seeds 1001 to 1040. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## see-early-brake: Too Late to Brake

Claim: Seeing early wins more than rushing, late care, or slowing down blind. Score 35, needs 15: **holds**. Variants seen: 11.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seeearly | 95% | 0% | 0% | 5% | 0% | 0.8 | 21.6 s |
| rush | 60% | 40% | 0% | 5% | 0% | 0.4 | 17.6 s |
| build | 60% | 40% | 0% | 8% | 0% | 0.75 | 18.2 s |
| seecreep | 0% | 0% | 0% | 0% | 0% | 0.4 | - |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 40 | holds |
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

## see-early-bravo: The Box Behind the Box

Claim: Looking past the first box wins more than rushing, careful box-by-box play, or bracing for the worst at every box. Score 28, needs 15: **holds**. Variants seen: 11.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seeearly | 88% | 0% | 0% | 13% | 0% | 1.07 | 25.3 s |
| rush | 60% | 40% | 0% | 13% | 28% | 0.95 | 22.2 s |
| build | 60% | 40% | 0% | 13% | 28% | 0.95 | 23.3 s |
| seemax | 28% | 0% | 0% | 13% | 0% | 1.07 | 32.4 s |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 33 | holds |
| Fall odds | 150 (default 100) | 23 | holds |
| Follower share | 20 (default 40) | 28 | holds |
| Follower share | 70 (default 40) | 28 | holds |
| Narrowing distance | 12 (default 25) | 28 | holds |
| Narrowing distance | 50 (default 25) | 28 | holds |
| Sight per point | 70 (default 100) | 28 | holds |
| Sight per point | 130 (default 100) | 28 | holds |
| Build rate | 10 (default 14) | 28 | holds |
| Build rate | 18 (default 14) | 28 | holds |
| Strikes | 2 (default 3) | 28 | holds |
| Strikes | 4 (default 3) | 28 | holds |

## see-early-pack: The Pack Dives Together

Claim: Breaking out of the pack and then looking wins more than staying in it, dropping back, rushing, looking from inside it, or breaking out without looking. Score 35, needs 15: **holds**. Variants seen: 11.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seebreak | 95% | 0% | 0% | 5% | 0% | 0.8 | 27.7 s |
| tail | 0% | 40% | 0% | 5% | 0% | 0.4 | - |
| build | 0% | 0% | 0% | 0% | 0% | 0.4 | - |
| rush | 0% | 40% | 0% | 10% | 30% | 1.07 | - |
| seeearly | 0% | 40% | 0% | 10% | 30% | 1.07 | - |
| seeblind | 60% | 40% | 0% | 10% | 30% | 1.68 | 24 s |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 40 | holds |
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

