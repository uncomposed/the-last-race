# The judge

[[ai gen]] Bot play only, judge seeds 9001 to 9040. A map passes when its lesson strategy beats the best of 21 adversaries by 15 points at the default rules and beats the best adversary in at least 10 of 13 rule sets. Status: verified (this script reproduces it), nothing human_validated.

| Map | Lesson strategy wins | Best adversary | Margin | Rule sets held | Verdict |
|---|---|---|---|---|---|
| Footsteps (`close-footsteps`) | 90% | adv-h-wait 70% | +20 | 13 of 13 | **pass** |
| The Leader’s Wall (`close-wall`) | 100% | adv-hs-wait 10% | +90 | 13 of 13 | **pass** |
| Spend It Once (`close-spend`) | 100% | maxout 0% | +100 | 13 of 13 | **pass** |
| Too Late to Brake (`see-early-brake`) | 98% | maxout 70% | +28 | 13 of 13 | **pass** |
| The Box Behind the Box (`see-early-bravo`) | 93% | maxout 70% | +23 | 13 of 13 | **pass** |
| The Pack Dives Together (`see-early-pack`) | 90% | maxout 100% | -10 | 0 of 13 | fail |
| Still in the Air (`sr-landing`) | 95% | adv-even-wait 48% | +47 | 13 of 13 | **pass** |
| Six Unknown Boxes (`sr-odds`) | 48% | build 28% | +20 | 10 of 13 | **pass** |
| The Last Box (`sr-lastbox`) | 100% | adv-v-go 30% | +70 | 13 of 13 | **pass** |
| The Minefield (`steward-minefield`) | 50% | adv-hs-wait 50% | 0 | 3 of 13 | fail |

- `close-footsteps`: beats every adversary in every rule set.
- `close-wall`: beats every adversary in every rule set.
- `close-spend`: beats every adversary in every rule set.
- `see-early-brake`: beats every adversary in every rule set.
- `see-early-bravo`: beats every adversary in every rule set.
- `see-early-pack`: loses or ties at default (maxout 100% vs 90%), odds 50 (maxout 100% vs 93%), odds 150 (maxout 100% vs 88%), share 20 (maxout 100% vs 90%), share 70 (maxout 100% vs 90%), narrow 12 (maxout 100% vs 90%), narrow 50 (maxout 100% vs 90%), sight 70 (maxout 100% vs 88%), sight 130 (maxout 100% vs 90%), build 10 (maxout 100% vs 90%), build 18 (maxout 100% vs 90%), strikes 2 (maxout 100% vs 90%), strikes 4 (maxout 100% vs 90%).
- `sr-landing`: beats every adversary in every rule set.
- `sr-odds`: loses or ties at narrow 12 (build 28% vs 15%), sight 130 (build 60% vs 55%), build 18 (adv-h-wait 55% vs 38%).
- `sr-lastbox`: beats every adversary in every rule set.
- `steward-minefield`: loses or ties at default (adv-hs-wait 50% vs 50%), odds 150 (adv-hs-wait 45% vs 45%), share 20 (adv-hs-wait 50% vs 50%), share 70 (adv-hs-wait 50% vs 50%), narrow 50 (adv-hs-wait 55% vs 53%), sight 70 (adv-hs-wait 65% vs 43%), sight 130 (adv-hs-wait 53% vs 50%), build 10 (build 50% vs 43%), strikes 2 (adv-s-wait 33% vs 33%), strikes 4 (adv-hs-wait 50% vs 50%).
