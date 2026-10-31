# Hidden width: do three postures come apart at one box?

[[ai gen]] 2026-10-30. Bot play only. Status: `verified` (the runner reproduces the tables), nothing `human_validated`. Nothing in `prototype.html` changed; the patched copy is `page-hidden.html`, built by `patch.mjs` from the scenario lab's page (BOXU 0.25 timing). Runner: `hidden.mjs`. Tables: `results-main.md`, `results-shadow.md`, `results-long.md` (each with a `.jsonl` of every race).

## The question

If a box's far edge is hidden until you can see over it, do "go now", "stop and build until you can see", and "wait for a rival to go first" produce different outcomes? One box, three labs, one posture each.

## The rule added

A box's far edge is hidden from a lab until it can see the whole top of the box, or until any lab has crossed, scraped or fallen there. The near face, the rise, and the physics are unchanged.

Second version (2026-10-30 evening, after Cole asked for a gradual reveal). With the eye (height plus body) above the box top, the top surface is in view from the face out to `(eye − rise) / SEEANG` from the lab (`C.SEEANG` 0.15, about a 9 degree grazing angle), never past sight range, and never into a rival's shadow. So "at least N wide" grows as you close in or get taller, and the far edge appears when N reaches the true width. Wide boxes stay uncertain longest. The first version hid the edge until the sight line over the top reached the ground beyond it, which hid narrow boxes longest and gave no gradual signal; that is why Cole saw nothing until he was inside braking distance.

A box face shows through a rival's shadow when its top stands above the sight line over that rival's head. That is how a tall box (a beacon) is seen from a trailing position by a lab with enough height or sight, while a low box behind the same rival stays hidden. Nothing is public from the start any more.

## Setup

- Track: gate, two low barriers (0.4 and 0.5 of the reference barrier), 60 of ground, run-up, one box, 150 to the finish. No singularity.
- Box: rise 49 (0.7 of the 70 ceiling). Width 31 to 132, twenty steps, 0.6 to 2.6 times the stop-and-build fit of 51 (the fit still uses peak timing, so clean crosses run to about 1.45 times it).
- Labs: identical cruise policy (pace 0.7, split 20/50/30 sight/height/speed, perfect hands) until the box is next. Then: **rush** floors it; **build** stops 270 short, builds height, creeps until it sees the far edge, then takes the run-up a clean cross needs, refusing if a fall is certain even at the ceiling and top speed; **wait** stops at the same spot building speed, goes once a rival has shown the width or it can see it, and after 15 s behaves like build.
- Each width runs three times with the postures rotated over the three lab slots: 60 races. Sight shadow off in the main table, so each posture gets its own look.

## The table (main: short segment, shadow off)

| Posture | Clean | Scrape | Fall | Refused | Blind at commit | Height at face | Speed at face | First across | Won |
|---|---|---|---|---|---|---|---|---|---|
| rush | 30% | 15% | 55% | 0% | 100% | 60 | 67 | 45% | 45% |
| build | 57% | 3% | 0% | 47% | 0% | 70 | 66 | 3% | 3% |
| wait | 50% | 10% | 8% | 27% | 0% | 63 | 77 | 12% | 12% |

Extinction ended 5% of races (one seed's roll, the same roll in all three rotations). "Blind at commit": past the point where it could still stop short of the face without knowing the width. "Refused": knew the width and stood to the time limit.

By width: rush wins every race up to 1.44 times the fit (clean to 1.13, scrapes from 1.23) and falls in every race from 1.55 up. Build never falls: it crosses from 1.55 to 1.76 and refuses from 1.86. Wait crosses clean or with a scrape from 1.55 to 1.76 and wins those, then refuses. From 1.86 up nobody finishes and the race times out.

## What it says

1. **The postures come apart, in the direction the metaphor wants.** Caution is pure cost on narrow boxes and the only way to live on wide ones. The rusher never knows which it is facing.
2. **The rusher is always blind at commit.** At 60 height and 67 speed, its braking point comes before the far edge is in view, for every width tried. That is the "we simply do not know" moment, and it is produced by sight geometry, not by a knob.
3. **Waiting beats building.** Wait crossed more, scraped more and won four times as often as build, because the rusher's body shows it the width for free and the scrape strike does not matter in a one-box race. The free-rider posture pays. The rusher's death costs the waiter nothing: extinction at the first gap rolls at 4 percent.
4. **Nobody wins past 1.86 times the fit.** The rusher dies, the others refuse, the clock runs out. The sim has no score for "survived and did not finish". That is the open scoring question from the 27 October design notes, and this is where it bites.
5. **Height is still free.** Even with low barriers and a 60-long segment, every lab reached the box at 60 to 70 of the 70 ceiling. The gate does it: each lab clearing the 52-tall gate spills up to 17 of height to the others, and the cruise split fills the rest. The long-segment run (`results-long.md`) puts everyone at 70. Barrier height before the box did not move arrival height; the gate and the split did.
6. **With the shadow on** (`results-shadow.md`, the game's rule), build and wait went blind 47 and 41 percent of the time and fell 17 and 23 percent. A follower behind an equal-height leader cannot see the box until the leader moves aside, by which time it is past its braking point. Those are forced falls with no decision in them, which is the occlusion kill the audit measured.
7. **Wait's 8 percent of falls** all came after it had stood near the face, left a barrier there, and then could not back up past its own barrier for the run-up (the back-limit rule). The stopped-lab barrier traps its own maker.

## Play it by hand

`page-hidden.html?hidden=1` is the same one-box track, playable. Built by `build.sh` (sim patches, then `patch-ui.mjs`). Serve the repo folder over http (a `file://` load drops the query string) and open:

`/experiments/pacing-the-frontier/check/hidden-width/page-hidden.html?hidden=1`

- The box's far edge is drawn only once you can see it: before that it is a face with its top fading out, a `?`, the label "box · width unknown", and the jump bar reads "your jump now: unknown · reach N" (how far your jump carries, which you do know). The hint line under the meters says the same instead of naming the width.
- Width is drawn from the seed, 0.6 to 2.6 times the fit. `&seed=N` fixes the track, `&wf=1.8` fixes the width (handy for a known-lethal box). New run draws a new seed.
- Steps on, chill off (hand jumps), unless `&chill=1`. Three rivals play the three postures and are named for them: Rush, Build, Wait. They cruise like the probes (pace 0.7, split 20/50/30) until the box is next.
- To play a posture yourself: rush is Floor it; build is stop about 270 short, Build with the triangle on Height, creep until the far edge appears, then take a run-up; wait is stop short, build Max speed, and go once Rush has shown you the edge.
- `&boxes=3` (1 to 6): several boxes in a row, each at its level's ceiling. With more than one, each box is a beacon with probability one half. A beacon is a tall box (ceiling plus 0.6 of a jump, so its top stands above a lab at the ceiling) and thin (0.6 to 1.1 times the fit). It shows over rivals' heads from a trailing position, by line of sight, but nobody can see over it, so its width is learned only from a rival's crossing. A lone box is always devious: low, any width. Nothing is public from the start. Cole's call, 2026-10-30: beacons are tall boxes, not permanently visible ones.
- The box is drawn as far as you can see its top ("at least N wide"), then fades. The bar shows the widest box your jump as it stands clears clean (blue) and with a scrape (orange), so you can ease off as soon as "at least N" passes your clean reach.
- Two more sim rules on this page only, from Cole's second play (2026-10-30, "they are stuck", "they aren't backing up"): the barrier a stopped lab leaves at a box face no longer limits backing up, so a lab that stood close to look can still make room for its run-up; and when nobody has finished and every lab still in the race has stood still for 12 s, the run ends at once as a time-out ("Nobody will cross") instead of running the 300 s clock. The bots' planner was also rewritten: a bot judges a box against what its ceiling allows (full height, full speed meter), fills the speed meter first, backs up for the run-up the target speed needs, and refuses only when a fall is certain even then. Before that it would go the moment it knew the width, with an empty speed meter, and fall.
- The crash and scrape cap now ends after a distance or after `K.capSecs` (5) seconds, whichever comes first, so a lab standing still while capped is not stuck under the forced half-sight half-height split. Cole hit that deadlock on 2026-10-30 (full sight and height, max speed stuck). The node harness has the same rule; the one-box tables did not change.
- Checked by driving races in a browser: one box (Rush first across at 13 s, Build and Wait crossing once the width went public, Rush winning) and three boxes at a crossable width (all three bots crossed all three boxes, Rush won). Cole's own play is in the section below.

## Human play, 2026-10-30 (`human_validated`)

Cole played the hidden box by hand and called it "almost precisely what I was hoping for": it makes you want to invest in sight. Not every map should have it. One problem: following the pack closely, the rivals' sight shadow hid the box, so he could not brake. His answer was to get in front by investing in speed and height, then dump everything into sight so he could see the box in time to stop. That saved him and the Steward; a pack that stays together dives into the box together. That is the leader's shadow doing what Cole's occlusion rule says it should, and in play it reads as "do not tailgate into the unknown".

## Jump peek (2026-10-30, Cole's call; `verified`, not `human_validated`)

Cole's problem in play was the pack: behind a rival of equal height the box face stays hidden until it is too late to brake. Rule added (`patch.mjs` section 8, knob `K.peek`, on by default): in the air a lab's eye is at its jump height, so it sees box faces (and barriers) over a rival's head. Width is still judged from the standing eye, so a peek says "a box, this tall" and never how wide. Cole agreed to face-only. Humans can jump anywhere already, so nothing changes in the controls.

Bots peek too, with a delay set by their sight (Cole's addition): shadowed, and the next box not yet seen, they hop. At the top of the hop they remember how far they could see (`l.peekTo` = position + sight range), and they hop again only when that point comes within their braking distance plus 40. Low sight means frequent peeks, high sight means rare ones. They never hop next to a known barrier.

One-box track, sight shadow on, 60 races each (`results-peek0.md` off, `results-peek1.md` on; `node hidden.mjs --n 20 --wlo 0.6 --whi 2.6 --L 60 --occlude 1 --peek 0|1`):

| Posture | Fall, off → on | Went blind, off → on | Saw the box at, off → on | Won, off → on |
|---|---|---|---|---|
| rush | 55% → 55% | 100% → 100% | 113 → 138 | 37% → 45% |
| build | 17% → 0% | 45% → 0% | 99 → 138 | 3% → 5% |
| wait | 17% → 0% | 42% → 0% | 82 → 138 | 22% → 20% |

The careful postures stop running blind into the box behind a rival; they match the shadow-off table. Rush still floors it, so it is unchanged. Each lab averages about 2.7 extra hops a race ("Hops" counts barrier jumps too). Everyone sees the box at the same distance with the peek on, because a peek and a rival's look at the same moment make the face public (the existing two-labs-in-sight rule). So a peek helps the whole pack, not only the hopper.

Not tested: the crawl-at-the-face occlusion trick (a peek over a lab crawling within about 21 of the face should still miss it, by geometry); whether a human hops nonstop instead of timing a peek; whether a rival mid-jump should cast a taller shadow (it does not: only the viewer's eye rises). Checked in the browser: standing 25 behind an equal-height rival the face is hidden, at the top of a jump it is in view and the width is still unknown; a full race on Cole's seed ran with no errors, bots peeked 2 to 4 times each.

## What would show this wrong

- A human rusher who slows when the far edge is out of view. Then rush is not rush, and the blind commit disappears.
- A box low enough that a cruising lab sees the far edge before its braking point. Then the postures converge; rise 49 against an eye of 78 was enough to prevent it here.
- The same table with the box as the last of four, where strikes from scrapes and the 40 percent cap share change who wins.

## Not shown

- Humans, the bar, and any drawing of the hidden edge.
- Strikes carried across boxes, the singularity, the campaign.
- Postures beyond these three hand-written ones; a rush that reads the box's rise, or a build that creeps from the start, would behave differently.
- The fit is the old peak-timing fit; the "wf" scale is a label, not a difficulty.
