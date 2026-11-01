# Close race: notes

## Round 2

[[ai gen]] Written by a Claude subagent on 2026-10-31. Bot play only. Status: `verified` by `exp.mjs` and `check.mjs` on seeds 1 to 40 and 1001 to 1040. The judge was not run. Nothing here is `human_validated`.

**Short version.** All three maps now have the lesson strategy winning by at least 17 points over the best adversary in the pool, on both seed blocks, in 13 of 13 rule sets. The Wall and Spend It Once win by 85 to 100 points. Footsteps wins by 17 to 20, and that is close to its ceiling.

### Lesson strategies, written before tuning

1. **The Leader's Wall** (`close-wall`), posture `crPlant`. One sentence: when you lead and see the box, pull up inside its edge zone at once, not back where the box first shows, and do your building there, rolling forward a touch now and then, so your stop leaves a wall the shorter pack can't jump; then cross. Posture: stop about 230 short, stand a moment, nudge (the wall goes up at your height), then build at the face, nudging about once a second so the wall grows with you, then plan the crossing.
   - Changed in tuning: walls can't be raised (see the rule notes below), so the final crPlant plants once, about 230 short, fills height and speed standing there, and floors it. No repeated nudges.
2. **Footsteps** (`close-footsteps`), posture `crMirror`. One sentence: when the box comes into view, check your mirror; with a rival on your tail, go now; with the rival far back, stop and build before you cross. Posture: decide once, when the box is first seen; within 200, rush; otherwise look, as crLook does.
   - Changed in tuning: "go now" builds speed while cruising as soon as a rival is within 200 behind, then floors it. "Stop and build" stops about 180 short, fills height and speed, backs up for a run-up and floors it (crPrep). It doesn't wait to see the far edge.
3. **Spend It Once** (`close-spend`), posture `crSpend`. One sentence: race the cheap first box flat out without stopping to look, and spend your lead once, at the dear second box: stop short of it, build height and speed, back up for a run-up, then go. Posture: at a box whose falls roll 10% or less, floor it; at a dearer box, stop about 180 short, fill height and speed, back up if short of run-up, floor it (crPrep). The racers are competent: they play the same line, so your lead covers exactly one stop.
   - Changed in tuning: the stop is about 275 short, not 180, so there's room for the run-up at the higher ceiling and no time lost backing up.

### 1. The Leader's Wall

1. **Strategy:** lead into the box, pull up about 230 short of its face, fill height and speed there, then floor it.
2. **Why it wins:** you are tall. Three short, fast racers come from 260 to 290 behind. When the box comes into view, they are close enough that a bunched crossing means someone falls, and far enough back that you can stop first. Your stop leaves a wall at your height at the box edge, the racers crash into it, and you cross alone.
3. **exp.mjs:** seeds 1 to 40, crPlant 100%, best adversary adv-hs-wait 10%. Seeds 1001 to 1040, crPlant 100%, best adversary adv-hs-wait 15%.
4. **Grid:** 13 of 13 on both blocks. The lowest score is 42, at fall odds 50.
5. **Why the adversaries lose:** the pack streams past them and dives in. They only win when no racer's fall rolls extinction. Extinction runs 85% to 95% in their games.
6. **It needs a lead in a window.** Counterfactual pack starts, seeds 1 to 40, lesson against best adversary:
   - 40 or 100 back: 10% against 10%. Too close to stop before they arrive.
   - 180 or 360 back: 100% against 10%.
   - 700 back: 100% against rush 65%.
   - 1200 back: 100% against adv-h-go 90%. No need to stop.
7. **Human timing is tight.** The pack reaches the edge about 1.2 seconds after you plant.

### 2. Footsteps

1. **Strategy:** when the box comes into view, check your mirror. Racer on your tail, go now, flat out. Racer far back, stop, build, then go.
2. **Why it wins:** one box, and the finish is just past it. The note says whether Racer starts 60 behind or 900 behind, and whether a cruiser scrapes or falls at the box. Racer is strong, and it pounces: if you slow below 35 while it can see you, it floors it. With Racer close, any stop hands it the race. With Racer far back, you have time to build and cross clean.
3. **exp.mjs:** seeds 1 to 40, crMirror 70%, best adversary adv-s-go 53%. Seeds 1001 to 1040, crMirror 80%, best adversary adv-h-wait 60%.
4. **Grid:** 13 of 13 on both blocks. The lowest margin is 17.
5. **The ceiling.** With Racer close and the box wide, the mirror loses every time, 0 of 12 on seeds 1 to 40. Rushing falls, and stopping gets pounced. So the margin can't beat the smaller of two shares: far-and-wide seeds, where only stopping works, and close-and-mid seeds, where only going works. At even odds that is about 25 points. Seeds 1 to 40 drew 25 close and 15 far.
6. **The honest cost:** going when close raises extinction. crMirror causes 13% extinction on seeds 1 to 40; crLook causes none.

### 3. Spend It Once (rebuilt)

1. **Strategy:** race the cheap first box flat out, stop once at the dear second box, build, and go.
2. **Why it wins:** both boxes are marked on the track from the start. The note says a cruiser clears box 1, where falls roll 5%, and a cruiser falls into box 2, where falls roll 40%, while a full lab scrapes across. Two racers start 1050 behind and play exactly that line, so your lead is the only edge you have. It covers one stop, not two.
3. **exp.mjs:** seeds 1 to 40, crSpend 100%, every adversary 0%. Seeds 1001 to 1040, the same.
4. **Grid:** 13 of 13 on both blocks, score 100 everywhere.
5. **Why the adversaries lose:** the go, plan, max-out and rush players never stop at box 2 and fall in, with 38% extinction. The wait and build players can't see box 1's width from where they hold, so they hold the full 15 seconds, and the racers pass.
6. **Lead sweep,** seeds 1 to 20: crSpend wins from a lead of 850 up. Stopping at both boxes (crPrep) wins from somewhere between 1200 and 1400. Looking at both (crLook) wins at 2000. The map's 1050 sits about 200 inside each edge, and you win by about 2 seconds.

### Strongest strategy not in the pool

I found none that beats a lesson strategy. The nearest:

1. Footsteps: always stop and look (crLook), 38% on seeds 1 to 40 and 60% on 1001 to 1040.
2. Spend It Once: stop and build at both boxes (crPrep), 0%. It needs a lead of 1400 or more.
3. Wall: none came close. Stopping back at 270 (build) gets 10%.

### What didn't work

1. Wall: the first plant crept and backed up for 12 seconds, and the racers climbed the wall, because a crash caps a lab and a capped lab pours its build into height.
2. Wall: nudging forward to raise the wall. Walls can't be raised.
3. Footsteps: a rival that only gambles at the box let waiting win. The pouncing rival fixed it.
4. Footsteps: Racer far back but within reach let waiting win. Fixed with a stronger racer, 900 back.
5. Footsteps: stop-and-build at sight 30 saw the box too late to stop. Raised your sight to 50 and added the back-up.
6. Footsteps: going only once the box showed lost to speed-first cruising. Now you build speed while cruising when Racer is close.
7. Footsteps: at build rate 18, waiting won the close case, because it never slowed below the old pounce speed of 20. The threshold is now 35.
8. Spend, round 1: rushing box 1 fell a quarter of the time, and the racers' own falls at box 2 let slow players win. Hence the rebuild with competent racers.
9. Spend: box 2 only 400 past box 1. The racers couldn't brake in time and fell, and you stopped short and spent 5 seconds reversing. 600 fixed both.
10. Spend: box 2 at 1.0 to 1.12 wide. A cruiser only scrapes there, so going won. Now 1.18 to 1.26, where a cruiser falls.
11. Spend: box 1 up to 0.78 wide made the bot scrape there, then get dissolved at box 2 under strikes 2. Now 0.66 to 0.74.

### What isn't shown

1. Bots aren't people. The Wall gives a human about 1.2 seconds, and Spend It Once about 2 seconds of slack. Neither has been played by hand.
2. Spend It Once is all-or-nothing in bot play, because the racers are deterministic and widths barely matter. 100 against 0 means the timing sits on one side of a cliff, not that the effect is huge. A rule change that moved the cliff by 200 would flip it. None of the 13 did.
3. Spend It Once tells the player which box is dear. Real labs don't get that note.
4. The Wall and Footsteps both depend on the lead sitting in a window, and each map picks a lead inside it.
5. Footsteps moves Racer's start inside `track()`, which relies on track running before the labs are placed.
6. 40 seeds per block. A 10-point gap is four runs.

### Rule notes for Cole

1. **Wallstop.** Round 1's Wall was unplayable by hand because the wall only appears once the stopped lab moves off. Trial rule `wallstop:1` fixes that, and the bot result is unchanged with it: 100% against 10% on seeds 1 to 40. I propose the Wall depend on it. I haven't set it on the map.
2. **Walls don't grow.** `installBarrier` sets `stepDone`, so each lab gets one wall per box, even with `wallstop:1`. The rule text says the wall grows with the lab's height. In the code it doesn't. Either the text or the code should change.
3. **Refill** is still strong: labs far behind build up to three times faster. Spend It Once now uses that on purpose, since it is what makes a second stop fatal.

## Round 1 (superseded)

Kept for the record. The tables below are round 1's. Round 2 rebuilt Spend It Once and changed the Wall and Footsteps, and `results.md` and `results-heldout.md` now hold round 2's check.

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
