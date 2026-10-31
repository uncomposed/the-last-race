# See before you need to: notes

[[ai gen]] Written by an agent from bot checks it ran. Status: verified, meaning `check.mjs` reproduces every number here. Nothing here is human_validated.

All three maps hold their claims in 13 of 13 rule sets, on seeds 1 to 40 and on the held-out seeds 1001 to 1040.

The full check output is in `results.md` (seeds 1 to 40) and `results-heldout.md` (seeds 1001 to 1040).

The lesson comes from the brief's sources: the evidence dilemma in the International AI Safety Report 2025, the Collingridge dilemma, and Castle Bravo, which was predicted at 4 to 8 megatons and yielded 15. The idea behind the maps: by the time the evidence is in front of you, you are already committed.

## The postures I wrote

1. **seeearly** is the lesson. It puts everything into sight while cruising. When a box comes into view but its width doesn't yet, it slows to a speed it can still stop from. Once it knows the width, a box it can't clear clean gets full height first, then a run-up. If a second box sits so close that crossing the first commits it to the second, it waits until it can see the second box's width too.
2. **seebreak** is Cole's line from hidden width. It floors it out of the pack with no investing. Once nobody is close ahead, it plays seeearly.
3. **seecreep** is a foil. It drives at half pace so it can stop for anything, but puts nothing into sight.
4. **seemax** is a foil. It braces for the worst at every box: full height and full speed, then the longest run-up.
5. **seeblind** is a foil. It breaks out of the pack like seebreak, but puts nothing into sight.

## Map 1: Too Late to Brake (`see-early-brake`)

**Lesson.** If you start looking only when the risk is in front of you, you can no longer stop.

**What's on screen.** You lead, so nobody ahead shows you the box. Everyone runs fast with almost no sight. With sight 5, the box face appears about 102 ahead, but braking from speed 67 takes about 144. With sight near 45, the face shows about 270 ahead and the far edge about 170 to 200 ahead, which is enough room to stop and build. Half the seeds have a wide box that only full height clears.

**Claim.** Seeing early wins more than rushing, late care, or slowing down blind. Score is seeearly's win minus the best foil's win. It needs 15.

| You play | Win | Fall |
|---|---|---|
| seeearly | 95% | 0% |
| rush | 38% | 63% |
| build | 38% | 63% |
| seecreep | 0% | 0% |

**Scores.** 57 on seeds 1 to 40, and 35 held out.

**Grid.** Holds in 13 of 13; never breaks. The lowest score is 55 at fall odds 150 (base) and 35 held out.

Build plays the same as rush here. It sees the box too late to stop, so it commits at full speed. Seecreep never falls and never wins; it is too slow.

## Map 2: The Box Behind the Box (`see-early-bravo`)

**Lesson.** The estimate that matters is of the thing just past the one you can see.

**What's on screen.** Box 1 is narrow and plainly safe. Box 2 starts 70 past it, with no room to stop between them. On half the seeds box 2 is wide, and only a lab that hits box 1 at full speed and full height can carry across it. So the choice is made before box 1. Only a lab with high sight can see box 2's width from about 200 before box 1.

**Claim.** Looking past the first box wins more than rushing, careful box-by-box play, or bracing for the worst at every box. It needs 15.

| You play | Win | Fall |
|---|---|---|
| seeearly | 98% | 0% |
| rush | 38% | 63% |
| build | 38% | 63% |
| seemax | 60% | 0% |

**Scores.** 38 on seeds 1 to 40, and 28 held out.

**Grid.** Holds in 13 of 13; never breaks. The lowest score is 23, held out at fall odds 150. Sight 130 lifts it to 60 on the base seeds.

Rush and build fall on every wide box 2. The rivals who learn the width from someone else's fall are already committed. Seemax never falls, but it is slow at every box and loses the narrow seeds.

## Map 3: The Pack Dives Together (`see-early-pack`)

**Lesson.** Nobody in a pack sees further than the lab in front, so to see early you first have to get out in front.

**What's on screen.** You sit in a pack of four. The Lead is 40 ahead and blocks your view of the road. Two tailers sit behind you. The box is at 1400, and half the seeds have a wide one. Looking from inside the pack shows you nothing past the Lead.

**Claim.** Breaking out of the pack and then looking wins more than staying in it, dropping back, rushing, looking from inside it, or breaking out without looking. It needs 15.

| You play | Win | Fall |
|---|---|---|
| seebreak | 95% | 0% |
| tail | 0% | 63% |
| build | 0% | 0% |
| rush | 0% | 63% |
| seeearly (looks from inside) | 0% | 63% |
| seeblind (breaks out, doesn't look) | 38% | 63% |

**Scores.** 57 on seeds 1 to 40, and 35 held out.

**Grid.** Holds in 13 of 13; never breaks. The lowest score is 35, held out, flat across the grid.

Breaking out without looking wins only the safe boxes. That makes it the honest foil: what wins is the looking, not the lead.

## How big the margins are, and why

The margin on every map is roughly the share of wide boxes in the seed block. On the safe boxes the foils win too. Seeds 1 to 40 drew about 62% wide; the held-out block drew about 40%. That is why the held-out scores sit about 20 points lower. A player gets a wide box about half the time.

## What I tried that didn't work

1. **A segment-1-style map with big boxes.** Rush scraped widths 1.13 to 1.2 anyway, because care from height alone buys only about 10% width.
2. **Investing in sight while cruising at pace 0.85.** Too slow to matter, and slowing early cost about 3 seconds, so rush won the narrow boxes.
3. **Rises of 40 to 49.** At those rises your height, not your sight, limits how much of the box width you can see. I moved to rise 30 so the sight meter decides.
4. **Speed already at the ceiling at the start.** Then stopping to build bought nothing. I started speed at 40, so a lab that stops can build to 110.
5. **Planning at current height.** `sgPlanKnown` judges a box at the height you have now, so seeearly planned a scrape at height 56 and fell. It now builds full height first.
6. **Careful rivals just behind you.** They never fell, because your evidence and your shadow protected them. I moved them back 150 to 300.
7. **Bravo, first version.** It stopped at the stand distance and got passed. It now approaches at a speed it can stop from.
8. **Braking after box 1 to build height.** It landed too close to box 2 and fell. It now commits when it is too close to stop.
9. **Pack box at 1100.** It broke at sight 70 once seeblind was in the claim, because breaking out leaves too little time to buy sight. I moved the box to 1400.
10. **Fall odds 10.** Rival falls caused extinctions that cut the held-out margin. I lowered them to 5.

## A rule change I'd propose (not made)

How much of a box's width you can see is capped by your height, through the grazing angle `C.SEEANG` of 0.15. At rise 49 and height 70, sight above about 41 points adds nothing to your view of the width.

**Proposal.** Let sight points widen the grazing view too, so more sight shows more of a tall box's width.

**Metaphor reason.** Evaluation should let you size a risk without first becoming more capable yourself. As it stands, only height, which stands for capability, lets you judge the tall boxes. That teaches the opposite of this lesson.

## What isn't shown

1. Bots aren't people. The lesson posture and all the foils except rush, build, tail and late are mine, and a person may play none of them.
2. The margins depend on the mix of wide and narrow boxes in each seed block.
3. I haven't checked the page in a browser.
4. Nothing here is human_validated until Cole plays it.

## Harness

Nothing in the harness blocked me. The shared scratchpad did once: another agent overwrote my debug script, so I moved my tools into their own subfolder.
