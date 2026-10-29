# Handoff: Pacing the Frontier

Snapshot: 28 October 2026, end of day. `main` is at `a789c4a` (PR 18). Live at https://the-last-race.com.

Status words: **implemented** means the code is in. **Verified** means checks or bot runs passed. **Human-validated** means Cole confirmed it by playing. Cole has played the live game today and says it is fun. The features below have not been validated one by one unless noted.

## What is live

| PR | What | Status |
|---|---|---|
| 8 | Landscape throttle: push up for more Run | verified (simulated touches) |
| 9 | Playable preview per PR at `/preview/pr-<n>/` (owner's PRs only, no forks) | verified, used all day |
| 10 | Outbound reading links carry `utm_source=the-last-race.com&utm_medium=game&utm_campaign=<where>` | verified |
| 11 | Daily challenge: date seed, three tiers, star or lounge chair, honest attempts, briefing quiz gate, twists, share poster with preview | verified; Cole tried the preview |
| 12 | Campaign seeds re-picked so each map's hint holds under the current balance | verified (bots) |
| 13 | Briefing fact and tone pass | verified against sources |
| 14 | 12 achievements with sourced real-world notes; historian opens with them; gallery | verified (bots) |
| 15 | Ghost links: "Challenge a friend", race a see-through copy of a run, no server | verified (bots, harness) |
| 16 | Review fixes (map unlock carry-over, twists harder on every tier, fixed briefing schedule, per-tier best times, new `content-check`), "Play another", "Retry map / Retry tier" | verified |
| 17 | Next map keeps your star level; Star 1 / 2 / 3 switch on the Ready card | verified (browser) |
| 18 | "You raced like a Steward": closest rival type on the end card, recap and shares; "Usually: …" tally | verified (bots: 288 to 300 of 300 per type) |

Open: PR 19, this handoff, the leaderboard plan and the saved campaign probe scripts. Docs only.

## Not verified yet

1. Real phone share sheet and clipboard, for the daily poster and the ghost links.
2. Ghost links in Safari and on iPhone. The ghost is a recorded path, so it should be fine, but nobody has tried it.
3. Screen reader use, reduced-motion mode, and the landscape throttle on a real touch device.
4. "Only 2 Strikes" and the other twists played by hand. They were measured with bots only.
5. Known layout nits:
   - On phones the "Gate: more Build" label can overlap rival name tags.
   - The end card's sticky buttons can cover the "raced like" line until you scroll.

## Next steps, in order

1. **Leaderboard, part 1, in this repo.** See `LEADERBOARD-PLAN.md`.
   - one 1/60 s replay path;
   - deterministic maths so Safari replays match (the sim calls `Math.sin`, `Math.log`, `Math.cos` and `Math.exp`);
   - the sim hash in each run log's header;
   - copy the `auto` input into `K.chill` on replay;
   - a replay check in CI.

   This is the main risk: prove it in Safari before relying on it.
2. **Leaderboard server**, in the private repo `uncomposed/the-last-race-server`. Its `HANDOFF.md` has its status and deploy steps. Deploying needs Cole's VPS, plus one GoDaddy DNS record for `api.the-last-race.com`. Cloudflare's free plan is recommended in front at public launch.
3. **Leaderboard screens** in the game: the position line using Cole's wording rule, Publish or Keep private, the board view, and "Race this ghost".
4. **Sprite customisation.** Points groundwork exists: `PF.ach.points()` counts achievements, stars and chairs. There is no shop yet.
5. **More briefings.** There are 10, so the daily repeats every 10 days. Each new one needs a sourced fact and Cole's approval, and gets an `added` date, so past days never change.
6. Parked:
   - Campaign lives won back by a quiz: decide after seeing how players treat the daily quiz.
   - Live multiplayer.
   - Branch protection on `main`: declined for now; Cole is the only writer.

## Open decisions for Cole

From `LEADERBOARD-PLAN.md`:
- the `api` DNS record or a subdomain of his other domain;
- star and chair boards kept separate (proposed);
- how long boards are kept;
- "Keep it private" as the default;
- name filter strictness.

## How to work here

- **Checks:** `node check/sim-check.mjs` (300 reference races) and `node check/content-check.mjs` (about 7 s: campaign unlocks, twists harder on every tier, briefing schedule, data shape, "raced like" accuracy). Both run in CI on every PR.
- **Other tools:**
  - `check/raced-like.mjs` reproduces the classifier figures.
  - `check/lesson/` holds the campaign seed probes; see its README.
  - Balance claims use held-out seed blocks: tune on one, report from another.
- **Previews:** every PR Cole opens gets `https://the-last-race.com/preview/pr-<n>/` a minute or two after its checks. Put the link at the top of the PR.
- **Rules:**
  - ES5, one file, no build step.
  - Never use red and green alone; use Okabe-Ito blue and orange plus labels or shapes.
  - Plain words, no em dashes.
  - Every real-world fact has a source, and Cole approves the text.
  - Tag outbound links.
  - **This repo is public: never copy details from Cole's private notes into it**, such as server addresses, ports or other hosted apps. Those belong in the private server repo or in his notes.
