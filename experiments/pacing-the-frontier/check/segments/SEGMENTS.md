# Race Segments: twelve hand-built step gaps

[[ai gen]] Written by Claude, 2026-10-30. Status: **implemented and verified** (bot runs and a browser load check). Nothing here is human_validated. Whether a person feels these dilemmas is the open question, and only playing them answers it.

## What this is

Twelve short tracks. Each one sets up one dynamic of the race (hidden width, the sight shadow, first-across, spill, strikes, the singularity) and asks one question in the header. The tracks are hand placed. Each seed draws a variant: a wider or narrower box, a rough or quiet road. So "New run" replays the same question with a different answer.

- Page: `segments.html?seg=N` (N from 1 to 12). The header has Prev, a picker and Next.
- "After the race: what was this variant?" reveals what the box actually was.
- Build: `node build.mjs`. It patches `../hidden-width/page-hidden.html` and fails loudly if any patch no longer matches.
- Bot check: `node check.mjs --n 40 --out results.md`.

The page has to be served over http. Under `file://` the query string is dropped, so every link opens segment 1.

## The twelve

| # | Segment | The dynamic | The real-world idea |
|---|---|---|---|
| 1 | The Unknown Box | Hidden width: brake before you know? | A risk you cannot size until you are committed |
| 2 | Everyone Else Is Rushing | Three rushers; their falls roll your extinction too | Caution alone does not protect you |
| 3 | Tailgating in Fog | You are as tall as the lab ahead, so you see nothing past it | Following the leader is not knowing what it knows |
| 4 | Who Goes First? | Everyone stopped at the box; rivals lose patience at 6, 12 and 20 s | The first one's risk becomes everyone's knowledge |
| 5 | Warning Signs | Tall barriers mean a wide box; small barriers mean a narrow one | Small incidents are evidence about the big one |
| 6 | The Beacon and the Quiet One | A tall visible box, then a low one that is the real danger | The visible threat gets the attention |
| 7 | Rising Stakes | Three boxes with fall odds of 5, 25 and 50% | The same mistake costs more higher up |
| 8 | Clean Record | Every rival is on its last strike; you have none | Risk budget is a choice to spend |
| 9 | The Breakthrough Wall | A wall that needs height; clearing it spills height to watchers | Breakthroughs leak |
| 10 | The Fast Follower | The leader stops to build; follow across a narrowing box, or go first? | Followers ride on what the leader paid for |
| 11 | The Pack Behind You | Your tailers stop with you and hide the box from a latecomer | Stopping quietly hides the hazard from whoever comes next |
| 12 | The Last Gap | Singularity: 3x speed, laggy controls, tall barriers after | Preparation happens before the transition |

## What the bots show (40 seeds)

"You" is a bot playing one posture. Rush floors it, Build stops to fill height first, Wait lets someone else cross first, and Read (segment 5 only) builds on the rough road and rushes on the quiet one. The full table is in `results.md`.

1. **Posture changes the outcome in every segment.** No single posture wins all twelve. Rush is best in 1, 3, 9 and 11. Build is best in 4, 6, 7, 8 and 12. Wait is best in 10.
2. **Reading the road pays (segment 5).** Read wins as often as Rush (38%) and never falls. Rush falls 63% of the time.
3. **A clean record is not free to spend (segment 8).** Rush scrapes the first box and falls at the second, 100% of the time.
4. **The rushers' dice are yours (segment 2).** Extinction is 48 to 63% whatever you play. Holding back wins 18%.
5. **Rising Stakes is harsh (segment 7).** Extinction is 55 to 58%. That may be too much for a lesson; it is the first one I would soften.
6. **Segment 10 does not show a comeback.** It is a single variant (no randomness), and the lab that scrapes across first always wins. Going first sets the new ceiling, and followers only get a 40% share. The narrowing makes following safe, but the bots never catch up. I reworded the question to ask which matters more instead of promising a catch-up.

## Findings about the game itself

These came out of building the segments. Each is a rule interaction, not a segment bug.

1. **A stopped lab's tower can kill a shorter lab behind it.** A lab that stops near a box face leaves a barrier of its own height. A lab just below the ceiling jumps that barrier late, lands inside the box and falls. I changed the tower height to round down instead of to the nearest unit, which fixes the 69.9-against-70 case. The broader effect stays: standing at a box is a hazard for followers.
2. **Following is almost always safe.** A crossed box narrows the further the leader gets past it. Tailers in segment 11 never fell until I rebuilt it around a latecomer.
3. **The sight shadow blinds careful bots.** Bots that stop to build still drove into boxes at speed when a taller lab blocked their view. I added a blind-pace rule for the segment bots: when shadowed, slow to a speed that can still stop.
4. **Height is nearly free while cruising.** Cruising fills height and speed automatically, so box widths had to be set against a lab's full reach (the f factor) to bite at all.
5. **First across dominates.** The first lab across gets the next ceiling, and the others get 40%. In bot play this beats the laggard refill (up to 3x) every time.

## Jump peek (added 2026-10-31)

The segments now build on the hidden-width page with the jump peek from PR 28: in the air your eye rises, so you can see a box face over a rival, but never its width. Bots hop to peek when shadowed. `results.md` was rerun with peek on (seeds 1 to 40).

1. **Segment 2 does not change.** Extinction stays at 48% for Build and Wait. Peek gives you information, and the rushers' falls do not depend on what you know.
2. **Segment 3 flips for Rush, but it is a bot artefact.** Rush went from 45% wins to 0%, falling 45% of the time. The rush bot now hops near the box without using what it saw, and follows Rush into wide boxes. The bot peek rule ignores posture; until it doesn't, this row says nothing about people.
3. **Everything else moves by a few points at most.** Peek is a mechanism for the player, so bots are a poor measure of it.

## Limits

- Bots are not people. A bot either sees the box or it does not; a person guesses, hesitates and second-guesses. The table shows the segments are not degenerate. It does not show they teach anything.
- Segment 10 has one variant, so its row is one case repeated 40 times.
- Only segments 4, 11 and 12 were loaded in the browser. Segment 4 was started, and Next was clicked from 11 to 12. No segment has been played through by hand.
- `pages.yml` does not publish `segments.html` yet, so a PR preview link will not include it until that workflow is updated.

## How to tell if this is wrong

If Cole plays segments 1, 4 and 11 and cannot say what the question was asking, or picks the same posture every time without thinking, then the headers are carrying the lesson and the tracks are not. The fix then is fewer, starker segments, not more text.
