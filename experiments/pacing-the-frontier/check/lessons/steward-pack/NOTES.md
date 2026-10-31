# Steward in the pack: notes

[[ai gen]] Claude, 2026-10-31. Source: Holden Karnofsky, "Racing through a minefield" (2022).

**Short version:** one map works, and only narrowly. "The Minefield" holds on both seed blocks but holds in only 8 of 13 rule sets. Five other ideas failed, and they are listed below. Status: implemented and verified by bot runs. Nothing here is human_validated.

## The map that holds: The Minefield (`steward-minefield`)

1. **Lesson.** A careful lab can't just stop. It has to stay close enough to take the lead when the reckless labs stumble, and slow enough not to fall with them.
2. **What the player sees at the moment of choice:**
   - Two rushers just ahead, as tall as you, so they hide the road.
   - A hop shows a box's face over them, but never its width.
   - Three boxes follow, each with a low barrier 220 before it. Each box is either narrow or wide, 50/50 per seed. When a rusher crosses or falls, everyone learns the width.
   - Another careful lab, the rival Steward, starts 60 behind you.
3. **Claim.** The steward wins more often than the stop foil, and more often than the blind tail. Score is the smaller of the two win gaps; it needs 20.
4. **Base table, seeds 1 to 40 (score 27, holds):**

| You play | Win | Fall | Extinction |
|---|---|---|---|
| steward | 45% | 10% | 13% |
| stop and fall behind | 18% | 5% | 18% |
| tail blind | 0% | 43% | 18% |
| rush | 8% | 65% | 20% |

5. **Held-out, seeds 1001 to 1040: score 25, holds.** Steward 50%, stop 25%, tail 0%.
6. **Grid:** holds in 8 of 13. It breaks at narrowing 50, sight 70, sight 130, build 18 and strikes 2. On the held-out block the grid holds in only 5 of 13.
7. **Who wins instead.** On seeds 1 to 40:
   - When you stop, the rival Steward wins 21 of 40 races.
   - When you tail blind, you fall, or the rival Steward wins.
   - When you play the steward, the rival Steward still beats you 17 times. Two equal careful brains finish in a fairly random order, so treat this score as noisy.
8. **Tuning note.** I picked the rival's start of minus 60 from five tries on seeds 1 to 40. Some tries moved the stop foil from 0% to 18% wins. The map is sensitive to that start.

## What didn't work, one line each

1. **Two-box minefield with the segments' build posture as the stop foil.** Stopping won 60%, because standing 270 back gives the ideal run-up for a wide box.
2. **Careful pack (two careful labs ahead, one box).** The front careful lab isn't shadowed, so it saw the width early and won every race.
3. **Tall face (a high box face, narrow width).** It killed only the short rushers. Every tall lab won about 80%, including the blind tail.
4. **Ready, not stopped (one box, careful rival).** Nobody won. The rushers scraped across boxes up to about 1.1 times a full lab's reach. The steward stood at the face instead of a run-up's length back, and the careful rival out-ran it.
5. **Cautious crowd (careful labs ahead stop, rushers behind).** The rushers kept pouring points into speed and passed the whole pack before the box. When the careful labs led, they saw the width themselves and won. No posture won any race.
6. **General finding.** I found no box width where a blind rusher falls but a full-height cruiser crosses clean. Speed decides the jump far more than height does.

## Harness blockers (worked around inside this folder)

1. **The shared next-box helper skips a box while a barrier comes before it.** The segments' build posture therefore reached boxes at full speed and fell about 35% of the time. I wrote my own stop foil instead.
2. **The clean-speed search in the segments sim can return a speed that falls.** Jump time isn't monotonic at low speed, so a binary search goes wrong. My posture scans downward instead.

## Rule-change proposals (not made)

1. **Let height buy more clearance.** In the metaphor, height is safety work. Right now speed, which stands for capability, beats it at every width, so a careful lab can never cross what a rusher can't. That makes "careful but close" hard to reward.
2. **Fix the barrier-masking helper in the segments sim.** This is a bug fix, not a rule change. Any careful bot that shares the helper is blind to a box beyond a barrier, which is the opposite of careful.

## What isn't shown

1. These are bots, not people. A person may play the steward far better or far worse than my posture does.
2. The one passing claim is narrow. It leans on sight, narrowing, build rate and strikes, and on where the rival starts.
3. Nothing here is human_validated. Only Cole can grant that.
