# The judge

[[ai gen]] Bot play only, judge seeds 9001 to 9040, chill on (auto-jump). A map passes when its lesson strategy beats the best of 33 adversaries by 15 points at the default rules and beats the best adversary in at least 10 of 13 rule sets. Status: verified (this script reproduces it), nothing human_validated.

| Map | Lesson strategy wins | Best adversary | Margin | Rule sets held | Verdict |
|---|---|---|---|---|---|
| Look Before You Leap (`cp-look`) | 45% | x-se-ready 50% | -5 | 2 of 13 | fail |
| Warning Signs (`cp-signs`) | 83% | x-fill 65% | +18 | 10 of 13 | **pass** |
| The Pattern Breaks (`cp-break`) | 100% | adv-h-go 55% | +45 | 8 of 13 | fail |

- `cp-look`: loses or ties at default (x-se-ready 50% vs 45%), odds 50 (x-se-ready 50% vs 45%), odds 150 (x-se-ready 50% vs 45%), share 70 (x-steady120 63% vs 43%), narrow 12 (x-se-ready 50% vs 45%), narrow 50 (x-se-ready 48% vs 45%), sight 70 (x-fill 50% vs 0%), sight 130 (adv-hs-wait 55% vs 33%), build 18 (adv-hs-plan 80% vs 63%), strikes 2 (x-se-ready 50% vs 45%), strikes 4 (x-se-ready 50% vs 45%).
- `cp-signs`: loses or ties at share 70 (x-fill 65% vs 18%), sight 70 (x-fill 65% vs 65%), sight 130 (build 75% vs 50%).
- `cp-break`: loses or ties at share 20 (maxout 100% vs 100%), share 70 (adv-even-wait 100% vs 100%), sight 70 (adv-h-wait 100% vs 100%), build 10 (adv-h-go 55% vs 0%), build 18 (x-steady110 100% vs 100%).
