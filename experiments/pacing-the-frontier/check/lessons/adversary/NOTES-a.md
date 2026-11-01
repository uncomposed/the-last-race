# Adversary A: see-early and small-risks

Written 2026-10-31. [[ai gen]] Status: bot play only, run with the harness on seeds 1 to 40 and 1001 to 1040. Not human validated.

Short version: I beat or tied the lesson on four of the five maps. Only Six Unknown Boxes holds, and only just.

## Per map

Win rates are mine against the lesson's. The first pair is seeds 1 to 40, the second is 1001 to 1040.

1. **Too Late to Brake** (see-early). Best: stand still at the start, fill height and then speed, then floor it. Never put a point into sight, never look at a box. Result: 100 against 100, and 100 against 100. A tie. A person would find this; it is the first thing anyone tries after maxing out. The lesson wins because it reaches the box full, not because it looks.
2. **The Box Behind the Box** (see-early). Best: the same fill-then-floor strategy. Result: 100 against 98, and 100 against 88. I beat it. A person would find this easily.
3. **Still in the Air** (small-risks). Best: floor it, and jump each barrier early so you land just past it, then jump the box fresh at full speed. Never slow down. Result: 100 against 93, and 100 against 95. I beat it. A person who jumps by hand might well find early jumping. It needs chill mode off, because chill mode hides the Jump button.
4. **The Last Box** (small-risks). Best: cruise at 85 percent while filling height and speed, jump barriers early, then floor the last box and take the scrape. Result: 100 against 98, and 100 against 95. I beat it. But I am still using the lesson's own last-box move. The same strategy with a clean last crossing wins 0 on both blocks. So the barrier half of the lesson can be replaced, and the last-box half holds.
5. **Six Unknown Boxes** (small-risks). Best: never look at a width. After each box, brake, stand and refill height. Then run up to a fixed speed and cross blind, accepting scrapes. At speed 110: 55 against 60, and 45 against 50. At speed 115: 48 against 60, and 53 against 50. No single speed beats the lesson on both blocks, so the lesson holds narrowly. A person could find this, but would need to settle on the right speed.

## Tried and failed

1. Never stopping and filling on the move instead: lost on the wide boxes.
2. Speed instead of height on Six Unknown Boxes: won 0.
3. Free-riding, which means waiting at each box for a rival to cross first. The rivals never come. They stop behind the waiting lab, and every race ends with no winner after everyone stands still. That is a stall exploit worth knowing about, though it never wins.

## Lesson postures that read what a player cannot see

The player sees only the map title and its question before the race. The track note, which lists every width on Six Unknown Boxes, shows only after the race. So I did not count the note as visible.

1. **see-early, box chain.** It checks whether a second box exists, and where, from anywhere on the track, before that box is in view. It then changes how it approaches box 1. That is exactly the question The Box Behind the Box asks the player. This is a real cheat, though the lesson still loses there.
2. **see-early, the line.** It reads the box's position to decide whether a barrier it can see is a line in front of a box. It does this before checking that the box is in view. This one is mild.
3. **small-risks, paced braking.** It reads the next barrier's position and height, and the box behind it, with no check that the barrier is in view. It starts braking from that. The question tells the player each barrier has a box behind it, but not where the barrier is or how high. I did not measure how often it brakes before the barrier is visible.
4. **small-risks, barrier first.** It reads the barrier's position the same way, with no visibility check.
5. **small-risks, careful plan.** This is used by the Last Box lesson. It reads the box width to choose between flooring it and planning a crossing, with no check that the width has been seen. I did not measure how often the width was unseen at that moment.
6. **Clean.** The Last Box's box count is given by its question. Its last-box scrape check, and the whole Six Unknown Boxes lesson, only use widths once they are seen.

## My own postures

1. My jump strategies read a barrier only once it is in view.
2. Six Unknown Boxes uses the box count, which its question gives.
3. Fill-then-floor first asked whether another box was ahead, which a player is not told on the see-early maps. I removed that. The win rates were unchanged on all four see-early runs, and the numbers above are from the cleaned version.

## Line references

- Box chain: `see-early/maps.js` line 10, used at lines 40 to 50 (`seChain`, `SGP.seeearly`)
- The line: `see-early/maps.js` line 58 (`seLine`), and the same read at line 25 (`seStopX`)
- Paced braking: `small-risks/maps.js` lines 17 to 25 (`srNextPair`, `srPaced`)
- Barrier first: `small-risks/maps.js` line 30 (`srBarFirst`)
- Careful plan: `small-risks/maps.js` line 83 (`srPcare`, the `sgClearAt` call)
- Postures: `adversary/a.js`, named `x-fill`, `x-hop`, `x-hopfast`, `x-hopclean`, `x-steady110`, `x-steady115`, `x-steady120` and `x-se-ready`
