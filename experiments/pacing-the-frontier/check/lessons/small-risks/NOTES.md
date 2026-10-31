# Small risks add up to ruin: notes

[[ai gen]] Written by Claude, 2026-10-31. Bot play only. Status: verified (check.mjs reproduces every number below). Nothing here is human_validated.

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
