# The judge

[[ai gen]] Bot play only, judge seeds 9001 to 9040, chill on (auto-jump). A map passes when its lesson strategy beats the best of 33 adversaries by 15 points at the default rules and beats the best adversary in at least 10 of 13 rule sets. Status: verified (this script reproduces it), nothing human_validated.

| Map | Lesson strategy wins | Best adversary | Margin | Rule sets held | Verdict |
|---|---|---|---|---|---|
| Footsteps (`close-footsteps`) | 50% | y-pace 58% | -8 | 0 of 13 | fail |
| The Leader’s Wall (`close-wall`) | 100% | y-look 100% | 0 | 1 of 13 | fail |
| Spend It Once (`close-spend`) | 0% | y-pace 45% | -45 | 0 of 13 | fail |
| Too Late to Brake (`see-early-brake`) | 73% | y-prep 85% | -12 | 0 of 13 | fail |
| The Box Behind the Box (`see-early-bravo`) | 93% | x-fill 80% | +13 | 13 of 13 | fail |
| The Pack Dives Together (`see-early-pack`) | 83% | adv-even-wait 100% | -17 | 0 of 13 | fail |
| Still in the Air (`sr-landing`) | 75% | wait 100% | -25 | 0 of 13 | fail |
| Six Unknown Boxes (`sr-odds`) | 3% | x-steady110 43% | -40 | 0 of 13 | fail |
| The Last Box (`sr-lastbox`) | 83% | adv-s-go 100% | -17 | 0 of 13 | fail |
| The Minefield (`steward-minefield`) | 58% | x-steady120 63% | -5 | 1 of 13 | fail |

- `close-footsteps`: loses or ties at default (y-pace 58% vs 50%), odds 50 (y-pace 58% vs 50%), odds 150 (y-pace 58% vs 50%), share 20 (y-pace 58% vs 50%), share 70 (y-pace 58% vs 50%), narrow 12 (y-pace 58% vs 50%), narrow 50 (y-pace 58% vs 50%), sight 70 (y-pace 75% vs 50%), sight 130 (y-pace 58% vs 40%), build 10 (y-pace 58% vs 40%), build 18 (x-se-ready 58% vs 50%), strikes 2 (y-pace 58% vs 50%), strikes 4 (y-pace 58% vs 50%).
- `close-wall`: loses or ties at default (y-look 100% vs 100%), odds 50 (y-look 100% vs 100%), odds 150 (y-look 100% vs 100%), share 20 (y-look 100% vs 100%), share 70 (y-look 100% vs 100%), narrow 12 (y-look 100% vs 100%), narrow 50 (y-look 100% vs 100%), sight 70 (x-se-ready 100% vs 100%), build 10 (y-look 100% vs 100%), build 18 (y-prep 100% vs 100%), strikes 2 (y-look 100% vs 100%), strikes 4 (y-look 100% vs 100%).
- `close-spend`: loses or ties at default (y-pace 45% vs 0%), odds 50 (y-pace 45% vs 0%), odds 150 (y-pace 45% vs 0%), share 20 (y-pace 45% vs 0%), share 70 (y-pace 45% vs 0%), narrow 12 (y-pace 45% vs 0%), narrow 50 (y-pace 45% vs 0%), sight 70 (y-pace 45% vs 0%), sight 130 (y-pace 45% vs 0%), build 10 (y-run40 43% vs 0%), build 18 (maxout 0% vs 0%), strikes 2 (y-pace 45% vs 0%), strikes 4 (y-pace 45% vs 0%).
- `see-early-brake`: loses or ties at default (y-prep 85% vs 73%), odds 50 (y-prep 85% vs 73%), odds 150 (y-prep 85% vs 73%), share 20 (y-prep 85% vs 73%), share 70 (y-prep 85% vs 73%), narrow 12 (y-prep 85% vs 73%), narrow 50 (y-prep 85% vs 73%), sight 70 (y-prep 85% vs 73%), sight 130 (y-prep 85% vs 73%), build 10 (y-prep 85% vs 73%), build 18 (y-prep 85% vs 73%), strikes 2 (y-prep 85% vs 73%), strikes 4 (y-prep 85% vs 73%).
- `see-early-bravo`: beats every adversary in every rule set.
- `see-early-pack`: loses or ties at default (adv-even-wait 100% vs 83%), odds 50 (adv-even-wait 100% vs 83%), odds 150 (adv-even-wait 100% vs 80%), share 20 (adv-even-wait 100% vs 83%), share 70 (adv-even-wait 100% vs 83%), narrow 12 (adv-even-wait 100% vs 83%), narrow 50 (adv-even-wait 100% vs 83%), sight 70 (adv-even-plan 90% vs 75%), sight 130 (adv-even-plan 90% vs 83%), build 10 (maxout 90% vs 83%), build 18 (adv-vs-plan 90% vs 83%), strikes 2 (adv-even-wait 100% vs 83%), strikes 4 (adv-even-wait 100% vs 83%).
- `sr-landing`: loses or ties at default (wait 100% vs 75%), odds 50 (wait 100% vs 75%), odds 150 (wait 100% vs 75%), share 20 (wait 100% vs 75%), share 70 (wait 100% vs 75%), narrow 12 (wait 100% vs 73%), narrow 50 (wait 100% vs 78%), sight 70 (maxout 100% vs 80%), sight 130 (adv-s-wait 100% vs 28%), build 10 (wait 100% vs 75%), build 18 (x-hopfast 100% vs 50%), strikes 2 (wait 100% vs 63%), strikes 4 (wait 100% vs 60%).
- `sr-odds`: loses or ties at default (x-steady110 43% vs 3%), odds 50 (x-steady110 45% vs 3%), odds 150 (x-steady110 43% vs 3%), share 20 (x-steady110 45% vs 5%), share 70 (x-steady110 35% vs 3%), narrow 12 (x-steady110 70% vs 3%), narrow 50 (x-steady110 38% vs 3%), sight 70 (x-steady110 88% vs 5%), sight 130 (build 58% vs 0%), build 10 (x-steady115 38% vs 8%), build 18 (adv-h-wait 45% vs 3%), strikes 2 (x-steady110 70% vs 3%), strikes 4 (x-steady120 45% vs 5%).
- `sr-lastbox`: loses or ties at default (adv-s-go 100% vs 83%), odds 50 (adv-s-go 100% vs 85%), odds 150 (adv-s-go 100% vs 83%), share 20 (adv-s-go 100% vs 83%), share 70 (adv-s-go 100% vs 83%), narrow 12 (adv-s-go 100% vs 90%), narrow 50 (adv-s-go 100% vs 65%), sight 70 (adv-s-go 100% vs 78%), sight 130 (adv-s-go 100% vs 65%), build 10 (x-hopfast 100% vs 85%), build 18 (x-hopfast 100% vs 88%), strikes 2 (x-hopfast 95% vs 45%), strikes 4 (adv-s-go 100% vs 88%).
- `steward-minefield`: loses or ties at default (x-steady120 63% vs 58%), odds 50 (x-steady120 70% vs 63%), odds 150 (x-steady120 53% vs 50%), share 20 (x-steady120 63% vs 58%), share 70 (x-steady120 60% vs 58%), narrow 12 (x-steady120 58% vs 55%), sight 70 (x-steady120 55% vs 48%), sight 130 (x-steady120 60% vs 60%), build 10 (x-steady120 60% vs 58%), build 18 (x-steady120 60% vs 43%), strikes 2 (adv-s-wait 40% vs 33%), strikes 4 (x-steady120 73% vs 58%).
