# Steward in the pack: notes

[[ai gen]] Claude, 2026-10-31. Source: Holden Karnofsky, "Racing through a minefield" (2022).

## Round 2

[[ai gen]] Claude, 2026-10-31. Bot play only. Status: implemented and verified by bot runs. Nothing here is human_validated.

**Short version.** The Minefield now clears the bar in bot play. The lesson wins 65% against the best adversary's 40% on seeds 1 to 40, and 55% against 33% on seeds 1001 to 1040. There is no second map; three tries failed. One honest catch: what wins is how you handle a box, not how close you follow.

### 1. The Minefield (`steward-minefield`)

1. **Strategy, in one sentence.** Stay in the race a stopping distance behind the leaders. At a box nobody has sized, stand a run-up short and build. Go the moment someone shows you the width, and if nobody is left to show you, creep up and look yourself.
2. **Why it wins: what the player sees at the moment of choice.**
   - Two rushers lead. Eager, another careful lab, runs right on their heels. You can't see past them, but a hop shows you a box's face.
   - Six boxes in ten are wide. A rusher who meets one falls, and the fall tells everyone the width.
   - A wide box is a little wider than even a full lab clears clean, so a careful lab takes one scrape there. A narrow box, everyone clears.
   - Tail the pack blind and you fall in with the rushers. Park and build, and Eager gets there first. Wait for someone to show you after the rushers are gone, and you wait 15 seconds for nothing.
3. **exp.mjs line.**
   - Seeds 1 to 40: lesson 65%. Best adversary: build, 40%. Margin plus 25.
   - Seeds 1001 to 1040: lesson 55%. Best adversary: adv-hs-wait, 33%. Margin plus 22.
4. **Rule grid, lesson against the best adversary (exp.mjs with each rule).**
   - The lesson is ahead in 11 of 13 rule sets on both seed blocks.
   - It's ahead by 15 or more in 9 of 13 on seeds 1 to 40, and in 8 of 13 on seeds 1001 to 1040.
   - Weak spots, first block then second: sight 70 (plus 3, minus 5), sight 130 (0, plus 5), build 10 (minus 2, plus 7), strikes 2 (plus 30, 0).
5. **The map's own claim (check.mjs).** The steward beats parking to build, and beats tailing blind, by at least 15 points. Score 25 on the first block and 22 on the second. It holds in 10 of 13 rule sets on both blocks and breaks at sight 70, sight 130 and build 10.
6. **What changed from round 1.** All are structural except the posture fix.
   1. The fourth lab is Eager, a careful lab running 45 behind the leaders. Round 1's fourth lab was a copy of the lesson strategy. That mirror match turned results into a coin toss.
   2. Wide boxes now run from 1.02 to 1.10 of a full lab's clean reach (round 1: 1.08 flat). Narrow boxes run from 0.60 to 0.80 (round 1: 0.85). Rushers clear the narrow ones and fall into the wide ones.
   3. Six boxes in ten are wide, up from five.
   4. Rushers start lower: 15 sight, 35 height, 45 speed, building mostly speed.
   5. Posture fix: once the width is known, the steward crosses flat out. Round 1 crossed at the slowest clean speed. A box can widen again when a rusher falls, and round 1's steward fell in.
   6. The lesson follows 250 behind the front instead of 45.
   - Kept from the version Cole enjoyed: three boxes, the barriers, hopping to look, two rushers ahead, and falls that roll 8%.

### 2. Strongest strategy found outside the pool

1. **Sight lurker** (`steward-pack-lurkv`). It cruises at 0.7 pace building only sight, floors it once sight is full, and never hops. At boxes it acts like the steward.
   - Seeds 1 to 40: 55%, against the lesson's 65%.
   - Seeds 1001 to 1040: 60%, against the lesson's 55%. It beats the lesson on the held-out block.
   - It shares the steward's box handling, which is the part that wins. The adversary will probably find something like it.
2. **Follow distance barely matters.** The same brain wins 48% and 50% at 45 behind, 65% and 55% at 250, and 53% and 35% at 500. Only tailing blind, with no hopping, collapses: 8% and 10%.

### 3. Tried, didn't work (one line each)

1. **Keeping round 1's clone of the lesson as the rival.** Small changes swung the lesson from 13% to 70%.
2. **A parking builder as the fourth lab.** It beat the close steward almost every race, 0 to 10%.
3. **Wide boxes a full lab clears clean (0.92 to 1.0).** Every careful strategy tied, so there was no margin.
4. **Fixed-size boxes with slow rushers.** A speed-heavy waiter overtook them and won about 100%.
5. **Fast, fragile rushers.** The close steward ran flat out behind them, built nothing, and lost to max-out and the waiters.
6. **Rushers that scrape through and die on their third strike.** They survived too often, and everything tied.
7. **A fast careful "Racer" rival.** It was too weak to pressure anyone, and every careful strategy tied.
8. **Map 2, "Lead the Way."** You lead, your crossing narrows each box for the rushers behind, and falls roll high. The rushers passed anyway, or a speed waiter won. It never did better than a tie.
9. **A pace-capped steward** that cruises at most 0.75 to build more. It did no better.
10. **Diagnostic only, not a map change: switching off the catch-up build bonus.** On a tuning variant, the close steward did worse (23%). So catch-up isn't what punishes staying close, and I'm not proposing to change it.

### 4. What isn't shown

1. **Nobody has played round 2.** Cole found round 1 fun. Round 2 changes the box widths, the rival and how often boxes are wide, so it needs a fresh play before anyone calls it fun.
2. **The lesson is narrower than its source.** The map shows: don't park, don't tail blind, keep moving, and look for yourself. It does not show that following closer beats following further back, because 45, 250 and 500 aren't well separated.
3. **The held-out block isn't clean.** I picked this layout from six close variants after seeing both seed blocks. The judge's own seeds are the clean test.
4. **Noise.** Each figure is 40 seeds, so a gap under about 16 points could be chance. Extinction, 13% to 20%, and a rusher win (3 seeds in 40) cap every strategy near 80%.
5. **Known risk.** Wide boxes cost even a careful lab one scrape, so the steward always takes a strike there.
6. **Fragile rules.** It's weak at sight 70, sight 130 and build 10.

## Round 1

**Round 1 short version:** one map works, and only narrowly. "The Minefield" holds on both seed blocks but holds in only 8 of 13 rule sets. Five other ideas failed, and they are listed below. Status: implemented and verified by bot runs. Nothing here is human_validated.

### The map that held in round 1: The Minefield (since replaced by round 2)

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

### What didn't work, one line each

1. **Two-box minefield with the segments' build posture as the stop foil.** Stopping won 60%, because standing 270 back gives the ideal run-up for a wide box.
2. **Careful pack (two careful labs ahead, one box).** The front careful lab isn't shadowed, so it saw the width early and won every race.
3. **Tall face (a high box face, narrow width).** It killed only the short rushers. Every tall lab won about 80%, including the blind tail.
4. **Ready, not stopped (one box, careful rival).** Nobody won. The rushers scraped across boxes up to about 1.1 times a full lab's reach. The steward stood at the face instead of a run-up's length back, and the careful rival out-ran it.
5. **Cautious crowd (careful labs ahead stop, rushers behind).** The rushers kept pouring points into speed and passed the whole pack before the box. When the careful labs led, they saw the width themselves and won. No posture won any race.
6. **General finding.** I found no box width where a blind rusher falls but a full-height cruiser crosses clean. Speed decides the jump far more than height does.

### Harness blockers (worked around inside this folder)

1. **The shared next-box helper skips a box while a barrier comes before it.** The segments' build posture therefore reached boxes at full speed and fell about 35% of the time. I wrote my own stop foil instead.
2. **The clean-speed search in the segments sim can return a speed that falls.** Jump time isn't monotonic at low speed, so a binary search goes wrong. My posture scans downward instead.

### Rule-change proposals (not made)

1. **Let height buy more clearance.** In the metaphor, height is safety work. Right now speed, which stands for capability, beats it at every width, so a careful lab can never cross what a rusher can't. That makes "careful but close" hard to reward.
2. **Fix the barrier-masking helper in the segments sim.** This is a bug fix, not a rule change. Any careful bot that shares the helper is blind to a box beyond a barrier, which is the opposite of careful.

### What isn't shown

1. These are bots, not people. A person may play the steward far better or far worse than my posture does.
2. The one passing claim is narrow. It leans on sight, narrowing, build rate and strikes, and on where the rival starts.
3. Nothing here is human_validated. Only Cole can grant that.
