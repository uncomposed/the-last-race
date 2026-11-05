# Up to Now: notes for Cole

A prequel to Two Endings: the AI race so far. Draft for review. Nothing here has been played by a person yet.

## How to play

Serve the check folder, then open `/lessons/upnow/page.html?map=up-to-now`. The page starts with chill off and step gaps on, so you jump by hand. To replay a race, add a seed, for example `&seed=7` (a calm race) or `&seed=2` (a rough one). The map is number 5 in the page's map list. The page also includes the campaign and Two Endings, so you can go straight on to Two Endings.

To rebuild the page: `cd check/lessons && node build.mjs --only campaign+showcase+upnow`.

## Design

Four labs race over eight boxes. The first lab across a box gets a higher knee; everyone else gets 90 percent of that rise. Like Two Endings, the 90 is a hidden dial and is shown only after the race. Under the soft ceiling, a lab keeps building past its knee, but only while it runs below its own top speed.

Most boxes are small, about three quarters of what a lab at its knee clears cleanly, so racing has paid. One to three boxes per race are wider than they look. They sit just inside the scrape band: whoever crosses first at speed scrapes, losing height and taking a strike, and the box then narrows for everyone behind.

So leading leaks. The leader takes the scrapes and builds nothing while floored. A lab tucked in behind keeps building and slingshots at the end.

The hidden fork is set by the seed and is on in about half the races. When it is on, one of boxes 6 and 7 is deep in the fall band instead of the scrape band, and nothing announces it. On a calm seed, breaking away early wins. On a rough seed, whoever breaks early meets that box first, too fast to stop, and either scrapes to the floor or falls. Patient labs win those races.

The rivals:
- **The Sprinter** floors it into every box, so it eats the scrapes.
- **The Follower** is the fast follower. It sits just behind whoever is ahead, passes anyone who dawdles, and floors it 700 from the finish.
- **The Careful lab** is the incumbent. It starts ahead, builds sight and reads every box. It is safe but slow.

Your lever is when you stop building and floor it, and whom you sit behind until then. The stake is the win, plus a small chance that a fall ends the world: 3 percent at a normal box, 5 percent at a wide one, 10 percent at the last.

The last box is public and taller than the rest, a small echo of the tower in Two Endings. There is no tower and no cellar.

## What to watch for

The decision is the break: when you stop building and floor it to win. It usually comes between box 5 and box 7, about 30 to 40 seconds in. Go early and you beat the Follower's slingshot on a calm seed, but on a rough seed you are the first to reach the deep box. Wait behind the Follower or the Sprinter and they reach it first; the box then narrows for you, but you have to out-sprint the Follower at the end.

The second thing to watch is the pack. The labs bunch up, and the order changed about 10 times per race in bot play.

Two things in the page help a careful player:
- A box becomes public when two labs see it at the same moment, so bunching tends to reveal widths.
- The "your jump now" line under the track says clean, scrape or fall at your current speed.

At full speed you usually see the deep box too late to brake. Sight bought earlier is what would give you room to stop.

Screenshots, all from bot runs in the page:
- shot-pack-seed7.png: seed 7 at 24 seconds. You, the Follower and the Sprinter bunched; the Sprinter already has a strike.
- shot-deep-box-seed2.png: seed 2 at 40 seconds. "You" broke early at 1800 from the finish and is first at box 7, which is 128 wide. The readout says scrape.
- shot-deep-box-cost-seed2.png: a moment later. Strike 1 of 3 and minus 87 height, with speed capped. The Follower went on to win in 47.8 seconds.

## Bot numbers

All runs use chill 0 and 40 seeds. I tuned on seeds 1 to 40 and only measured on seeds 1001 to 1040. The shares are bot outcomes on this seed sample, not calibrated probabilities.

The bot strategies for "you":
- **Draft** follows the lab ahead and slingshots, as the Follower does.
- **Build-and-break** keeps building past the knee, then floors it at a set distance from the finish: 900 by default, or 1800 for the early break.
- **Sprinter-style**, **Careful-style** and **scLead** (lead from the front).
- **Max-out**, which builds to the knee and then floors it with no further decisions.

Win shares, tuned seeds then held-out seeds:
- Draft: 58 percent, then 63.
- Build-and-break at 900: 45, then 43.
- Early break at 1800: 48, then 38.
- Sprinter-style: 28, then 23.
- Max-out: 23, then 28.
- Careful-style: 8, then 15.
- Lead from the front: 3, then 5.

There were no timeouts in either block. The check.mjs claim (at least two postures win 20 percent or more and beat max-out) holds on both blocks, with a score of 3 on the tuned seeds and 2 on the held-out seeds.

The fork shows up clearly by seed:
- **The early break** won 18 of 21 calm seeds but only 1 of 19 rough seeds when tuning. Held out, it won 13 of 17 calm and 2 of 23 rough.
- **Max-out** won no calm seed in either block, but 9 of 19 rough seeds when tuning and 11 of 23 held out. It wins only when the deep box knocks out the leaders.
- **Draft** is steadier: 14 of 21 calm and 9 of 19 rough when tuning, then 12 of 17 calm and 13 of 23 rough held out.

Races averaged about 46 seconds, ranging from 40.8 to 63.9.

What the rivals did, as averages per race in bot play:
- about 10 changes of order;
- about 2.4 scrapes, mostly by whoever leads (often the Sprinter);
- between 0.03 and 0.5 falls, depending on how you play.

Drafting is visible in the traces. On seed 2 the Follower sits just behind the leaders from about 18 seconds on. On seed 7 it passes "you" in the last 700 and wins.

On rough seeds the pack sometimes piles into the deep box together. On seed 1023 with a 900 break, all four labs fell at boxes 6 and 7, and the race ended with no winner. That ending is a pile-up, not a timeout.

## Solvability

The world can end on this map, so for every seed where it ended in my bot runs I searched 30 plays: build-and-break at five distances and three paces, and draft at five slingshot distances and three gaps. At least one of them won every seed:
- Seed 26: 9 wins, for example draft with a 300 slingshot.
- Seed 1004: 10 wins, for example draft with a 300 slingshot.
- Seed 1016: 8 wins, for example build-and-break at 900, pace 0.8.
- Seed 1023: 12 wins, for example build-and-break at 500, pace 0.8.

Many plays still ended the world on those seeds: 7, 5, 2 and 0 of 30 respectively. Seed 1023's losses were pile-ups and plain losses instead.

## What did not work

- My first wide boxes were bigger than the scrape band, and labs simply fell. Keeping them inside the band, plus a taller rise, gave scrapes instead of falls.
- At first the Sprinter and the Follower ran at their own top speed, so they never built, and max-out won 83 to 85 percent. They now build to the knee first.
- Stock cpRead, used for the Careful lab, crashed into walls over and over and could time out. On this map only, every bot posture now waits behind a wall it cannot jump and stops short of a box taller than itself.
- Before that last guard, a scraped-down Follower would jump the tall last box and end the world. Seed 1023 had no winning play then; with the guard it has 12.
- Changing the share from 50 to 90 hardly changed any result. With the soft ceiling, the first-crosser bonus is small next to building while drafting. I kept 90 to match Two Endings.
- I tried two sight-and-brake strategies for "you": stop at a box you read as too wide and let the pack go first. Both won only about 10 percent and never actually stopped. The bot is rarely in front, and at speed it sees the box too late. A person may do better; I could not show it.
- A strategy that never floors until the end (pace 0.85) fell in 68 percent of races, so I dropped it.

## Rule-change proposals

None are needed for the map to run. Two ideas for you to consider:
- **A first-crosser bonus that matters under the soft ceiling.** For example, the knee could rise faster for the crosser, or the share could apply to growth past the knee. Then leading would pay something real, and "lead or draft" would become a closer call than it is now.
- **A visible slow-down.** A lab that brakes hard in front of a box could flash or show a brake light. The Careful lab's braking would then be a warning a human can read, instead of only a slower lab.

## What isn't shown

- No person has played the map. Every number is bot play at chill 0. Bots jump with their own timing, and a human's jumps and reactions will differ.
- Whether the fork reads as "racing stopped paying" to a player is untested. The reveal after the race names the deep box, but only after the race.
- Sight barely mattered for the bots. I have not shown that buying sight lets a person see the deep box in time to brake.
- The rivals rarely put up walls; walls and crashes into them were close to zero. So collisions in the wall sense are not part of this map. The situations it does create are drafting, passes, scrapes on the leader, and pile-ups at the deep box.
- The Follower is strong. Against naive play it wins most races, and a player who never drafts or breaks will mostly lose to it.
