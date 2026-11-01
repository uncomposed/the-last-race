# The judge

[[ai gen]] Bot play only, judge seeds 9001 to 9040. A map passes when its lesson strategy beats the best of 21 adversaries by 15 points at the default rules and beats the best adversary in at least 10 of 13 rule sets. Status: verified (this script reproduces it), nothing human_validated.

| Map | Lesson strategy wins | Best adversary | Margin | Rule sets held | Verdict |
|---|---|---|---|---|---|
| Footsteps (`close-footsteps`) | 93% | adv-hs-wait 88% | +5 | 13 of 13 | fail |
| The Leader’s Wall (`close-wall`) | 100% | adv-s-go 100% | 0 | 1 of 13 | fail |
| Spend It Once (`close-spend`) | 40% | adv-hs-wait 38% | +2 | 8 of 13 | fail |
| Too Late to Brake (`see-early-brake`) | 90% | maxout 100% | -10 | 0 of 13 | fail |
| The Box Behind the Box (`see-early-bravo`) | 93% | adv-hs-wait 85% | +8 | 11 of 13 | fail |
| The Pack Dives Together (`see-early-pack`) | 90% | maxout 100% | -10 | 0 of 13 | fail |
| Still in the Air (`sr-landing`) | 95% | adv-even-wait 48% | +47 | 13 of 13 | **pass** |
| Six Unknown Boxes (`sr-odds`) | 60% | adv-s-go 60% | 0 | 0 of 13 | fail |
| The Last Box (`sr-lastbox`) | 98% | adv-h-go 98% | 0 | 2 of 13 | fail |
| The Minefield (`steward-minefield`) | 50% | adv-v-plan 45% | +5 | 6 of 13 | fail |

- `close-footsteps`: beats every adversary in every rule set.
- `close-wall`: loses or ties at default (adv-s-go 100% vs 100%), odds 50 (adv-s-go 100% vs 100%), odds 150 (adv-s-go 100% vs 100%), share 20 (adv-s-go 100% vs 100%), share 70 (adv-s-go 100% vs 100%), narrow 12 (adv-s-go 100% vs 100%), narrow 50 (adv-s-go 100% vs 100%), sight 70 (adv-s-go 100% vs 100%), sight 130 (adv-s-go 100% vs 100%), build 18 (adv-s-go 100% vs 100%), strikes 2 (adv-s-go 100% vs 100%), strikes 4 (adv-s-go 100% vs 100%).
- `close-spend`: loses or ties at share 70 (adv-hs-wait 38% vs 38%), sight 70 (adv-hs-wait 38% vs 33%), sight 130 (adv-even-wait 60% vs 55%), build 10 (adv-hs-wait 30% vs 23%), strikes 2 (adv-hs-wait 23% vs 8%).
- `see-early-brake`: loses or ties at default (maxout 100% vs 90%), odds 50 (maxout 100% vs 93%), odds 150 (maxout 100% vs 88%), share 20 (maxout 100% vs 90%), share 70 (maxout 100% vs 90%), narrow 12 (maxout 100% vs 90%), narrow 50 (maxout 100% vs 90%), sight 70 (maxout 100% vs 90%), sight 130 (maxout 100% vs 90%), build 10 (adv-hs-wait 100% vs 90%), build 18 (maxout 100% vs 90%), strikes 2 (maxout 100% vs 90%), strikes 4 (maxout 100% vs 90%).
- `see-early-bravo`: loses or ties at sight 70 (adv-hs-wait 100% vs 93%), build 18 (adv-hs-wait 88% vs 88%).
- `see-early-pack`: loses or ties at default (maxout 100% vs 90%), odds 50 (maxout 100% vs 93%), odds 150 (maxout 100% vs 88%), share 20 (maxout 100% vs 90%), share 70 (maxout 100% vs 90%), narrow 12 (maxout 100% vs 90%), narrow 50 (maxout 100% vs 90%), sight 70 (maxout 100% vs 88%), sight 130 (maxout 100% vs 90%), build 10 (maxout 100% vs 90%), build 18 (maxout 100% vs 90%), strikes 2 (maxout 100% vs 90%), strikes 4 (maxout 100% vs 90%).
- `sr-landing`: beats every adversary in every rule set.
- `sr-odds`: loses or ties at default (adv-s-go 60% vs 60%), odds 50 (adv-s-go 60% vs 60%), odds 150 (adv-s-go 60% vs 55%), share 20 (adv-s-wait 60% vs 60%), share 70 (adv-s-go 60% vs 60%), narrow 12 (adv-s-go 60% vs 60%), narrow 50 (adv-s-go 60% vs 60%), sight 70 (adv-s-go 60% vs 60%), sight 130 (adv-s-go 60% vs 60%), build 10 (adv-h-wait 60% vs 60%), build 18 (adv-s-wait 73% vs 55%), strikes 2 (adv-s-go 60% vs 60%), strikes 4 (adv-s-go 60% vs 60%).
- `sr-lastbox`: loses or ties at default (adv-h-go 98% vs 98%), odds 50 (adv-h-go 98% vs 98%), odds 150 (adv-h-go 98% vs 98%), share 20 (adv-h-plan 98% vs 98%), share 70 (adv-h-go 98% vs 98%), narrow 12 (adv-h-go 98% vs 98%), narrow 50 (adv-h-go 98% vs 98%), sight 70 (maxout 88% vs 88%), sight 130 (adv-h-go 98% vs 98%), build 10 (maxout 98% vs 95%), strikes 2 (adv-h-go 100% vs 100%).
- `steward-minefield`: loses or ties at share 20 (adv-v-plan 45% vs 38%), share 70 (build 55% vs 55%), narrow 50 (adv-v-plan 45% vs 30%), sight 70 (adv-h-wait 78% vs 33%), build 10 (adv-even-wait 30% vs 20%), build 18 (adv-h-wait 63% vs 35%), strikes 2 (adv-v-plan 45% vs 5%).
