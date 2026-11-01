# Small risks add up to ruin: notes

## Round 2

[[ai gen]] Written by Claude, 2026-10-31. Bot play only. Status: verified (exp.mjs and check.mjs reproduce every number here). Nothing is human_validated. Seeds 1 to 40 were used for tuning; for Six Unknown Boxes I also looked at seeds 1001 to 1040 before picking the box spacing, so on that map neither block is truly held out. The judge's seeds are the real test.

Short version: The Last Box now clears the bar by a wide margin. Six Unknown Boxes clears it at the default rules on both blocks, but only just holds across the rule grid, and its story is weaker than its numbers. Still in the Air is unchanged.

### Per map

1. **Still in the Air** (`sr-landing`). Unchanged. Lesson strategy: slow down before each barrier that has a box close behind it. exp.mjs: 93% against adv-even-plan 58% on seeds 1 to 40; 95% against adv-even-plan 58% on 1001 to 1040.

2. **The Last Box** (`sr-lastbox`). Lesson strategy (`sr-last`): clear every box clean until the last one; at the last box, if a scrape is in reach and you have a strike to spare, floor it and take the scrape.
   - Why it wins: the first four boxes are now Still in the Air pairs, a small box just behind each barrier. Fly a barrier and you scrape, and scrapes compound into a crash or dissolution, which is what beats every "go" and "max out" strategy. The last box is shown, wide, and has the finish 40 past it. At the moment of choice you see a scrape is in reach, while a clean crossing means stopping, backing up 600 or so, and building speed. Careful, who starts 40 ahead with its speed already built, does exactly that, and you pass it.
   - exp.mjs: sr-last 98% against adv-v-go 25% on seeds 1 to 40 (margin 73); 95% against adv-v-go 30% on 1001 to 1040 (margin 65). Max out wins 3% and 0%.
   - Rule grid, lesson against the best adversary: beats it in 13 of 13 on both blocks. Smallest margin 37, at strikes 4 (rush wins 63% there).
   - Claim (check.mjs, spend at the last box minus the better of "careful everywhere" and "rush everywhere"): 38 on seeds 1 to 40, 42 on 1001 to 1040; needs 30. Holds in 12 of 13 on both; breaks at build 18, where run-ups get quick and careful-everywhere wins 83% (sr-last 100%).
   - Careful everywhere (`sr-pcare`) wins 60% and 53%. Spending the same strikes early (`sr-early`) wins 13% and 8%. Rushing everything (`sr-fast`) dissolves every time.
   - What I think made Cole's playthrough fun, and what I kept: the last box is shown with the finish right behind it, so the near miss is a clutch call you can see coming; a rival close enough that stopping visibly loses; and watching Rush burn out early on the same kind of near miss. What changed: the early boxes. They used to be easy at full height, so any strategy that floored everything won the same way.

3. **Six Unknown Boxes** (`sr-odds`). Lesson strategy (`sr-look`): never jump a box you have not sized; slow down near each box until you can see its far edge, then cross the narrow ones at once and stop to build for the wide one.
   - Why it wins: you lead, so nobody crosses first to narrow a box or show you its width. Each box rises 25 below your ceiling, so its far edge shows only from close up at full height; a lab that holds back to wait cannot see it from there. About one box in five is wide enough to need a stop and a build. Careful and Build, who also look, are behind you, so every stop costs you the lead.
   - exp.mjs: sr-look 60% against build 20% on seeds 1 to 40 (margin 40); 50% against build 20% on 1001 to 1040 (margin 30). Max out wins 0%.
   - Rule grid, lesson against the best adversary: beats it in 13 of 13 on seeds 1 to 40, but by only 5 to 8 points at narrowing 12, sight 130 and build 18. On 1001 to 1040 it beats it in 10 of 13, exactly the bar; it loses at narrowing 12 (18% against 20%), sight 130 (58% against 60%) and build 18 (45% against adv-h-wait 50%).
   - Claim (check.mjs, looking minus rushing): 60 on seeds 1 to 40, 50 on 1001 to 1040; needs 30. Holds in 12 of 13 on both; breaks at narrowing 12.
   - The looker itself falls 18% and 20% of the time. Rushing falls every time.

### Strongest strategy not in the pool

1. On Six Unknown Boxes: "stop at every box no matter what, build height, look, then cross" is close to what `build` and `adv-h-wait` already do, and they are the best adversaries. A cleaner version of it, without build's creep-and-overshoot fall, would probably tie or beat sr-look. I did not write it. This is the map's weak point: the pool already contains "look before you jump"; sr-look only wins by looking faster.
2. On The Last Box: nothing I tried beat sr-last. Careful everywhere is the next best at 53 to 60%.

### What I tried that didn't work

1. Six Unknown Boxes, box rise at 0.62 of the ceiling with careful rivals behind: everyone fell, from deep scrapes and side entries.
2. Six Unknown Boxes, slower ceiling growth: the boxes got easy and a slow looker lost to its rivals' build.
3. Six Unknown Boxes, rushing rivals far behind: they passed the looker, showed it the widths, and won.
4. Six Unknown Boxes, the same rise for every box: run-ups escalated and everyone fell.
5. Six Unknown Boxes, boxes 520 or 620 apart: fewer looker falls, but on seeds 1001 to 1040 sr-look tied build (48 to 45 at 520).
6. A faster looker that brakes into each box at the clean speed instead of slowing early: more falls, not fewer. Kept the early slow-down.
7. The Last Box with hidden early boxes, half of them needing a run-up: the stock build posture won by building speed early.
8. The Last Box with a rival who also spends at the last box: whoever was behind caught up through the refill rule and the rival won.
9. The Last Box with a careful rival ahead, playing my careful posture: both labs stopped at the same spot to build, so the lead vanished and caution won as often as the lesson. Giving Careful its speed up front fixed that.
10. The Last Box with only 600 of track before the last box: the run-up hit the back limit and adv-v-go won 63%. At 800 it wins 25%. That sensitivity is worth knowing.

### What isn't shown

1. Bots are not people, and nothing here is human_validated. The bots read exact widths and speeds; a person judges by eye.
2. Six Unknown Boxes does not cleanly show "one in five, six times". Rushing falls mostly at narrow boxes (25 of its 40 falls on seeds 1 to 40), because a lab that leads gets its ceiling raised before its height catches up. So the bots show "jumping a box you have not sized is ruin" more than the arithmetic of one in five. Cole should decide whether that is close enough.
3. Part of Six Unknown Boxes' margin comes from a known bot artefact: the stock build posture creeps toward a box, overshoots and falls (65% of its runs end in a fall). If that posture is fixed in lessons-sim.js, this map's margin will shrink.
4. The Last Box's first four boxes reuse Still in the Air's pattern, so the two maps overlap. The new part is the last box: one near miss, spent where nothing is left to repeat.
5. No map shows the strong precautionary principle failing in general. The Last Box shows one narrow case where a near miss is the right call.

## Round 2: lesson strategies, written before tuning

[[ai gen]] Written by Claude, 2026-10-31, before any round 2 tuning. These are fixed; the results go in the Round 2 section once tuning is done.

1. Still in the Air (`sr-landing`), posture `sr-pace`: slow down before each barrier that has a box close behind it, so you land and jump again instead of arriving at the box still in the air. (Passed the judge; unchanged.)
2. Six Unknown Boxes (`sr-odds`), posture `sr-look`: never jump a box you have not sized; slow down near each box until you can see its far edge, then cross the narrow ones at once and stop to build for the wide one.
3. The Last Box (`sr-lastbox`), posture `sr-last`: clear every box clean until the last one, stopping to build if you must; at the last box, if a scrape is in reach and you have a strike to spare, floor it and take the scrape.

## Round 1 (superseded for sr-odds and sr-lastbox)

[[ai gen]] Written by Claude, 2026-10-31, round 1. Bot play only. The sr-odds and sr-lastbox sections below describe the round 1 maps, which round 2 replaced; their numbers no longer reproduce. sr-landing is unchanged.

The lesson: a small chance of ruin, taken again and again, ends in ruin. Each near miss looks survivable alone; the budget is what kills. Source: Taleb, Read, Douady, Norman and Bar-Yam, "The Precautionary Principle" (2014). Disputed by Sunstein, "Laws of Fear" (2005): risk sits on every side, so refusing every risk is not safe either. The third map tries to show that side.

Three maps. Two hold well. One holds on the default rules but breaks at the sight knob.

## 1. sr-landing, "Still in the Air"

Lesson: a near miss you can survive, taken again and again, is a ruin you cannot.

What the player sees: four barriers, each with a narrow box just behind it. Fly a barrier fast and you are still in the air when the box comes, so you scrape. The scrape costs height, so the next barrier is a crash. Slow down before the barrier, land, jump again, and every box is clean.

Claim: pacing wins and rushing dissolves. Score is pace wins minus rush wins; needs 30.

Seeds 1 to 40, score 93:

| You play | Win | Dissolved |
|---|---|---|
| sr-fast (rush every box) | 0% | 100% |
| sr-pace (brake before each barrier) | 93% | 0% |
| rush (stock) | 23% | 20% |
| build (stock) | 3% | 0% |

Held-out, seeds 1001 to 1040: score 92. sr-fast wins 3% and dissolves 93%; sr-pace wins 95%.

Grid: holds in 13 of 13 on both seed blocks. Lowest score 88, at strikes 2.

## 2. sr-odds, "Six Unknown Boxes"

Lesson: one in five is a small risk; six of them in a row is not.

What the player sees: six boxes of the same height. Each is wide with one chance in five, and you cannot see the width until you are close and tall enough. Rush and Dash floor it every time. Stopping to look costs time at every box.

Claim: looking wins more than rushing. Score is look wins minus rush wins; needs 30.

Seeds 1 to 40, score 50:

| You play | Win | Fall | Extinction | Win time |
|---|---|---|---|---|
| sr-fast | 20% | 80% | 10% | 29.5 s |
| sr-look | 70% | 3% | 8% | 46.2 s |
| sr-care | 70% | 3% | 8% | 46.5 s |

Held-out: score 30, right at the bar. sr-fast wins 30%, sr-look 60%.

Grid: holds in 13 of 13 on seeds 1 to 40, lowest 38 at build 18. On held-out it holds in 11 of 13; breaks at build 18 and strikes 2, both scoring 28.

Honest reading: this map is fragile. By arithmetic, about a quarter of tracks (0.8 to the sixth power) have no wide box at all, and on those rushing is simply faster. How many such tracks a seed block draws moves the score a lot. That is the lesson's own shape, but it makes a weak claim.

## 3. sr-lastbox, "The Last Box"

Lesson: a near miss costs you because the race goes on; at the last box, the same risk is a different bet.

What the player sees: five boxes. Careful starts just ahead and never takes a near miss. Rush scrapes every box, losing only a point or two of height each time, and is dissolved at the third scrape. The last box is shown and is too wide to clear clean without stopping to build. Take the scrape there and you win.

Claim: spending one near miss at the last box beats both caution everywhere and rushing everywhere. Score is the smaller of those two gaps; needs 30.

Seeds 1 to 40, score 80:

| You play | Win | Fall | Dissolved |
|---|---|---|---|
| sr-fast (rush every box) | 0% | 85% | 15% |
| sr-care (never a near miss) | 20% | 0% | 0% |
| sr-early (spends spare strikes early) | 15% | 85% | 0% |
| sr-last (spends one at the last box) | 100% | 0% | 0% |

Held-out: score 62. sr-last wins 100%, sr-care 38%, sr-early 8%, sr-fast 0%.

Grid: holds in 11 of 13 on seeds 1 to 40; breaks at sight 70 and sight 130. On held-out it holds in 10 of 13; breaks at sight 70, sight 130 and strikes 2.

What breaks it: plain caution starts winning (sr-care 78% at sight 70, 73% at sight 130, 65% at strikes 2, seeds 1 to 40). sr-last still wins 100% in those three rows. So "spend at the last box" holds; "caution loses" does not. The sr-early row is the point worth keeping: same budget, spent early, falls 85% of the time.

## What didn't work

1. A pure strike-ledger map ("spend all but one"): a scrape also costs height, so spending was never worth the time unless widths were tuned to a few percent.
2. A "who goes first" ledger: it duplicated segments 4 and 8.
3. sr-odds with a Careful rival: Careful's shadow blinded the looker, and when Careful fell behind it caught up through the refill rule.
4. Box rise at 0.8 of the ceiling in sr-landing: lagging labs entered from the side; lowering it made the later boxes too easy.
5. The stock build posture at sr-odds: it creeps toward the face at up to a quarter of top speed, overshoots, the auto-jump fires and it falls. I wrote my own stop. That is a bot artefact in the shared sim, not a lesson; worth a look by whoever owns lessons-sim.js.

## Proposed rule changes (not made)

1. The jump bar shows a fresh-jump outcome even while you are still in the air from a barrier. So sr-landing's trap is invisible on the bar. Metaphor: a lab committed to its last move cannot react to the next, and its instruments probably should not pretend it can. Open question for Cole: is the hidden trap the lesson, or unfair?
2. None to strikes. A scrape's height loss is what turns one near miss into the next crash, and that is the compounding this lesson needs. Keep it.

## What isn't shown

Bots are not people. The bots play fixed postures with perfect hands. Nothing here is human_validated. No map shows the strong precautionary principle failing in general; sr-lastbox shows one narrow case where a near miss is the right call, and its "caution loses" half breaks at two sight settings.
