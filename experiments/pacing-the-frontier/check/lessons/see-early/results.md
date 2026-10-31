# Lesson maps: bot check

[[ai gen]] Bot play only, seeds 1 to 40. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.

## see-early-brake: Too Late to Brake

Claim: Seeing early wins more than rushing, late care, or slowing down blind. Score 57, needs 15: **holds**. Variants seen: 11.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seeearly | 95% | 0% | 0% | 5% | 0% | 1.25 | 24.4 s |
| rush | 38% | 63% | 0% | 5% | 0% | 0.63 | 17.6 s |
| build | 38% | 63% | 0% | 10% | 0% | 1.2 | 18.2 s |
| seecreep | 0% | 0% | 0% | 0% | 0% | 0.63 | - |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 60 | holds |
| Fall odds | 150 (default 100) | 55 | holds |
| Follower share | 20 (default 40) | 57 | holds |
| Follower share | 70 (default 40) | 57 | holds |
| Narrowing distance | 12 (default 25) | 57 | holds |
| Narrowing distance | 50 (default 25) | 57 | holds |
| Sight per point | 70 (default 100) | 57 | holds |
| Sight per point | 130 (default 100) | 60 | holds |
| Build rate | 10 (default 14) | 57 | holds |
| Build rate | 18 (default 14) | 57 | holds |
| Strikes | 2 (default 3) | 57 | holds |
| Strikes | 4 (default 3) | 57 | holds |

## see-early-bravo: The Box Behind the Box

Claim: Looking past the first box wins more than rushing, careful box-by-box play, or bracing for the worst at every box. Score 38, needs 15: **holds**. Variants seen: 11.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seeearly | 98% | 0% | 0% | 3% | 0% | 1.82 | 28.1 s |
| rush | 38% | 63% | 0% | 5% | 58% | 1.8 | 22.2 s |
| build | 38% | 63% | 0% | 5% | 58% | 1.8 | 23.3 s |
| seemax | 60% | 0% | 0% | 3% | 0% | 1.82 | 32.4 s |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 38 | holds |
| Fall odds | 150 (default 100) | 38 | holds |
| Follower share | 20 (default 40) | 40 | holds |
| Follower share | 70 (default 40) | 38 | holds |
| Narrowing distance | 12 (default 25) | 38 | holds |
| Narrowing distance | 50 (default 25) | 38 | holds |
| Sight per point | 70 (default 100) | 38 | holds |
| Sight per point | 130 (default 100) | 60 | holds |
| Build rate | 10 (default 14) | 38 | holds |
| Build rate | 18 (default 14) | 38 | holds |
| Strikes | 2 (default 3) | 38 | holds |
| Strikes | 4 (default 3) | 38 | holds |

## see-early-pack: The Pack Dives Together

Claim: Breaking out of the pack and then looking wins more than staying in it, dropping back, rushing, looking from inside it, or breaking out without looking. Score 57, needs 15: **holds**. Variants seen: 11.

| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |
|---|---|---|---|---|---|---|---|
| seebreak | 95% | 0% | 0% | 5% | 0% | 1.25 | 30.6 s |
| tail | 0% | 63% | 0% | 5% | 0% | 0.63 | - |
| build | 0% | 0% | 0% | 0% | 0% | 0.63 | - |
| rush | 0% | 63% | 0% | 15% | 48% | 1.73 | - |
| seeearly | 0% | 63% | 0% | 15% | 48% | 1.73 | - |
| seeblind | 38% | 63% | 0% | 15% | 48% | 2.1 | 24 s |

Rule grid: the claim holds in **13 of 13** rule sets.

| Rule | Value | Score | Claim |
|---|---|---|---|
| Fall odds | 50 (default 100) | 60 | holds |
| Fall odds | 150 (default 100) | 58 | holds |
| Follower share | 20 (default 40) | 57 | holds |
| Follower share | 70 (default 40) | 57 | holds |
| Narrowing distance | 12 (default 25) | 57 | holds |
| Narrowing distance | 50 (default 25) | 57 | holds |
| Sight per point | 70 (default 100) | 57 | holds |
| Sight per point | 130 (default 100) | 57 | holds |
| Build rate | 10 (default 14) | 57 | holds |
| Build rate | 18 (default 14) | 57 | holds |
| Strikes | 2 (default 3) | 57 | holds |
| Strikes | 4 (default 3) | 57 | holds |

