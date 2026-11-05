# Strike Them Out: notes

[[ai gen]] Written by Claude, 2026-11-05. Draft v5. Bot play only; nobody has played it by hand yet. Every number here comes from a run I did at chill 0 with bots at skill 100. Shares are bot outcomes over a block of seeds, not probabilities.

## How to play

Serve the check folder with any static server and open lessons/strikeout/page.html with map=strike-out and chill=0 in the query, for example lessons/strikeout/page.html?map=strike-out&chill=0. Add seed=N to replay one seed. Keep chill mode off; all the numbers below are for chill 0. To rebuild the page, run node build.mjs --only campaign+showcase+strikeout from check/lessons. To check it, run node check.mjs --only strikeout --map strike-out, and add --heldout for the held-out block. The --map flag is needed; without it check.mjs crashes on a campaign map that has no claim.

## Design

The dynamic: a lab ahead of you and at least as tall as you hides the road past it. The Gambler is low and never builds sight. So if you are in front of it and taller, it cannot see a hedge behind you. It runs on, passes you, sees the hedge too late, crashes and takes a strike. Three strikes and it is dissolved.

The hidden fork is a coin per seed and is never announced. The red box at the end is shallow, about 60 wide, or deep, about 105 wide. Its face is public but its width is not. You learn the width only by getting close enough, and tall enough, to see across. When the box is shallow, the Gambler's bet pays and it may simply race you. When it is deep, a Gambler that arrives alive bets on it anyway, and a fall there rolls 75 in 100 to end the world for everyone.

The rivals:
- The Gambler floors it and builds nothing while running. It slows only for a hedge it can see, never for road it cannot see. It bets blind at a box, and it starts with one strike already; its pips show.
- Steady is the clock. It runs only as fast as it could stop within the road it sees, and it stops and builds for every hedge. It never crashes and never falls.

The lever is where you stand and when. Be ahead of the Gambler, taller than it, and within its sight as it comes to each hedge. That costs time. Steady catches up while you wait. Once Steady and you have the same hedge in view while in sight of each other, the hedge is public and the trap is gone. The last hedge, 185 high, is public from the start, so nobody can be trapped there, and a lab that never looks (max-out) runs into it.

The stake is goal 3, nobody ends the world, against goal 1, finish first. Strike the Gambler out and you can still lose to Steady. Race on and you can win the race and still lose the world.

The dials, all in P in maps.js:
- Hedges 110, 135 and 160 high at 600, 1450 and 2300, plus the public hedge of 185 at 2750. Each hedge moves up to 60 along the road and up to 8 up or down by seed.
- Boxes at 950 and 1850 that lift the ceiling.
- The red box sits 350 past the last hedge, with rise 110. It is shallow at 60 or deep at 105, plus or minus 8, and deep with chance 0.6. Its fall odds are 75.
- The Gambler starts 60 behind you with one strike, and Steady starts 200 behind.
- The soft ceiling uses n 3 for every meter.

## What to watch for

Watch the first two hedges. Get there ahead of the Gambler, stop short of the hedge, and build height until you are taller than the Gambler. Then wait. The Gambler comes up behind you, cannot see past you, passes and hits the hedge. Its pips fill. The first screenshot shows the trap set at hedge 2. The second shows the strike that follows a second later.

The decision moment is the wait itself. Every second you stand at a hedge, Steady closes in. If Steady gets close enough to see you while you both see the hedge, the hedge turns public, and the Gambler will see it and stop. So you are choosing between one more trap and getting away before Steady passes you. A second, quieter decision comes at the red box. Once the Gambler is gone, you still have to judge the width by getting close and tall, and Steady may get there first.

The third screenshot shows the end of a deep seed. You and Steady are at the red box, the box shows 110 wide and public, and the Gambler is already dissolved.

## Bot numbers

There are four strategies: skHerd, the lesson bot, herds the Gambler into hedges; skMax races with its eyes open; maxout floors it and maxes everything; cpRead is the campaign reading bot.

Tuned on seeds 1 to 40:
- skHerd wins 73% (69% on shallow seeds and 74% on deep ones). The world ends in 3%, and the Gambler is dissolved in 63%. The Gambler falls in 8%. Of the 40 races, you won 29, Steady won 10, and 1 ended the world. Races last 43 to 61 seconds, 50.8 on average.
- skMax wins 43% (62% shallow, 33% deep). The world ends in 25%, and the Gambler is dissolved in 25%. Races last 41 to 60 seconds, 48.4 on average.
- maxout wins 20%. The world ends in 8%, and maxout dissolves itself in 33%. Races last 43 to 66 seconds.
- cpRead wins 0%. The world ends in 3%, and it dissolves itself in 20%. The Gambler is dissolved in 85% of its races, because cpRead stands still so much.

Held out, seeds 1001 to 1040:
- skHerd wins 75% (79% shallow, 73% deep). The world ends in 5%, and the Gambler is dissolved in 63%. Of the 40 races, you won 30, Steady won 8, and 2 ended the world. Races last 43 to 61 seconds, 52.1 on average.
- skMax wins 50% (79% shallow, 35% deep). The world ends in 23%, and the Gambler is dissolved in 23%.
- maxout wins 13%, and the world ends in 13%. It dissolves itself in 20%.
- cpRead wins 0%. The world ends in 3%, and it dissolves itself in 23%.

No race timed out on either block.

The check.mjs claim is that herding ends the world less often than racing with eyes by at least 10 points. It scores 22 on the tuned block and 18 held out, so it holds. In the max-out check, the lesson strategy beats max-out by 53 points tuned and 62 held out.

A disclosure on the held-out block: I looked at the held-out numbers three times during late tuning, for the v4 setup, for a deep chance of 0.5, and for the final setup. The changes in between were tuned on seeds 1 to 40 only. The held-out block is still not perfectly clean, so judge seeds would be the real test.

## Solvability on the deadly variant

I picked three deep seeds where the default skHerd loses:
- seed 4, where the box is 106 wide and Steady wins
- seed 5, where the box is 103 wide and the world ends
- seed 30, where the box is 97 wide and Steady wins

For each, I swept 160 herding setups. Each setup combined a pace, a build split and a choice of which hedges to ambush at. On seed 4, 72 of the 160 setups win. On seed 5, 82 win, and on seed 30, 101 win. Forty setups win all three.

One of those 40 is pace 0.8, build split 20, 40, 40, ambush at the first hedge only, and wait 15. It wins seed 4 at 58.6 seconds, seed 5 at 57.0 and seed 30 at 58.0, and the Gambler is dissolved each time. Run over seeds 1 to 40, that same setup wins 70% and dissolves the Gambler in 90%. So on the deadly variant there is always at least one way to win on these seeds, and it goes through striking the Gambler out.

## What did not work

- A Gambler with sight 30 could barely see anything, so it crashed on its own and herding meant nothing.
- A faster Gambler was ahead of you all race, so you could only herd it by being faster still. There was no trade.
- I first assumed that a wall crash gives a strike. In step mode it does not. A wall crash is only a bounce and a speed cap, so strikes come only from track hedges and from scrapes.
- With no starting strike, three crashes was too many to arrange in one race, and the Gambler was almost never dissolved. Starting it at one strike fixed that.
- A fourth hedge that was not public gave free herding. Even skMax dissolved the Gambler in 88% of races, so the choice vanished. Making the last hedge public fixed this, and it also stopped blind max-out from winning.
- Before the public hedge, blind maxout won 88 to 100% by flying over everything late in the race.
- A deep box of 115 caused 20-second standoffs at the box, so I cut it to 105.
- Steady first ran on the lead-taking posture. On seed 3 it deadlocked and the race timed out at 117 seconds. While Steady stood waiting, the catch-up multiplier grew its wall faster than anyone could catch up. A version that stopped at every box face was too slow. The current Steady plans straight across once it knows the width.
- The herding bot at first waited at the public hedge too, for nothing. It now skips public hedges.

## Rule-change proposals

These are proposals only; I changed no mechanics.
1. Let a wall crash in step mode give a strike, as a track-hedge crash does. Players will expect herding into the wall to count, and right now it silently does not.
2. Show or log the moment a hedge becomes public, the way the page already logs it for gaps. Right now a trap can be spoiled by mutual sighting with no sign on screen, and a player will not know why the Gambler stopped.
3. Stop a standing laggard's wall from outgrowing everyone through the catch-up multiplier. That is what caused the 117-second deadlock. Steady's new posture works around it, but a human who stands still could hit the same thing.

## Open problems

- skMax wins 50% held out, which is borderline for "racing with eyes loses most races".
- The herding bot also wins more often than the racer, so the trade between saving the world and winning is weaker than it should be. Saving the world and still losing does happen, since Steady wins about a fifth to a quarter of herding races, but herding is not costly enough.
- Traps get spoiled by mutual sighting with nothing on screen to say so. See proposal 2.
- cpRead, the campaign bot, crashes into hedges under the soft ceiling and wins nothing. That says more about cpRead than about the map, but a player used to the campaign may play like it.

## What is not shown

- No human has played it.
- Chill 1 is not measured.
- Ghost replay is not checked.
- The bots are deterministic at skill 100. Variation across seeds comes only from the track jitter, the fork coin and the fall rolls.
- Mobile is not checked.
- Nothing in the game explains why the Gambler starts with one pip already filled.
- The deep fall odds of 75 are a map dial, not an estimate of anything.
