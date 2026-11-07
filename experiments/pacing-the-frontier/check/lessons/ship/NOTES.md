[[ai gen]]

# Ship maps: notes (2026-11-06)

Status of every map: `implemented`. The numbers below are bot play, so they are guard rails, not evidence the maps are good. No human has played these builds. `human_validated` is Cole's call.

All numbers use auto-jump on (`K.chill=1`), which is what the shipped page sets by default. The lesson page `ship/page.html` opens with auto-jump off, so a browser check there must turn it on. With it on, the page and the bench agreed on the three maps I compared (20 seeds each: 20/20 vs 100%, 18/20 vs 90%, 17/20 vs 85%).

Tune block: seeds 1001-1040. Held-out block: seeds 9001-9040, run once after the last layout change.

## Results, seeds 9001-9040

"Max-out with eyes" is `sp-hs-eyes`. "Cruiser" is `sp-hs-slow`. The rail says both should lose most races.

| Map | Strategy in a sentence | Bot | Win | Max-out with eyes | Cruiser |
|---|---|---|---|---|---|
| The Picket | Buy only height and sit behind the Foreman | `sp-h-tail` | **55 (misses 60)** | 50 | 53 |
| Long Sight | Split points evenly, sight included, and do not outrun your sight | `sp-even-eyes` | 63 | 5 | 3 |
| Elbows | Buy speed, floor it, trust your reactions | `sp-s-bold` | 95 | 0 | 0 |
| The Steward | Buy sight and height, stop for what you cannot clear | `sp-vh-eyes` | 75 | 40 | 45 |
| Takeoff | Keep buying height through the pebbles, though nothing asks for it yet | `maxout` | 75 (20 dissolved) | 20 | 20 |
| Red Box | Stay in front of the gamblers so they run blind into walls | `spBait` | 100 | 20 | 20 |
| Trailbreaker | Let Pioneer go first and cross behind it | `sp-hs-tail` | 100 | 0 | 0 |
| Three Strikes | Clear what you can, stop for the rest, scrape only the last box | `spLate` | 80 | **78 (rail fails)** | **78** |
| Two Endings | Stop at the tower, look over it, then decide | `finLead` | 100 | **70 (rail fails)** | **70** |
| The Only Box | Build evenly at a steady pace: a bet on the width | `sp-even-slow` | 63 | **63 (rail fails)** | 45 |
| The Ladder | Lead from the first step and never stop | `sp-hs-bold` | 88 | 3 | 3 |
| Second Order | Slow for the towers and look behind them | `sp-hs-eyes` | 65 | **65 (rail fails)** | 68 |

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
- The Only Box: the box is 50, 100 or 130 wide.
- The Ladder: step heights and spacing.
- Second Order: what is behind each tower.

## What I saw

Each map's comment in `maps.js` says what the frame showed. The Steward's frame exposed a real bug the bench had hidden: the rival could start inside the first box.

## What this does not show

1. Whether any map is fun. A bot winning says nothing about that.
2. Whether a person finds these strategies. Trailbreaker, Red Box and Elbows are close to all or nothing for bots: the right idea wins almost always and the wrong one almost never. That could be a good puzzle or an unfair one.
3. Red Box, Trailbreaker and Three Strikes were last watched before their final layout change.
4. Red Box has a second easy answer: `sp-vs-bold` also wins 100, in about half the time of `spBait`. Sight and speed, flooring it, is simpler than the bait the card describes.
5. Frames were stepped by hand because the browser pane was hidden, so I have not watched any map at real speed, and no one has judged the pacing by feel.
6. `maxout` wins 98 on The Ladder and 75 on Takeoff, so "height and speed, no looking" is strong on those two.
