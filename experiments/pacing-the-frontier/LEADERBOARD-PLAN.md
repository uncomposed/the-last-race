# Daily leaderboard: what it would take

Status: plan only, nothing built. Written 28 October 2026 against `main` at `a789c4a`. Numbers below were measured on that commit unless marked as estimates.

## The short version

A daily leaderboard needs three things.

1. **A trustworthy replay.** The game already records every run's inputs. The server replays them with the same simulation code and gets the same finish time, so a time can't be faked by editing a request. This is the main piece of work, and most of it happens in this repo.
2. **A small server on the VPS, in its own repo.** It stores verified times per day, tier and kind (star or lounge chair), and answers "where would this time rank?". It needs no accounts and no secrets beyond an admin token.
3. **Two screens in the game.** First, "You'd be 14th of 230 today" right after a daily race, worked out without sending anything. Then a **Publish** button that sends the run only if the player chooses to.

The game never depends on the server. If the server is down or overloaded, daily races, sharing and ghost links all keep working, and only the board and the position line disappear.

## How the player sees it

1. A daily race ends. The end card shows the usual result, plus a position line.
   - The game fetches that day's board, which is just a sorted list of times, and works out the position on the device. Nothing about the run leaves the device for this step.
   - **How the position reads (Cole's rule):**
     - Under 100 entries, give the place only, with no total: "Today, tier 2, star: you'd be 14th." This holds even when there is only one other entry ("you'd be 2nd").
     - From 100 entries up, add the total: "you'd be 14th of 230."
     - With no entries yet: "You'd be the first on today's board."
     - Ties share a place.
   - If the board can't be reached, the line says "Leaderboard unavailable right now" and nothing else changes.
2. Below it are two choices: **Publish my time** and **Keep it private**. Keep it private is the default, and it is remembered per day.
3. **Publish** asks for a name (up to 16 characters, prefilled from the last one used) and shows exactly what will be shared:
   - the name;
   - the time, tier and star or chair;
   - the attempt count;
   - the "raced like" type.
4. The server replays the run. If the replay finishes in the same time, the entry goes on the board and the card says "Published: 14th", following the same rule for when to add the total. If not, it says "This run could not be verified" and nothing is stored.
5. A **Leaderboard** button on the daily list shows today's top 50 per tier, with your own row highlighted by a label and an outline, never by colour alone. Each row has **Race this ghost**: the server already holds the verified run, so any entry becomes a ghost race. This reuses the ghost links feature.

### Honest attempts

The attempt count on an entry is **reported by the device and can't be verified**. The board labels it that way, for example "4 attempts (self-reported)". Times are verified; attempt counts are not.

## Part 1: make replays trustworthy (this repo)

This is the real limiting factor. Everything else is ordinary web work.

1. **One timestep everywhere.** The live game steps the simulation at 1/60 s. The headless `run()` used by the checks steps at 1/30 s. A verifier has to step exactly like the live game, so add a 1/60 replay path and check it in `sim-check`.
2. **Same maths on every browser.** The simulation calls `Math.sin` (track shape and the jump arc), and `Math.log`, `Math.cos` and `Math.exp` (bot noise and judgement). Browsers are allowed to differ in the last bit of these. Chrome and Node both use V8, so they agree. Safari on iPhones may not, and a one-bit difference can change a bot's decision or a track feature, so the replay would not match.
   - **Fix:** replace those calls with small deterministic versions written in plain arithmetic. That changes the simulation, so the reference results are re-recorded once, with a note.
   - **Proof:** replay a set of recorded runs in Safari, Chrome and Firefox and in Node, and compare finish times exactly. Without this, the leaderboard would quietly reject honest iPhone players.
3. **A version stamp.** Each recorded run's header gets the hash of the simulation section, which `sim-check` already computes. The server keeps a copy of each released simulation, keyed by hash. A run is replayed with the simulation it was played on, so balance changes never invalidate an existing board.
4. **Everything that changes the race goes in the log.** The header already has the seed, mode, date, tier, rivals, knob overrides, strikes and starting chill state, and the inputs log every change to the player's controls.
   - **One catch:** the log records the chill switch as the `auto` input, but the simulation reads the knob `K.chill`, not the input. The replayer has to copy `auto` into `K.chill` at the tick it changed, or a run that turned chill on mid-race won't match.
   - Pausing needs no logging, because the simulation simply doesn't step.
5. **A check that proves it.** Add a test that records runs through the real frame loop, replays them headlessly, and requires identical results. It belongs in `content-check` or a new `replay-check`.

Effort estimate: two to four focused agent sessions, mostly items 2 and 5.

## Part 2: the server (new repo, on the VPS)

Kept out of this repo on purpose: it holds the admin token and deploy setup, and a mistake here can't expose them.

1. **Where it runs: Cole's existing VPS.** Its setup is documented in Cole's private notes, and those details stay out of this public repo. What matters here: it already serves other apps through a reverse proxy with automatic HTTPS, and it can run containers. The leaderboard runs as one more container behind that proxy, added by the private runbook's rules (inspect the live config, back it up, validate, then reload).
2. **Stack:** a small Node service, so it runs the game's own simulation code unchanged, with SQLite in one file on a mounted volume, covered by the VPS's existing backups.
3. **DNS:** the-last-race.com's DNS is at GoDaddy (nameservers `ns55`/`ns56.domaincontrol.com`). One A record is needed there, `api` pointing at the VPS. The game itself stays on GitHub Pages.
4. **No Cloudflare, so the server protects itself and its neighbours:**
   - **The container is capped**, for example half a CPU and 256 MB, so a traffic spike can't slow the other sites on the VPS.
   - **Board reads are cached.** Each board is rebuilt into a small JSON file at most once every 30 seconds, served from memory, and sent with `Cache-Control: max-age=30`. Reads are the bulk of the traffic, and they stay cheap.
   - **Publishing is rate-limited in the app**, per address, for example 10 an hour. Each publish is one replay of a few milliseconds.
   - **The game never waits on it.** If the API is slow or down, the position line shows "Leaderboard unavailable right now", and racing, sharing and ghosts keep working.
   - Adding Cloudflare later only needs the domain's DNS moved to Cloudflare. Nothing in the server would change.
5. **Deploys**, following the pattern Cole's other VPS sites already use:
   - CI ships a built image or release over a restricted, forced-command SSH key, never the root key;
   - the server checks it before switching;
   - rollback is a revert PR.

   The new repo can be **public**, because it holds no secrets (the admin token lives only on the VPS). It also gets free branch protection, which private repos don't have on Cole's current GitHub plan.
6. **Endpoints:**
   - `GET /daily/{date}/{tier}/{kind}`: the sorted times for one board (kind is `star` or `chair`), plus the top 50 names. It is cached for 30 seconds (see item 4), so a traffic spike mostly hits the cache.
   - `POST /daily/{date}/{tier}/{kind}`: a run log, a name and a device token. The server replays the run and stores it if the result matches. It returns the rank.
   - `GET /run/{id}`: a published run's ghost path, for "Race this ghost".
   - `DELETE /run/{id}`: removes your own entry; it needs the device token that published it.
7. **Identity without accounts:** a random device token kept in the browser. The best time per device per board counts. This is easy to get around with a new browser, so the board is for fun among friends and makes no claim to be secure against determined cheats.
8. **Abuse limits:**
   - a size cap on submitted logs (about 4 KB);
   - per-address rate limits;
   - only today's and yesterday's boards accept new runs;
   - a name filter;
   - an admin token for removing entries.
9. **Cost:** one replay takes milliseconds. The 300 reference races replay in 1.15 s on an M1 Pro, about 4 ms each at the checks' 1/30 s step. A 1/60 s step should roughly double that, which is an estimate, not a measurement. So one small VPS core can verify on the order of a hundred runs a second, and the main protection against a spike is the cached board reads.
10. **Privacy:** nothing is stored unless the player presses Publish. Store no IP addresses beyond the short-lived rate limiter. Say this on the publish card.

Effort estimate: one to two agent sessions for the service, plus your VPS setup (DNS, Caddy, a systemd unit).

## Part 3: the game screens (this repo)

1. The position line and the Publish / Keep private choice on the daily end card.
2. The Leaderboard view on the daily list, with "Race this ghost" per row.
3. The publish card with name entry, showing exactly what is shared.
4. Every failure path ends in a plain message, and the game keeps working.
5. Content-check tests for the position maths against a fixed board.

Effort estimate: one agent session.

## Order

1. Part 1, items 1, 3, 4 and 5. Then item 2, the cross-browser maths, which carries the most risk, and its Safari proof.
2. The server, tested locally against recorded runs.
3. The game screens, behind a switch until the server is live.
4. Friends and family test, then share widely.

## What would show this plan is wrong

- If Safari replays still don't match after the maths fix, verification has to fall back to a tolerance, for example accepting a time within 0.05 s. That weakens the "can't be faked" claim, and the board should then say so.
- If few players press Publish in the friends-and-family test, a public board isn't the draw. Then ghost links between friends may be enough, and the server can wait.

## Decisions for Cole

Answered:
- **Position wording:** place only under 100 entries, "of N" from 100 up.
- **Server:** Cole's existing VPS, without Cloudflare.

Still open:
1. Can you add the GoDaddy A record `api.the-last-race.com`, pointing at the VPS, when the server is ready? Or would you rather use a subdomain of your other domain, whose DNS you already manage with the VPS?
2. Separate boards for star and lounge chair, as proposed, or one board with chair runs marked?
3. How long boards are kept: forever, or 30 days?
4. Should the default after a daily race be "Keep it private" (proposed), or should the publish card open straight away?
5. Name filter: a simple word list, or none for now while it's friends and family?
6. Is the server repo public (proposed, since it holds no secrets) or private?
