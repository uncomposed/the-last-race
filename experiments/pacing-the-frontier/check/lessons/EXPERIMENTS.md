# Play to win: rule experiments and the adversary pool

[[ai gen]] Written by Claude, 2026-10-31, after Cole's playtest: "Our goal is to make the lesson the way to win." Bot play only; nothing here is `human_validated`.

## The method

1. **Adversary pool** (`ADV` in `lessons-sim.js`): eighteen simple strategies a player who plays to win tries first, plus the stock rush, build and wait bots. Each picks what to build while running (height and speed, speed only, height only, sight only, all three evenly, or mostly sight), then floors it once those meters are full. At a box it either never brakes (go), plans the crossing once it can see the width (plan), or holds back until someone else shows the width (wait). Max-out is "height and speed, go".
2. **Experiment rules** (in `RULES` with `exp:1`, off by default, playable with `?rules=`): stronger braking (`brake`), braking that grows with the sight meter (`brakesight`, Cole's research-department reasoning), shorter open track between obstacles (`space`), and a stopped lab's wall appearing at once (`wallstop`).
3. **The runner** (`exp.mjs`) plays every segment and lesson map (22) under one rule setting: max-out, the whole pool, and the lesson map's own strategy. It also records how often max-out reaches a box with height and speed both full.

Tuned and measured on seeds 1 to 40. The spacing result was confirmed on seeds 3001 to 3040. Raw results are in `experiments/`.

## Results

| Rules | Max-out fully built at boxes | Max-out wins | Best simple strategy wins | Lesson maps where the lesson beats every simple strategy |
|---|---|---|---|---|
| default | 17% | 28% | 77% | 5 of 10 |
| brake:160 | 17% | 29% | 76% | 2 of 10 |
| brake:256 | 17% | 29% | 74% | 3 of 10 |
| brakesight:150 | 17% | 29% | 75% | 4 of 10 |
| brake:130,brakesight:100 | 17% | 29% | 76% | 2 of 10 |
| space:70 | 11% | 24% | 68% | 4 of 10 |
| space:50 | 11% | 19% | 60% | 4 of 10 |
| wallstop:1 | 17% | 28% | 77% | 5 of 10 |
| space:50,brakesight:150 | 11% | 19% | 65% | 3 of 10 |
| space:50,brake:256 | 10% | 20% | 72% | 1 of 10 |

| Map | Max-out fully built | Max-out wins | Best simple strategy | Lesson strategy wins |
|---|---|---|---|---|
| unknown | 0% | 5% | rush 55% | - |
| rushing | 0% | 0% | adv-hs-wait 18% | - |
| tailgate | 0% | 0% | adv-hs-wait 100% | - |
| first | 0% | 18% | build 88% | - |
| signs | 0% | 0% | adv-s-go 88% | - |
| beacon | 0% | 3% | adv-hs-wait 45% | - |
| stakes | 0% | 0% | adv-hs-wait 53% | - |
| record | 0% | 0% | build 95% | - |
| wall | 0% | 0% | rush 100% | - |
| follower | 0% | 100% | maxout 100% | - |
| pack | 100% | 85% | maxout 85% | - |
| last | 0% | 0% | adv-h-go 100% | - |
| close-footsteps | 0% | 3% | adv-hs-wait 73% | 80% |
| close-wall | 0% | 13% | adv-s-go 100% | 100% |
| close-spend | 0% | 0% | adv-vs-wait 53% | 75% |
| see-early-brake | 100% | 100% | maxout 100% | 95% |
| see-early-bravo | 50% | 58% | adv-hs-wait 60% | 98% |
| see-early-pack | 100% | 100% | maxout 100% | 95% |
| sr-landing | 30% | 0% | adv-even-plan 58% | 93% |
| sr-odds | 0% | 38% | adv-hs-wait 73% | 70% |
| sr-lastbox | 0% | 100% | maxout 100% | 100% |
| steward-minefield | 0% | 0% | adv-v-plan 48% | 58% |

(Map rows are the default rules, seeds 1 to 40. The first twelve are the segments, which have no lesson strategy.)

## What it says

1. **Max-out is rarely fully built.** Across all 22 maps it reaches a box with height and speed full 17% of the time. Where it is (Too Late to Brake, The Pack Dives Together, half of The Box Behind the Box), it wins, as Cole found by playing.
2. **The most common winner is free-riding.** "Hold back until someone else shows the width, then go" is the best simple strategy on 8 of 22 maps. Max-out is best on 5, rush on 2, the stock careful bot on 2. A follower sees the width, the box narrows behind the first crosser, and the follower still gets the full ceiling when it crosses. So once max-out is gone, waiting for someone else to take the risk is the next exploit.
3. **Half the lessons lose to a simple strategy.** At default rules the lesson strategy beats every simple strategy on 5 of 10 lesson maps: Footsteps, Spend It Once, The Box Behind the Box, Still in the Air, The Minefield.
4. **Shorter tracks work where max-out was the problem.** On held-out seeds, cutting open track to 70% takes max-out from fully built at every box to never on Too Late to Brake and The Box Behind the Box, and its win rate from 100% to 48% (Too Late to Brake) and from 73% to 48% (Box Behind the Box). It doesn't help The Pack Dives Together, a single box after a 1400-long run: even at half spacing max-out arrives full every time, and I haven't yet looked at why it never falls on the wide variant. And on Too Late to Brake the winner becomes free-riding (100%), not the lesson.
5. **Braking and the wall barely move the bots.** Bots plan braking exactly and time their restart perfectly, so these rules hardly change who wins. That's useful: braking and the wall can be tuned for how they feel to a person without unbalancing the maps. It also means bots can't judge them; only playing can.

## What this doesn't show

- The lesson maps were tuned at default rules, so their scores under new rules understate what a map designed for those rules could do.
- The pool is simple on purpose. A strategy that adapts mid-race (look at one box, rush the next) isn't in it yet.
- Win rate is the only measure. Fun isn't measured; The Last Box loses to max-out and Cole still enjoyed it.

## Next: three separate roles

1. **Designer** proposes a map from a structural idea (spacing, order, what's hidden and from whom, who starts where), with the lesson strategy named in advance.
2. **Adversary** is everything above plus anything new a player finds. It never sees the designer's notes, only the map.
3. **Judge**: a map passes when the lesson strategy beats the best adversary on held-out seeds, holds across the rule grid, and then Cole plays it. The designer never grades its own map.

A generator can then propose structures in bulk, the adversary prunes, and only survivors reach Cole.
