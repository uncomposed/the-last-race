[[ai gen]]

# Ship maps: notes (2026-11-06)

Status of every map: `implemented`. The numbers below are bot play, so they are guard rails, not evidence the maps are good. No human has played these builds. `human_validated` is Cole's call.

All numbers use auto-jump on (`K.chill=1`), which is what the shipped page sets by default. The lesson page `ship/page.html` opens with auto-jump off, so a browser check there must turn it on. With it on, the page and the bench agreed on the three maps I compared (20 seeds each: 20/20 vs 100%, 18/20 vs 90%, 17/20 vs 85%).

Tune block: seeds 1001-1040. Held-out blocks: 9001-9040 (first check, before the last changes), 9101-9140 (The Picket only), 9201-9240 (final check, run once).

## Results, seeds 9201-9240

This is the final check, run once after the last change. Campaign order is the order below. "Max-out with eyes" is `sp-hs-eyes`, "cruiser" is `sp-hs-slow`, "blind max-out" is `maxout`. The rail says the first two should lose most races. "Times" is the number of distinct finish times across the 40 seeds.

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

**The Picket is still near the line.** Its intended bot, `sp-h-tail` (sit behind the Foreman), won 55 here, 80 on 9101-9140 and 53 on 1001-1040. The 68 is `spBait`, the best of 15 bots on this block, so it is flattered by being picked after the fact. Treat this map as about 60, not safely over. This is the first campaign-completion risk to check by hand. A loss only retries the map, so it should not block a player.

**One redesign each, as directed, then left alone.** Three Strikes got a stronger Ledger, The Only Box a real sprinter, Second Order a rival that buys sight. Max-out with eyes still wins all three. Second Order did improve in the tune block: the reckless rival no longer decides it by dice (world-ended share fell from 28-33 to 15), and blind max-out fell to 33. Three Strikes opens the campaign on purpose, so max-out working there becomes the habit that Long Sight (18), Elbows (0) and later maps break.

**Two Endings was not retuned against this bot,** on the director's instruction, because Cole has played it. Max-out with eyes wins 58. That is his call.

Earlier block, 9001-9040, before these changes: The Picket 55, Long Sight 63, Elbows 95, The Steward 75, Takeoff 75, Red Box 100, Trailbreaker 100, Three Strikes 80, Two Endings 100, The Only Box 63, The Ladder 88, Second Order 65.

Unconfirmed reports from the ship manager, from a few hand runs:
1. The Foreman stalling near x 866 after being passed. Not reproduced: in 200 bot races on 1001-1040 it never stood still for more than 6 seconds. A human run may differ.
2. Long Sight won in 41.9 s by standing about 18 s with lowest sight, then flooring it. Not checked. If it holds, it skips the sight lesson.

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
- The Only Box: the box is 50, 100 or 130 wide. Dailies now rotate by date with date-seeded dice, so this one has only three variants; that is thin.
- The Ladder: step heights and spacing.
- Second Order: what is behind each tower.

## What I saw

Each map's comment in `maps.js` says what the frame showed. The Steward's frame exposed a real bug the bench had hidden: the rival could start inside the first box.

## What this does not show

1. Whether any map is fun. A bot winning says nothing about that.
2. Whether a person finds these strategies. Trailbreaker, Red Box and Elbows are close to all or nothing for bots: the right idea wins almost always and the wrong one almost never. That could be a good puzzle or an unfair one.
3. Rails not met: see the bold cells above.
4. Red Box has a second easy answer: `sp-vs-bold` also wins 100, in about half the time of `spBait`. Sight and speed, flooring it, is simpler than the bait the card describes.
5. Frames were stepped by hand because the browser pane was hidden, so I have not watched any map at real speed, and no one has judged the pacing by feel.
6. `maxout` wins 100 on The Ladder and 78 on Takeoff, so "height and speed, no looking" is strong on those two.
