# Multiplayer plan: hosted rooms

Status on 2026-10-30. Part 1 is `implemented` and `verified` locally (`check/mp-check.mjs`, 31 checks, plus two browsers on one Mac, desktop and phone sizes); nothing here is `human_validated` yet. Part 2 needs the VPS.

## Goal

Anyone on the-last-race.com presses Multiplayer, gets a room link with a short code, and sends it to up to three friends. Nobody installs anything. Self-hosting (`multiplayer/server.mjs --tunnel`) keeps working the same way for testing.

## Constraints

1. The site is static (GitHub Pages), so a race server has to live somewhere else: the VPS that is planned for the leaderboard.
2. The server runs every race itself (the simulation section of `prototype.html`, one copy per room). That avoids desync between browsers whose maths may differ (Safari) and makes cheating hard. The cost is bandwidth: about 2 KB per snapshot, 30 a second, so about 65 KB/s per player (measured on one Mac, 2026-10-30).
3. The first night of play (2026-10-30, four friends, self-hosted through a Cloudflare quick tunnel) worked. The one problem: a player went AFK and nobody could free his seat.
4. Public repo rule: no VPS address, ports or deployment details in this repository. Deployment config goes in the private server repo.

## Part 1: no VPS needed (this branch)

1. **Rooms with codes.** One server holds many rooms, each with its own seats, settings and race. A code is four consonants (for example `KXQF`) that are easy to read aloud, and a room link is the page address plus `?room=KXQF`. An empty room closes after 10 minutes.
2. **Host controls.** Whoever creates the room is the host. Between races the host can **Free seat** (move a player to watching; they can sit again) or **Remove** (take them out of the room; they cannot come back to it). If the host presses Leave room, or is away for 10 seconds, the next player present becomes host. A host who reloads keeps the role.
3. **AFK handling.** A player whose tab is hidden or closed counts as away and is marked "(away)". In the lobby, a seated player who has been away for 60 seconds is moved to watching automatically. During a race nothing changes: the lab keeps its last controls. When the race ends, a player who has been away for the whole minute loses the seat at once.
4. **Reconnect token.** Each player gets a random token, stored in the browser for that room. Reopening the link takes back your seat and name. Typing someone else's name no longer does.
5. **Multiplayer button on the site.** It shows on the start card and beside Campaign when a server is configured (`MP_SERVER` in `prototype.html`, empty until Part 2). On a local dev page, `?mpserver=ws://localhost:8080/ws` points at a local server. That override only works on localhost, so a link cannot send players to someone else's server.
6. **Limits.** Up to 300 rooms, 600 connections and 12 people per room (4 seats and 8 watchers). Each connection is rate-limited. The WebSocket only accepts pages from the-last-race.com, the GitHub Pages address, localhost and the server's own address (`--allow-origin` adds one).
7. **`/health`** returns room, race and connection counts, for monitoring after deploy.
8. **`check/mp-check.mjs`** starts a server on a spare port and drives it with test clients: create and join by code, a bad code, two rooms racing at once, controls reaching the lab, free seat and remove, AFK auto-free, reconnect by token, and host hand-over.

## Part 2: needs the VPS (later, in the private server repo)

1. Run `server.mjs` on the VPS behind Cloudflare (free plan, as planned for launch), with WebSockets on.
2. Add the DNS record for the API host (the same one planned for the leaderboard).
3. Set `MP_SERVER` in `prototype.html` to the public `wss://` address. The Multiplayer button then appears on the live site and on PR previews.
4. Watch `/health` and bandwidth for the first week.
5. If bandwidth becomes the limit: send only what changed in each snapshot, or send only controls once the deterministic-maths work for the leaderboard lands.

## Decisions

1. **The room server stays in this repo: yes** (Cole, 2026-10-30). `server.mjs` stays here: it loads the simulation from `prototype.html`, so the two must change together, self-hosting with `--tunnel` needs it here, and CI tests it against the page. It holds no infra details. The private server repo holds only how it runs on the VPS (service config, proxy, DNS, address) and deploys a pinned commit of this repo. Revisit if the server ever needs secrets or private anti-cheat logic.
2. **Host only for Free seat and Remove: yes** (Cole, 2026-10-30). Any seated player can still start a race and change the settings.
3. **Away timeout of 60 seconds: yes** (Cole, 2026-10-30).

## What would show this plan is wrong

- If real use shows bandwidth or lag for faraway players to be a problem, direct browser-to-browser play (WebRTC) becomes worth its extra complexity: it needs a signalling server, and a paid relay for some networks.
- If groups mostly want to play with strangers rather than friends, rooms by link are not enough and matchmaking is the next problem.
