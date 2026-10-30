# Economy lab: why height saturates, and what makes "fast and low" real

[[ai gen]] Bot-only experiments, 2026-10-29, about 25 minutes of wall-clock time. Not committed. Folder: `economy/`.

## Setup

- Page: `economy/page-econ.html`, which is `scenarios/page-scen.html` (BOXU 0.25 timing) plus four knobs that do nothing at 0 (`economy/mkpage.mjs`):
  - `eRun`: running pays into max speed, `eRun`% of `K.invest` times v/top, every second you move (not while capped).
  - `eDecay`: height lost per second at full pace, from 60% of top upward.
  - `eSum`: height plus max speed may not exceed `eSum`% of the ceiling.
  - `eCapSplit`: the forced split while capped becomes all sight.
- Runners: `diag.mjs` (hand tracks, attributes each height gain to its source), `gen.mjs` (generated seeds, 12 probes, 6 noise draws per seed, steps on or off), `an.mjs` (metrics). Outputs are in `diag1.txt`, `diag2.txt`, and `an-batch1.txt` to `an-batch5.txt`.
- Fast probes are rush, bold and drafter. The classes are fast, build (smart, crawl, runup, climber), careful (scout, balanced, follower, twin) and gamble.

## Cause: barriers hand out height, and running pays nothing

Lines are from `prototype.html`.

1. **Spill.** `spill()` (2344–2357) gives every lab below a cleared barrier up to `b.h*K.spill/100` of height. That includes the crasher itself once it clears a barrier it crashed into. With `barScale` 140 (1899) the walls are tall, so this happens often.
2. **The forced split.** While capped after a crash, `w=[50,50,0]` (2515) sends half of everything to height. At the low capped speed that means investing at nearly the full rate.
3. **Investing is `r = 1 - v/top`** (2515–2519). A lab at pace 0.93 invests about 7% of the time, so its speed meter starves. Its height doesn't, because points 1 and 2 hand height out for free.

Height sources for lab 0, base hand track, 10 draws each (`diag1.txt`):

| Probe | Spill | Capped | Own split |
|---|---|---|---|
| rush | 121 | 29 | 15 |
| bold | 100 | 21 | 41 |
| gamble | 78 | 3 | 79 |
| climber | 28 | 2 | 128 |

**Cole's hypothesis is right for fast labs.** On the hand track rush arrives at 0.96 of its ceiling. That falls to 0.62 with no barriers before the boxes, 0.63 at barScale 70 and 0.68 at spill 0. Slow and height-heavy probes stay at 0.85–0.98 either way, because their own split, which is 32–83% height, fills the meter. So barriers explain most of the saturation for the fast probes and little of it for the rest. The speed starvation is a separate cause, and barriers don't touch it.

## Changes tried (calibration, seeds 0–199, 14,400 races each)

The h and v columns are for rush and bold.

| Change | h rush / bold | v at face (top ~148) | Fast boxes C/S/F | Class win % (fast / build / gamble / careful) | Best-class share, fast | Ext | Lab-0 dissolved |
|---|---|---|---|---|---|---|---|
| base | 0.91 / 0.91 | 62 / 73 | 89/10/0 | 16 / 20 / 30 / 22 | 18 | 2 | 37 |
| A. spill 10, barScale 100 | 0.74 / 0.75 | 68 / 79 | 85/13/2 | 12 / 11 / 41 / 17 | 11 | 7 | 11 |
| A at barScale 70 (spill 33) | 0.68 / 0.69 | 70 / 76 | 79/15/6 | 4 / 8 / 36 / 13 | 3 | 19 | 6 |
| B. eRun 50 | 0.88 / 0.90 | 106 / 112 | 97/3/0 | 13 / 20 / 30 / 20 | 23 | 1 | 39 |
| B + eDecay 15 | 0.69 / 0.73 | 96 / 107 | 93/4/3 | 4 / 22 / 28 / 23 | 5 | 3 | 50 |
| eDecay 25 | 0.38 / 0.47 | 57 / 70 | 44/6/50 | 0 / 16 / 22 / 20 | 0 | 18 | 44 |
| **A + eRun 15** | 0.73 / 0.73 | 92 / 101 | 88/9/2 | 18 / 7 / 38 / 13 | 29 | 9 | 11 |
| A + eRun 30 | 0.73 / 0.73 | 111 / 119 | 91/7/2 | 22 / 6 / 31 / 10 | 46 | 5 | 10 |
| A + eRun 50 | 0.73 / 0.74 | 127 / 132 | 92/6/2 | 21 / 6 / 28 / 8 | 50 | 3 | 10 |
| A + eRun 50 + eDecay 15 | 0.31 / 0.46 | 91 / 108 | 70/5/25 | 4 / 19 / 45 / 29 | 5 | 16 | 16 |
| A + 25% long-mid boxes | 0.75 / 0.75 | 67 / 77 | 77/19/4 | 11 / 17 / 37 / 21 | 8 | 7 | 17 |

Screened on hand tracks only and not run on generated seeds (`diag2.txt`):

- `eSum` 130 is lethal for gamble.
- `eCapSplit` changed nothing.

### Diversity

- All 12 probes are the per-seed best somewhere, in every variant.
- The effective count is 7–10 (base 10.0).
- Split-half agreement on the best class is 48–63%.

At 6 draws, that is still too close to noise to rank the variants on diversity.

## Recommended: A + eRun 15 (spill 10, barScale 100, running pays 15% of the invest rate into max speed)

Held-out results, seeds 3000–3199:

| Metric | Base | A + eRun 15 |
|---|---|---|
| h, rush / bold | 0.91 / 0.91 | 0.73 / 0.73 |
| v at face | 62 / 73 | 90 / 100 |
| Fast boxes C/S/F | 89/10/1 | 88/10/3 |
| Class win %: fast | 13 | 18 |
| Class win %: build | 20 | 7 |
| Class win %: gamble | 31 | 34 |
| Class win %: careful | 21 | 14 |
| Fast as best class | 15% | 34% |
| Extinction | 3% | 9% |
| Lab-0 dissolved | 39% | 11% |

Calibration and held-out agree within about 2 points. Variant A alone on held-out: h 0.75, fast boxes 84/13/3, fast wins 11%.

**Metaphor.** The spec says "sight and height are your controls and safety. Max speed is capability." Barriers are the public lessons in the briefings.

- Lower spill means each lab learns its own lessons, which is the Hard Lessons twist made the default.
- eRun means capability grows from racing itself (scaling by doing), while safety still has to be bought by holding back. That fits.
- eDecay ("racing burns your safety margin") also fits, but it kills fast labs at the walls.

## Steps-off side effects (seeds 0–199, 2 draws, 4,800 races)

| Variant | Extinction | Lab-0 dissolved | Fast wins | Careful wins |
|---|---|---|---|---|
| base | 13% | 18% | 5% | 28% |
| A | 18% | 9% | 5% | 30% |
| A + eRun 15 | 3% | 9% | 12% | 18% |

Any of these changes `check/reference.json` hashes, because it is a rule change.

## Open problems and what would show this wrong

- Fast clears 88% of boxes cleanly, not 75%. The boxes are now too easy for a fast lab. Next step: pair the change with taller or longer boxes, then re-measure.
- Build wins collapse from 20% to 7%. Stop-and-build no longer pays.
- Wrong if a 2-draw re-run on new seeds puts fast below 15% or build back near 20% (then eRun isn't doing the work).
- Wrong if a human playing fast still arrives above 0.85: the bots never stop for walls the way humans do.
