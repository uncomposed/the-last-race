# Scenario tracks: which box features make which strategy win

[[ai gen]] Bot-only experiments, 2026-10-29. Not committed. Folder: `scenarios/`.

## Setup

- Page: `scenarios/page-scen.html`. This is `audit/page-timing.html` (bots press 25% into the arc, BOXU 0.25) plus one hook: `globalThis.SCEN(T, H)` runs after `setRises` and can rewrite the track. Roll streams are padded when a scenario adds gaps.
- Runner: `scenarios/scen.mjs` wraps the auditor's `race()` from `audit/race.mjs`. It records per-box outcomes (C clean, S scrape, F fall) for the player and the rivals, and logs the player's state when it reaches each box face. It also adds a `flat` probe, which is rush that floors it within 160 of each box.
- Hand-written tracks: `scenarios/specs.mjs`. A spec gives each segment's length, barriers, run-up, rise (as a fraction of the ceiling) and width (absolute, or a multiple of the stop-and-build fit). The base track has 4 boxes with rise 0.55 and width 0.8 of the fit. The feature box is box 3 (ceiling 115).
- Patched generator: `scenarios/genpatch.mjs`. It turns a share q of the regular boxes into long boxes, then shifts the rest of the track.
- Probes: the 10 harness probes, plus crawl and smart. Chill is off. Hand tracks: 100 noise draws per probe. Generated tracks: 2 draws per seed per probe.
- Analysis: `an.mjs` (scenarios) and `genan.mjs` (generator). Output is in `an.txt`, `genan-cal.txt` and `genan-held.txt`.

## The finding everything else hangs on

**Height is free and speed is scarce.** Every probe reaches boxes at 0.90–0.99 of its ceiling height, even with barrier spill cut from 33 to 10. Speeds at the face are 43–83, against a full-meter top of about 148.

The speed meter is starved because labs only invest while they are below top speed. At the end of a race, rush (62% of its effort on speed) has only 17% of its ceiling in speed. Gamble has 63%.

So "fast-low" does not exist in the sim. Rise barely matters (tall-narrow is the same as base), and width is the only real box lever. Stopping builds speed, not height.

## Feature → winning strategy (hand tracks, 100 draws × 12 probes)

| Feature (box 3 unless noted) | Winner (win %) | Fast probes on the box | Extinction |
|---|---|---|---|
| base, tall-narrow, singularity with short run-up | gamble 89–95 | clean | 0 |
| tall-wide (rise 0.975, W 59) | gamble 96 | rush scrapes 76%, 25% dissolve | 0 |
| long-mid (rise 0.7, 1.3× fit) | gamble 79, bold 18 | rush scrapes 100%, 95% dissolve | 0 |
| long-low (rise 0.4, 1.6× fit) | rush 36, smart 26, drafter 15 | rush falls 20%, bold falls 98% | 17–34 |
| same, no run-up room | rush 39, gamble 16; smart and crawl 0 | falls 47–85% | 17–50 |
| tall barrier 30 before a 1.4× box | crawl 47; others 0–18 | falls about 90% | 50–63 |
| same barrier 70 back | gamble 97 (no effect) | clean | 0 |
| two boxes 50 apart | gamble 45, bold 17, twin 10 | rush falls 14% | 0–14 |
| mixed sequence | gamble 39, smart 23, rush 17, scout 16, drafter 15 | mixed | 5–28 |
| floorless pit (2.2× fit), speed box 150 wide | nobody wins | everyone falls | 41–63 |
| long-low without scrape strikes | rush 56 (was 36) | same | same |

The flat-out probe did not help on any track, because its speed meter is empty.

## Generator: 25% long boxes

Calibration seeds 0–299, then held-out seeds 3000–3299, with 7,200 races per configuration.

| Config (held-out) | Fast probes clean, short / long boxes | Fast-low pays overall | Extinction | Best class share (gamble / build / careful / fast) | Class win, seeds with 0 vs 2+ long boxes |
|---|---|---|---|---|---|
| base | 88% / – | 88% | 3% | 45 / 23 / 25 / 8 | – |
| **midLong** (rise 0.65–0.75, width 1.2–1.4× fit) | 91% / 35% (62% scrape, 3% fall) | **77%** | **4%** | 37 / 32 / 26 / 5 | gamble 36→7, build 15→26 |
| mixLong (half low-long) | 91% / 27% (35% fall) | 75% | 12% | 36 / 30 / 28 / 5 | gamble 36→4, build 15→11 |
| lowLong (calibration only) | 91% / 23% (63% fall) | – | 17% | 37 / 32 / 28 / 3 | – |

- Calibration showed the same flip as held-out: for gamble 44→11, and for build 11→27.
- **Diversity caveat.** The per-seed best probe has an effective count of about 10 in every configuration, base included. That is the noise floor of 2 draws, so it is not a real signal.
- Split-half agreement on the best class is about 50%, against 29% by chance. That is no better than base. So the gain is the map-dependent flip, not more distinct winners.
- No configuration makes a fast probe the per-seed winner.

## Proposals, ranked

1. **Bimodal widths: about 25% long-mid boxes.** With these boxes, fast-low pays on 77% of boxes. The other boxes cost a scrape, not a fall, and extinction stays at 4%. Stop-and-build becomes the best strategy on maps with 2 or more long boxes.
   - Metaphor: momentum usually works. Some steps need you to stop, understand, then cross, and ignoring that costs a near-miss, not doom.
2. **Accept that stopping builds capability (speed), and let width carry box difficulty.** Rise and tallness test nothing, because height saturates.
   - Option: show what the run-up buys, not how tall the box is.
3. **Low-long and floorless boxes are where falls happen.** Keep them rare and make them look long. In the lowLong config, extinction rose from 3% to 17%, and at 2.2× fit nobody survives.
   - Metaphor: learning to fear the shape is earned only if the shape is visible.
4. **Barrier-at-the-face trap.** A tall barrier about 30 in front of a wide box kills the run-up: 50–63% extinction, and only crawl wins. At 70 back it has no effect.
   - Barriers left by stopped labs sit 6 from the face. Move them back by the box's run-up, or make them passable.
   - Metaphor: a guardrail at the cliff edge kills the next lab's run-up.
5. **The no-run-up long box punishes stopping** (smart goes from 26 to 0). Use it rarely and late, as the "no time to think" box. It is lethal (36–45% extinction).

## Cole's rules

- **Scrapes cost a strike: keep.** This rule is load-bearing. Without it, build's share drops from 30 to 22, gamble's rises from 36 to 47, and rush on long-low goes from 36 to 56.
- **Near-max boxes are rare: moot.** Height is never scarce, so rarity changes nothing. The fast-low against fast-high framing needs a real "low" first.
- **Floorless boxes are rare: agree.** Give them a visible long shape.
- **At most 3 stop-and-reverse per map: holds.** p90 is 3, and 3.8% of races go above 3 (base: 3.1%).
- **Barriers are left by stopped labs: challenge where they are placed** (see proposal 4).
- **Occlusion by crawling: not tested.** Crawl wins here by braking for a run-up, not by occluding.

## Limits

- Bot-only, with perfect hands and the BOXU 0.25 timing.
- No probe really plays fast-low.
- There are only 2 draws per seed.
- All hand tracks use one base layout.
- Chill is off.
- The runs took about 20 minutes of wall-clock time and about 108,000 races.
