# Close race: notes

[[ai gen]] Written by a Claude subagent on 2026-10-31. Status: `verified` by the bot check only. Nothing here is `human_validated`.

Lesson: **a close race leaves no slack.** A lead is slack you can spend on safety. A bunched pack can't afford to stop. A rival right behind tempts you to gamble.

Sources, from `research/LESSON-CATALOG.md` entry A3: Armstrong, Bostrom and Shulman 2016, "Racing to the Precipice". Dafoe 2018, research agenda (open question). Aschenbrenner 2024, "Situational Awareness" (the pro-race contrast). Yudkowsky, TIME 2023 (nobody can stop alone).

Every number below comes from `node check.mjs --only close-race`, seeds 1 to 40, or with `--seeds 1001-1040` for the held-out block. Full tables are in `results.md` and `results-heldout.md`.

Three new postures live in `maps.js`:

1. **crRacer**, the rival bot. It cruises until it is 250 from the box face. Then it decides once. If it can't size the box, it floors it. If it can, it plans a run-up like Build.
2. **crLook**, careful you. It stops about 180 short, fills height and speed, then creeps in until the far edge shows.
3. Three map-specific versions of you: crMirror, crPlant and crSave, described with each map.

## 1. Footsteps (`close-footsteps`)

**Lesson:** a rival on your tail takes away the time you'd spend looking.

**On screen:** one box, any width. Racer is either 20 behind you or 1000 behind you, and the note says which. The box is either mid-width, where rushers scrape, or wide, where rushers fall.

**Claim:** checking the mirror wins most. crMirror looks once when the box comes into view. If a rival is within 200 behind, it rushes. Otherwise it looks. Score is mirror's win minus the better of rush and look; it needs 10.

| You play | Win | Fall | Extinction |
|---|---|---|---|
| rush | 65% | 35% | 30% |
| crLook | 53% | 0% | 5% |
| crMirror | 80% | 20% | 18% |

1. Score 15 on seeds 1 to 40. Score 17 on the held-out block.
2. Grid: holds in 13 of 13 on both blocks. The lowest grid score is 15. The binding term is mirror against rush.
3. Split by variant, seeds 1 to 40:
   - With Racer far back (15 seeds), look wins 15 of 15 and rush wins 9.
   - With Racer close (25 seeds), rush wins 17 and look wins 6. Racer wins the other 17 when you look.
4. The honest cost: rushing when close also raises extinction. In the close variant, rush caused 7 extinctions and look caused 2. The lesson is exactly that. The race makes the gamble the winning move.

## 2. The Leader's Wall (`close-wall`)

**Lesson:** nobody can stop alone, unless they are far enough ahead.

**On screen:** you are tall (height 90) and see well. Three shorter, faster racers come from 200 to 230 behind. One box is ahead, any width.

**Claim:** stopping at the edge wins more than rushing or stopping back. crPlant stops about 230 short of the face, stands a moment, then eases forward. That leaves a barrier of your height at the box edge. Then it looks and crosses. Score is the smaller of plant minus rush and plant minus build; it needs 20.

| You play | Win | Fall | Extinction | Rival falls |
|---|---|---|---|---|
| rush | 38% | 63% | 40% | 0.97 |
| build | 33% | 0% | 53% | 1.85 |
| crPlant | 100% | 0% | 0% | 0 |

1. Score 62 on seeds 1 to 40. Score 40 on the held-out block.
2. Grid: holds in 13 of 13 on both blocks. The lowest grid score is 50, at fall odds 50.
3. Why Build loses: it stops at 270, just outside the 260 zone that plants a barrier. The pack streams past it and falls in.
4. Counterfactuals on seeds 1 to 40, with the final map restored afterwards. These measure how much of the effect comes from the lead and how much from height:
   - Pack 150 back: plant wins 100%.
   - Pack 100 back: plant wins 60%, with 28% extinction.
   - Pack 50 back: plant wins 35%, with 60% extinction, the same as Build. The pack passes before the barrier exists.
   - Pack as tall as you, 200 back: plant and Build both win 0%, and Racer 1 wins. The wall only holds labs shorter than you.
5. So this is Cole's idea, and it works. But it needs both a lead and a height edge. That fits the lesson: a pause only one leader can enforce isn't a pact.

## 3. Spend It Once (`close-spend`)

**Lesson:** a lead is slack, and you can only spend it once.

**On screen:** you start 1400 ahead of two racers. Box 1 is cheap: a fall rolls 5%. Box 2 is dear: a fall rolls 40%, and it is mid-width or wide. The note states which is which.

**Claim:** rush the cheap box, then spend the lead on the dear one. crSave beats rushing both and taking care at both. Score is crSave's win minus the better of the two; it needs 15.

| You play | Win | Fall | Extinction |
|---|---|---|---|
| rush | 13% | 88% | 35% |
| crLook | 23% | 0% | 0% |
| crSave | 75% | 25% | 13% |

1. Score 52 on seeds 1 to 40. Score 38 on the held-out block.
2. Grid: holds in 12 of 13 on both blocks. It breaks at strikes 2, with a score of 0, and minus 5 on the held-out block. The weakest grid scores otherwise are 28 at build 10 and 30 at sight 130.
3. Where people fall, seeds 1 to 40:
   - crSave falls at box 1 in 10 of 40 runs, and never at box 2.
   - Rush falls at box 1 in 10 and at box 2 in 25.
   - crLook never falls.
4. Why strikes 2 breaks it: crSave scrapes box 1 in 21 of 40 runs. That is a strike. A second scrape at box 2 dissolves it. At strikes 2, crSave wins 23% and is dissolved in 53%.
5. This is Aschenbrenner's argument made playable, and the map lets it win. It only works because the map tells you which box is cheap. Its falls at box 1 still roll the 5% for everyone.

## What didn't work

1. **close-bet**, the first third map: rush box 1 to win a lead, then plant at box 2. It failed because every lab that crosses gets the full next ceiling, so first across is only a short lead. Rush also lost 32 height to a scrape and then fell at box 2. Win rates: rush 0%, plant 25%, bet 18%. Replaced by Spend It Once.
2. Footsteps with a Build-style look was far too slow. Racer passed even from far back. A faster crLook and a bimodal width fixed it.
3. Footsteps with Racer 400 to 800 back broke at sight 70. It needed 1000.
4. Giving labs a full speed meter at the start made everyone clear every box. Reverted.
5. More sight for you in Footsteps (45) let look win when close too. The claim failed. Reverted to 30.
6. The first crPlant stalled near zero speed and never planted. It now nudges forward after standing 0.4 seconds.
7. The Wall pack first passed you before the barrier was planted. Fixes: pack 200 back, shorter pack, your pace 0.6.
8. The Wall racers were first capped at 78. That contradicts the sim, where crossers get the full ceiling, so they were raised to 90.
9. The bot `rush` posture floors it from far away once a box is public. In Spend It Once that let racers catch up from 1400 back. crRacer now cruises until it is 250 from the face.
10. Spend It Once lead tuning: 1300 broke at build 10 and strikes 2; 1500 broke at sight 130 and strikes 2; 2000 let careful-at-both catch up. 1400 is the best found.

## Rule proposals (not made)

1. **Plant the stop-barrier when a lab stops, not when it moves on.** Today the barrier only appears when a stopped lab starts forward again. So a stop doesn't hold anyone back while you look, which is the moment that matters. Metaphor: a lab that pauses at the edge is visibly in the way the moment it pauses.
2. **Look at refill.** Labs behind invest up to three times faster (`K.refill`, not one of the six knobs). That erodes any lead fast, which is why my leads had to be 1000 to 1400. Metaphor question: is catch-up really that cheap? If the catalog says leads are slack, refill shouldn't erase them in seconds. It should be a seventh grid knob at least.
3. **First across gives only a short ceiling lead,** because every crosser gets the full next ceiling. If "racing to be first" should pay, first across might keep a small edge. If it shouldn't, this is fine as is. Flagging it, not pushing it.
4. **The bot `rush` posture floors it from far away once a box is public.** That makes rivals sprint across empty track. A rush that decides near the face, like crRacer, would read more like a real gamble.

## What isn't shown

1. Bots aren't people. "You" plays with perfect hands. Nothing here is `human_validated` until Cole plays it.
2. Footsteps moves Racer's start inside `track()`. It works because track runs before the labs are placed, but it is a hack within the format. If that order changes, the map breaks.
3. The leads are large: 1000 in Footsteps and 1400 in Spend It Once. That's because of refill.
4. The claims are about winning. Extinction is reported next to them, and in Footsteps the winning move raises it.
5. Spend It Once tells the player which box is cheap. Real races don't. The map doesn't show what happens when you can't tell.
6. Win rates are from 40 seeds per block. A 10-point gap is a few runs. The held-out block is there to catch overfitting, not to give a precise effect size.
