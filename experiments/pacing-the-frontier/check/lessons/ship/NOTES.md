[[ai gen]]

# Ship maps: notes (2026-11-06)

Status of every map: `implemented`. The numbers below are bot play, so they are guard rails, not evidence the maps are good. No human has played these builds. `human_validated` is Cole's call.

All numbers use auto-jump on (`K.chill=1`), which is what the shipped page sets by default. The lesson page `ship/page.html` opens with auto-jump off, so a browser check there must turn it on. With it on, the page and the bench agreed on the three maps I compared (20 seeds each: 20/20 vs 100%, 18/20 vs 90%, 17/20 vs 85%).

Tune block: seeds 1001-1040. Held-out blocks: 9001-9040 (first check, before the last changes), 9101-9140 (The Picket only), 9201-9240 (check before the last redesigns, run once), 9301-9340 (The Only Box, Second Order and The Picket after their redesigns, and the key driver on ten maps, run once).

## Results, seeds 9201-9240

This check ran once, before the last redesigns of The Only Box, Second Order and The Picket. Those three have new numbers in the next section; the other nine were not changed. Campaign order is the order below. "Max-out with eyes" is `sp-hs-eyes`, "cruiser" is `sp-hs-slow`, "blind max-out" is `maxout`. The rail says the first two should lose most races. "Times" is the number of distinct finish times across the 40 seeds.

| Slot | Map | Strategy in a sentence | Bot | Win | Max-out with eyes | Cruiser | Blind max-out | Times |
|---|---|---|---|---|---|---|---|---|
| 1.1 | Three Strikes | Clear what you can, stop for the rest, scrape only the last box | `spLate` | 73 | **65** | **63** | 0 | 34 |
| 1.2 | Long Sight | Split points evenly, sight included, and do not outrun your sight | `sp-even-eyes` | 75 | 18 | 10 | 13 | 35 |
| 1.3 | Elbows | Buy speed, floor it, trust your reactions | `sp-s-bold` | 88 | 0 | 0 | 3 | 13 |
| 2.1 | The Steward | Split points evenly and hold a steady pace | `sp-even-slow` | 73 | 45 | 48 | 10 | 36 |
| 2.2 | Takeoff | Keep buying height through the pebbles, though nothing asks for it yet | `maxout` | 78 | 15 | 15 | 78 | 22 |
| 2.3 | Red Box | Stay in front of the gamblers so they run blind into walls | `spBait` | 100 | 30 | 30 | 8 | 30 |
| 3.1 | Trailbreaker | Let Pioneer go first and cross behind it | `sp-hs-tail` | 93 | 0 | 0 | 0 | 27 |
| 3.2 | The Picket | Buy mostly height, get in front, and hold your pace near the Foreman | `spBait` | 68 | 23 | 25 | 0 | not read |
| 3.3 | Two Endings | Stop at the tower, look over it, then decide | `finLead` | 100 | **58** | **58** | 0 | 2 |
| Daily 1 | The Only Box | Build at a steady pace: a bet on the width | `sp-even-slow` | 68 | **68** | **68** | 33 | 4 |
| Daily 2 | The Ladder | Lead from the first step and never stop | `sp-hs-bold` | 88 | 5 | 5 | 100 | 11 |
| Daily 3 | Second Order | Slow for the towers and look behind them | `sp-hs-eyes` | 68 | **68** | **68** | 33 | 28 |

Bold marks a rail not met.

**The Picket was near the line at this check; its layout changed after, see the next section.** Its intended bot, `sp-h-tail` (sit behind the Foreman), won 55 here, 80 on 9101-9140 and 53 on 1001-1040. The 68 is `spBait`, the best of 15 bots on this block, so it is flattered by being picked after the fact. Treat this map as about 60, not safely over. This is the first campaign-completion risk to check by hand. A loss only retries the map, so it should not block a player.

**One redesign each, at this point.** Three Strikes got a stronger Ledger, The Only Box a real sprinter, Second Order a rival that buys sight. Max-out with eyes still wins all three. Second Order did improve in the tune block: the reckless rival no longer decides it by dice (world-ended share fell from 28-33 to 15), and blind max-out fell to 33. Three Strikes opens the campaign on purpose, so max-out working there becomes the habit that Long Sight (18), Elbows (0) and later maps break.

**Two Endings was not retuned against this bot,** on the director's instruction, because Cole has played it. Max-out with eyes wins 58. That is his call.

Earlier block, 9001-9040, before these changes: The Picket 55, Long Sight 63, Elbows 95, The Steward 75, Takeoff 75, Red Box 100, Trailbreaker 100, Three Strikes 80, Two Endings 100, The Only Box 63, The Ladder 88, Second Order 65.

Unconfirmed reports from the ship manager, from a few hand runs:
1. The Foreman stalling after being passed: now diagnosed and fixed, see the softening section. What was seen: bots did not reproduce it: in 200 bot races on 1001-1040 it never stood still for more than 6 seconds. The key driver did, on 2 of seeds 1-14 of The Picket. On seed 1 the Foreman takes a strike, then sits at the wall at x 951, height 118, from about t 20 to t 299 with its meters stuck at 30/80/76. Its top height with a jump is 114. If you then dissolve, the race does not end until the 300 second limit. 
2. Long Sight won in 41.9 s by standing about 18 s with lowest sight, then flooring it. Not checked. If it holds, it skips the sight lesson.

## The last redesigns, seeds 9301-9340

Each was redesigned from why max-out won, tuned on 1001-1040, then run once on 9301-9340. Blind max-out was read afterwards from a second run of the same seeds, with nothing changed.

| Map | Block | Strategy in a sentence | Bot | Win | Max-out with eyes | Cruiser | Blind max-out |
|---|---|---|---|---|---|---|---|
| The Only Box, before | 9201-9240 | Build at a steady pace: a bet on the width | `sp-even-slow` | 68 | **68** | **68** | 33 |
| The Only Box, after | 1001-1040 (tune) | Run flat out from the line, stop at the box, and take the time it needs | `spFirst` | 85 | 58 | 58 | 48 |
| The Only Box, after | 9301-9340 | same | `spFirst` | 80 | 48 | 48 | 53 |
| Second Order, before | 9201-9240 | Slow for the towers and look behind them | `sp-hs-eyes` | 68 | **68** | **68** | 33 |
| Second Order, after | 1001-1040 (tune) | Cross each tower only as fast as you must, so you can stop on the far side | `spLook` | 83 | 63 | 63 | 28 |
| Second Order, after | 9301-9340 | same | `spLook` | 75 | 45 | 43 | 15 |
| The Picket, before | 9201-9240 | Buy mostly height, get in front, and hold your pace near the Foreman | `spBait` | 68 | 23 | 25 | 0 |
| The Picket, after | 1001-1040 (tune) | Follow the Foreman through the walls, buying height and speed, and pass it on the long run to the finish | `sp-hs-tail` | 85 | 20 | 18 | 0 |
| The Picket, after | 9301-9340 | same | `sp-hs-tail` | 88 | 18 | 20 | 0 |

**Why max-out won, and what changed.**
1. The Only Box: Tail's own fall decided the race, whatever you did, so every line tied. Now Tail starts 500 back and is faster, the box is farther down the road with a small rise, and you can win only by reaching it with room to stop. Tail runs blind into a box 100 or 130 wide and falls, as the frame shows. `sp-s-eyes` and `sp-vs-eyes` also win 80 on 9301-9340: they buy speed and read the road, which is the same idea. World-ended is 20 for all of them, the fall odds of the rival.
2. Second Order: a bot could carry its speed over a tower and still clear what was behind. Now the box behind is 110-124 wide with rise 40, close enough that charging over the tower leaves no room to stop and build, and Scout starts 200 back. The bot that crosses only as fast as it must beats max-out with eyes by 30. Its fall share is still 18 on 9301-9340.
3. The Picket: I changed the layout rather than the sentence. The run-out went from 160 to 450, so the follow line has room to pass. It wins 88 on 9301-9340. The nearest earlier line, `sp-h-tail`, won 55 on 9201-9240 before the change and 58 on 9301-9340 after it. `spBait` still wins 75 on the tune block and was not in the held-out run, so bait is a second answer for bots. Under key lag it dissolves (0-2 of 20).

## Can a person win? Scripted keys with human lag (2026-11-06)

`keydriver.js` plays the built page with real key events: a decision every 250-400 ms, reaching the keys 250-400 ms later, nearest number-key split, pace by Arrow Up and Down, floor and brake by held Arrow Right and Left. This is not a person. It reads exact game numbers, and I stepped time at 1/60 s because the pane is hidden. It answers one question: do these lines survive human timing? Status stays `implemented`.

| Map | Bot's line, lag only, seeds 1-20 | With a person's margins, seeds 1-20 | Frame |
|---|---|---|---|
| Three Strikes | 1 | 11 | `frames/three-strikes.jpg` |
| Elbows | 17 | 18 | `frames/elbows.jpg` |
| The Steward | 5 | 19 | `frames/steward.jpg` |
| Takeoff | 17 | 17 | `frames/takeoff.jpg` |
| Red Box | 0 | 17 | `frames/red-box.jpg` |
| Trailbreaker | 0 | 15 | `frames/trailbreaker.jpg` |
| The Ladder | 14 | 15 | `frames/ladder.jpg` |
| The Only Box | 5-7 | 14 | `frames/only-box.jpg` |
| Second Order | not separated | 15 | `frames/second-order.jpg` |
| The Picket | not separated | 6 | `frames/picket.jpg` |

Held-out, one run on seeds 9301-9340, wins out of 40 with the settings fixed in `CFG`:

| Map | Wins of 40 | Fell | Dissolved | World ended |
|---|---|---|---|---|
| Red Box | 40 | 0 | 0 | 0 |
| Elbows | 36 | 3 | 0 | 1 |
| The Steward | 32 | 7 | 0 | 4 |
| Takeoff | 32 | 0 | 4 | 1 |
| Trailbreaker | 32 | 4 | 0 | 1 |
| The Only Box | 28 | 1 | 0 | 8 |
| The Ladder | 28 | 1 | 0 | 4 |
| Second Order | 28 | 7 | 1 | 0 |
| Three Strikes | 21 | 2 | 0 | 11 |
| The Picket | 6 | 0 | 5 | 0 |

The driver is not fully repeatable: a second Only Box run on the same seeds gave 26, not 28, split 11 of 13 at width 50, 9 of 14 at width 100, 6 of 13 at width 130. Three Strikes loses most of its misses to the world ending, not to the keys.

"A person's margins" means: read the road a second or more ahead of where you are, treat boxes as 10-35% wider than they look, and brake with the Back key. The margin values were picked per map from four tries on seeds 1-20, so those numbers are flattered; the held-out run is below.

**Hard to win, and why.** Three Strikes, The Steward, Red Box, Trailbreaker and Second Order lose almost every race if you drive the bot's line with lag, because that line brakes on the last possible curve. At speed 120 a stop takes about 465 of road, and half a second of lag adds 60. Three Strikes is the tightest: its boxes are 540-660 apart, so flooring over one box can leave no room to stop for the next. Trailbreaker asks for the most patience, since the winning time is about 52 s, most of it standing behind Pioneer. None of these turned out to be bot-only, so none was redesigned for this.

**The hardest three.**
1. The Picket was 6 of 40 on 9301-9340. It has since been softened; see the section after this one. As it was then: Most losses are close: on seeds 1-14 most ended 50-150 short of the flag at about speed 150, so under a second or two behind. Two of those 14 ended on three strikes. A run-out of 620 gave the same 6 of 20, so the road is not the fix, and I went back to 450. A person who learns the wall order on retries should do better than this driver, but that is a guess until someone plays it. If a person cannot win it, this is the map to soften first.
2. The Only Box needs a habit the bot does not have. Sight 45 sees the box about 278 away and a stop from speed 87 takes 243, so half a second of lag at full speed leaves no room, and a box seen late is fallen into. Easing to 85% pace from x 1650 until the box is in sight, and trusting the "clears" readout rather than adding a margin, took it from 5-7 of 20 to 14 of 20 on the tuning seeds. That setting was tried on seeds 1-20 before the held-out run. Note that a first-time player does not know where the box is, so this is a line for the second try.
3. Second Order, 28 of 40, falls 7 times. My reading, not traced seed by seed: the same stopping margin, this time behind a tower.

## The Picket softened, and the Foreman stall fixed (seeds 9401-9440)

**The stall was my bug, in `SGP.rvBuild`.** On The Picket there is one box, at about x 1060, just behind a wall. Once the Foreman has seen that box, the dispatcher hands it to the box plan, which floors toward the box and never looks at the wall in between. Flooring stops all meter growth (`r=fwd?0`), so it bounces off the wall and floors again, forever, with no height coming. Now, if a wall it cannot jump comes before the box, it deals with the wall first. No race timed out on seeds 1-20 with the fix. Only The Picket and The Ladder use this rival. The Ladder has no walls on the road and its numbers on 9201-9240 did not change (`sp-hs-bold` 88, max-out with eyes 5, blind max-out 100).

The fix made the Foreman stronger, because it no longer loses time crashing. So the softening had to work against that.

**Two tries on the Foreman, as directed, then stopped.** Starting speed and split, keys on seeds 1-20 with the bot's own pass:
1. Speed 50, split 85 height 15 speed: 1 of 20, bots 98 on 1001-1040, max-out with eyes 0. Kept losing by 25-79.
2. Speed 42, split 90 height 10 speed: 1 of 20, bots 98, max-out with eyes 3. Losses 19-62 with one outlier. This is the one kept.

**The real problem was the pass.** A nearly constant gap meant the race was not what the driver was losing. The bot passes as late as it possibly can, and half a second of lag loses by about 50. So I added `HD.kick`: flat out as soon as the last wall is behind you. On seeds 1-20 that gave 17 of 20. A person would do that without being told, so this is a driver setting, not a change to the race. It was found on the tuning seeds after the two tries.

| Line, seeds 9401-9440 | Keys, wins of 40, flat out from the last wall | Keys, wins of 40, bot's own pass | Bot win share |
|---|---|---|---|
| Follow line, `sp-hs-tail` | **32** | 1 | 98 |
| Max-out with eyes, `sp-hs-eyes` | **39** | 10 | 0 |
| `spBait` | not run | not run | 60 |
| `sp-h-tail` | not run | not run | 48 |
| `sp-h-eyes` | not run | not run | 30 |
| Cruiser, `sp-hs-slow` | not run | not run | 0 |
| Blind max-out, `maxout` | not run | not run | 0 |

**The target is half met.** At least 20 of 40 by keys: met, 32. Max-out with eyes clearly below the follow line: met for bots, 98 to 0, and **not met by keys, where it wins more, 39 to 32.** So for a person The Picket is now winnable, and the follow idea in its sentence is probably not what wins. Buying height and speed, reading the walls, and flooring the run-out does. I did not take a third try. The map's sentence is unchanged, as directed, and it is now flattering. Blocks: the no-kick key runs happened by accident, because the browser had cached the old driver; they count as that setting's one run. A page reload then ran the kick setting once.

## What varies by seed

- The Picket: order of the middle walls, spacing.
- Long Sight: which boxes are wide.
- Elbows: where the pothole is, and its width.
- The Steward: box widths and rises.
- Takeoff: how many pebbles before the road turns.
- Red Box: wall spacing, red box width.
- Trailbreaker: box widths and spacing.
- Three Strikes: which boxes are too wide to scrape.
- Two Endings: the cellar, held or broken.
- The Only Box: the box is 50, 100 or 130 wide, and its place and rise move. Dailies rotate by date with date-seeded dice, so the road plays three ways; 25-30 distinct finish times, but still the thinnest daily.
- The Ladder: step heights and spacing.
- Second Order: what is behind each tower.

## What I saw

Each map's comment in `maps.js` says what the frame showed. The Steward's frame exposed a real bug the bench had hidden: the rival could start inside the first box.

## What this does not show

1. Whether any map is fun. A bot winning says nothing about that.
2. Whether a person finds these strategies. Trailbreaker, Red Box and Elbows are close to all or nothing for bots: the right idea wins almost always and the wrong one almost never. That could be a good puzzle or an unfair one.
3. Rails not met: see the bold cells above. The redesigns cleared them on The Only Box and Second Order; Three Strikes and Two Endings stay as they are on purpose.
4. Red Box has a second easy answer: `sp-vs-bold` also wins 100, in about half the time of `spBait`. Sight and speed, flooring it, is simpler than the bait the card describes.
5. Frames of the dailies say "ACT UNDEFINED" because my harness starts them as campaign maps; that is not in the shipped flow. Frames were stepped by hand because the browser pane was hidden, so I have not watched any map at real speed, and no one has judged the pacing by feel.
6. `maxout` wins 100 on The Ladder and 78 on Takeoff, so "height and speed, no looking" is strong on those two.
