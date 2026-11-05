# Adversary b: close-race and steward-pack [[ai gen]]

Claude, 2026-10-31, round 2. Bot play only, 40 seeds per block, via exp.mjs on builds made with `--only`. Status: implemented and verified by those runs. Nobody has played these by hand.

Win rates are given as seeds 1 to 40, then seeds 1001 to 1040.

## Per map

1. **Footsteps: beaten.** My best is y-pace. Stay about 25 ahead of the Racer and never drop below 36. Build height first, then speed, and floor it when both are full. Because you are taller, you hide the box from the Racer, so it never floors. It wins 100 and 100. The lesson strategy, check the mirror, wins 70 and 80. It loses every seed where the Racer is close and the box is wide: it goes at height 50 and falls. Would a person find it? Plausibly. "Keep just ahead and build as you go" is a natural line. Adversary a's x-tall60 also wins 100 and 100 here.

2. **The Leader's Wall: the lesson holds, but its lever is timing, not distance.** My best is y-look. Stop 200 short and fill height, then creep in to see the far edge. It wins 100 and 100, the same as the lesson strategy, plant at the edge. It wins through the same wall, because creeping in counts as moving off. The best play that never makes the wall is adversary a's x-se-ready, at 55 and 63. Stopping and building without moving off early loses. I ran the lesson's own stop-and-build bot, crPrep, at stand distances from 120 to 320, seeds 1 to 40 only. Every distance won 10, except 255, which won 28. So what wins is moving off before the racers arrive, not where you stop. The map's question, "Where do you stop?", points at the wrong thing.

3. **Spend It Once: beaten.** My best is y-run40: max-out with the Run slider at 40. Cruise at 40% putting half into height and half into speed, then floor it once both are full. It never stops and never looks. It wins 100 and 100, the same as the lesson strategy, spend it once, at 100 and 100. In a traced run it crossed box 2 at 19.3 seconds, against 22.6 for the lesson strategy. In scratch runs, Run 20 to 40, 50 and 55 also won 100 and 100, and Run 45 won 83 and 75. My y-prep and y-pace win 100 and 100 here too. Would a person find it? Very likely, because it is max-out with one slider lowered. The lesson's claim survives only because the pool's max-out runs at 70%. At Run 60 it wins 3, and at 70 it wins 0.

4. **The Minefield: a tie.** My best is y-prep. Ignore the pack and cruise at 90%, never faster than you can stop on road you have seen. Stand one run-up short of every box, fill height then speed, and go. It wins 68 and 60. The steward wins 65 and 55, and adversary a's x-steady wins 60 and 60. The gaps are within noise on 40 seeds. About 6 seeds in 40 can't be won by anyone: a rusher wins or causes extinction. Things that did worse, all on both blocks:
   - Waiting for a scout: 48 and 55.
   - Deferring to Eager: 13 to 45.
   - Distrusting the hop peek: 48 and 43.

## Cheats and bugs in lesson postures

1. **No cheats found.** None of the four lesson strategies reads hidden widths, the seed, or rivals' future moves. Details:
   - Check the mirror reads the distance to the nearest lab behind, from the minimap. The minimap pins labs behind the start line to the start, so the bot's exact distance can differ a little from what a player sees. That's borderline, not a cheat.
   - Plant at the edge reads an internal "wall planted" flag. It matches a wall you can see on the canvas.
   - Spend it once reads the fall odds, which the box line states.
   - The steward uses shadows, the hop peek, box faces and widths only once they're known.
2. **Bug, not a cheat: the steward's creep.** After 2 seconds standing with nobody ahead, it creeps to 8 from the face at a quarter of top speed. From there the bot's jump fires at low speed and it falls in, even at narrow boxes. Eager fell at a narrow box 2 on seed 5. This hurts both the lesson strategy and the rival Eager. It is the same low-speed jump problem build.mjs already fixed for Build.
3. **Wording, not a cheat: the Leader's Wall.** Plant at the edge depends on knowing the 260 rule and on moving off quickly. The look text states both.

## Where things are

- My strategies: `adversary/b.js`, postures `y-pace`, `y-look`, `y-run40`, `y-prep`.
- Check the mirror: `close-race/maps.js` lines 18 and 45 to 48. Plant at the edge: lines 70 to 79, flag read at line 73. Spend it once: line 99.
- The steward's creep: `steward-pack/maps.js` lines 59 to 62.
