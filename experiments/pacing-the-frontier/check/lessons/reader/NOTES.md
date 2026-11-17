# Reader notes: Cole's follow strategy as a bot

[[ai gen]] Written by Claude (map designer session), 2026-11-07. Research only: no shipped map changed. Status: `implemented` and `verified` in the node sim. Not played in the page, and not run under the real key driver.

## The answer

1. Cole's strategy, written as the bot `coleFollow`, is the **safest** bot in the table. It almost never falls. It loses races by being slow, not by crashing.
2. It is **dominant nowhere** among the 12 shipped maps. It ties the best bot on Trailbreaker (100 of 100 vs 98) and beats every non-lesson bot on Second Order. It is second or middling on five maps and loses badly on five.
3. Following breaks when **there is no stop to exploit**: a leader that never stops, a leader whose crash ends everyone's race, or a world where the first crosser keeps most of the gain. A new map, Winner Keeps, shows the last one cleanly: coleFollow 0, blind max-out 95.
4. Cole's own idea, **punishing barriers behind boxes**, did not break following. On Fence Behind, coleFollow won 100 of 100. The follower watches the leader jump each wall, gains height from it, and has time to build.

## How each rule is encoded

The rules and their code are in the header of `reader/maps.js`. In short:

1. **Start at 80% build, even split.** For the first 12 seconds, pace 0.2 with an even split, unless a leader pulls a gap ahead.
2. **Follow at about sight range, roughly 8 lengths.** The bot holds 8 lab lengths (144) behind the nearest lab ahead, never beyond its own sight. "Sight range" and "8 lengths" disagree in the sim (sight starts near 80 and grows to 300+). I chose 8 lengths. Cole should say which he meant.
3. **Spare effort to sight, then speed; height for walls.** Even split until height and speed reach the soft ceiling's knee, then all to sight, then all to speed. A known wall too tall to jump switches to height.
4. **Leader stops: back off, build, wait; leader backs up: sprint past.** The bot waits 8 lengths behind with height and speed at 50/50. When the leader reverses for a run-up, it plans its own crossing at once.
5. **Clear every box by the minimum.** It crosses at the fastest speed that still leaves room to stop before the next wall it cannot jump, and never below the slowest clean speed plus 8%.
6. **In the lead, hold the gap and use sight.** Never faster than it could stop within its sight, and no faster than the lab behind once the lead passes 8 lengths. Sight comes first in the split.
7. **When to sprint.** Once every box is crossed and the road left is short enough to pass the leader at top speed, with margin 1.5.

Two encoding errors were found by tracing and fixed. They were mine, not Cole's:

1. After passing a leader, the sight cap pulled the crossing speed below the clean speed, so the bot scraped (Three Strikes seed 1001, v100 against a needed v130). Fixing it took Three Strikes from 0 to 45 and Only Box from 25 to 60 on tuning seeds.
2. Rule 5 braked for walls it could simply jump. Cole said he switches to height for walls. Fixing it took Fence Behind from 40 to 100.

## Results: plain, seeds 9501-9540 (held out; tuned on 1001-1020)

Win share in percent, 40 seeds each. "Lesson" is each map's own lesson bot.

| Map | Lesson bot | coleFollow | Old follow bot (sp-hs-tail) | Max-out with eyes | Cruiser | Blind max-out |
|---|---|---|---|---|---|---|
| Picket | 93 (tail) | 63 | 93 | 0 | 0 | 0 |
| Long Sight | 70 | 40 | 0 | 0 | 0 | 20 |
| Elbows | 80 | **0** | 0 | 0 | 0 | 3 |
| Steward | 70 | 20 | 58 | 38 | 45 | 8 |
| Takeoff | 83 (max-out) | 13 | 15 | 8 | 8 | 83 |
| Red Box | 100 | **0** | 33 | 23 | 23 | 13 |
| Trailbreaker | 98 (tail) | **100** | 98 | 0 | 0 | 0 |
| Three Strikes | 65 | 25 | 0 | 63 | 63 | 0 |
| Only Box | 80 | 35 | 65 | 35 | 35 | 73 |
| The Ladder | 80 | 18 | 18 | 18 | 18 | 98 |
| Second Order | 73 | 45 | 40 | 40 | 43 | 13 |
| Two Endings | 100 | 40 | 40 | 40 | 40 | 0 |
| Fence Behind (new) | — | **100** | 98 | 0 | 0 | 0 |
| Winner Keeps (new) | — | **0** | 5 | 0 | 0 | 95 |

Fall share for coleFollow is 0 on 10 of the 12 shipped maps (20 on Red Box, 3 on Second Order). Most other bots fall 15 to 100 percent somewhere.

## Results: lagged (crude stress test, same seeds)

`node reader/bench.mjs --lag 1` delays every decision by 0.25 to 0.4 seconds, rounds pace to 5%, and snaps the split to the seven number-key presets. **It is harsher than the real key driver.** The ship manager's faithful port gets the Two Endings lesson bot to 34 of 40; this mode gets it to 0. So read these only as "who degrades gracefully".

Under this lag, coleFollow held up better than the others on the follow maps: Trailbreaker 68 (old follow bot 3), Fence Behind 70 (old follow bot 5), Takeoff 93 (max-out 60). It still fell 100 percent on Second Order and went to 0 on Picket and Only Box. A proper key-driver run needs the ship manager's `hdnode.mjs`.

## Where following breaks, from the math

Each line: the condition in the sim, the evidence, and one sentence checking it against the metaphor.

1. **A leader that never stops.** Rule 4 needs a stop. On Elbows and The Ladder the rivals never stop, so the 12 seconds of building in rule 1 are never paid back, and the share alone does not close the distance. Evidence: Elbows 0, Ladder 18, while blind max-out wins Ladder 98. Metaphor: a frontier lab that never pauses gives a careful follower nothing to overtake; you only catch a leader who stops to check.
2. **A leader whose crash ends everyone's race.** On Red Box a reckless leader rolls a 75% fall chance, and a fall ends the world. Following guarantees the gambler rolls first. Evidence: Red Box 0, world ended 78. Metaphor: when one lab's accident is everyone's accident, letting the reckless one go first is the worst seat.
3. **The first crosser keeps most of the gain.** The follower share is 40% of each ceiling raise by default. With the share at its floor (20%) and big raises per box, being first compounds. Evidence: Winner Keeps, coleFollow 0 and blind max-out 95. Metaphor: if breakthroughs do not leak, second place is not a fast follower, it is just behind.
4. **A box only the first crosser can clear.** The sim works the other way: a crossed box gets narrower and its width becomes public, so it is always easier for the second lab. No layout can make the second crossing harder; it would need a new sim rule. Metaphor: in real life a first mover can lock the door (exclusive compute, rules written after them); this game has no lock, and adding one is a design question for Cole, not a layout change.
5. **The leader's shadow.** A lab ahead blocks your view if your eye is below its top, so following a taller leader at 8 lengths hides what is past it. It did not break following on Fence Behind, because the walls are also in front of the leader, who jumps them in view, and that spills height to the watcher. Metaphor: copying the leader hides the road ahead, but the leader is walking it for you.
6. **The endgame sprint.** With no box left to wait at, rule 7 has to guess when to pass. On Two Endings the lesson bot (lead and read the tower) wins 100 and coleFollow 40. Metaphor: the follower's edge is used up once the last hard decision has been made by someone else.

## The two reader maps

Both are in `reader/maps.js`, built only into `reader/page.html` (`node build.mjs --only campaign+ship+reader`). They never join the shipped campaign list.

1. **Fence Behind**: Trailbreaker's road (a tall Pioneer goes first over four wide boxes), plus a wall 50-70 past each box, heights 100, 115, 130, 145. Result: following still wins (40 of 40 seeds).
2. **Winner Keeps**: five narrow boxes, rising, each raising the ceiling by 30, follower share 20%, a racing rival that never stops. Result: following loses (0), blind max-out wins (95).

## What this does not show

1. No human played coleFollow or the reader maps. It is a bot reading of Cole's words, and it differs from him at least in rule 2's gap and in how it judges "diminishing returns".
2. The lag numbers come from a crude emulation, not the real key driver.
3. Two tries per map, as the rules ask. A third Fence Behind layout (walls hidden behind a shade box) was not tried.
4. Seed blocks: tuning 1001-1020, reported 9501-9540. Every table cell is 40 seeds, so one seed is 2.5 points.

## Reproduce

```
node build.mjs --only campaign+ship+reader
node reader/bench.mjs --map picket,long-sight,elbows,steward,takeoff,red-box,trailbreaker,three-strikes,only-box,ladder,second-order,two-endings,fence-behind,winner-keeps --start 9501 --n 40
node reader/bench.mjs --map fence-behind,winner-keeps --start 9501 --n 40 --lag 1
node reader/trace.mjs three-strikes coleFollow 1001 2
```
