[[ai gen]]

# Campaign notes (2026-11-02)

Hand-built maps, no generator. Each map reads its numbers from `P` in `maps.js`; seeds are only the dice inside a map (which boxes are wide, the fall rolls). The lesson strategy is `cpRead`, the reader: it cruises no faster than it can stop within the road it can see, slows on the braking curve at a box, stops and builds once it has seen more box than it can clear, then plans the crossing.

Play: serve `check/` (`python3 -m http.server 8765 --directory experiments/pacing-the-frontier/check`) and open `/lessons/campaign/page.html?map=cp-look`, then Next.

## In the campaign (3 maps)

| Map | Lesson | Reader vs best adversary, seeds 1–40 | Seeds 21–60 |
|---|---|---|---|
| Look Before You Leap (`cp-look`) | Look before you leap | +13 | −5 |
| Warning Signs (`cp-signs`) | Small incidents are evidence | +15 | +8 |
| The Pattern Breaks (`cp-break`) | Patterns hold until they don't | — | +25 (reader wins 100%) |

Default rules, auto-jump, `sweep.mjs`.

**The judge** (seeds 9001–9040, auto-jump, 13 rule sets; full table in `JUDGE.md`):
- Warning Signs **passes**: +18, holds 10 of 13.
- The Pattern Breaks: +45 at the default rules but holds only 8 of 13 (ties at 100% under several rules, loses at build 10). Fails on rule robustness, not on the default game.
- Look Before You Leap **fails**: −5, holds 2 of 13.

## Drafts, not in the campaign (`draft:1`)

Rise Above the Fog, Small Risks Add Up and The Last Race. In none of them did the reader beat the pool in any setting tried (margins −15 to −100). They are kept in `maps.js` so the work is not lost.

## What I learned (why most maps fail)

1. **A lab that invests while cruising arrives full, and full meters clear any box the ceiling allows.** Width a lab can clear is set by its ceiling: stopping to build cannot take meters past it. So caution only pays when a box outgrows what a cruiser has built. The adversaries that run at 70% and build height and speed (Cole's maxout) keep up with the ceiling, and reading only costs time.
2. **What worked on The Pattern Breaks:** the wide last box is sized to the leader's raised ceiling (`wcap 130`), and the rival is careful (`post:'cpRead'`). Followers can't clear it and fall; the reader leads, stops, builds and crosses.
3. **A reckless rival decides the race by dice.** With the floor-it rival (`cpRival`), the rival fell in almost every race and the extinction roll chose the winner, so every strategy scored the same.
4. **Tall boxes make the reader slow.** It holds the braking curve until it sees the far edge, which on a rise-30 box takes most of the approach.

## Sim fixes made on the way

- `cpRival` remembers the widest part of a box it has seen (it used to forget once a taller lab blocked its view) and handles a barrier left at a box face.
- Optional `P.read` (`invest`, `w`) tunes the player's reader per map; `P.wcap` and `P.wlead` size boxes against a ceiling cap or the leader's ceiling.

## What this does not show

- Bot play only. No human has played these three maps; that is the next step (`human_validated` is Cole's call).
- Look Before You Leap is not robust: its margin flips sign between seed blocks.
- The intro card still says "Race three rival labs"; these maps have one rival.
