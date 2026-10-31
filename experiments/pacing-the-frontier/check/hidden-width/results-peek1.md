# Hidden width: one box, three postures

[[ai gen]] 2026-10-30. Bot play only, perfect hands, BOXU 0.25. 20 widths x 3 posture rotations = 60 races, 4 ms a race. Sight shadow on, jump peek on. Segment length 60, barriers before the box at 0.4 and 0.5 of the reference barrier. Box rise 49 (0.7 of ceiling 70), stop-and-build fit 51, widths 31 to 132 (0.6 to 2.6 x fit). Page: page-hidden.html (see patch.mjs). Runner: hidden.mjs.

| Posture | Races | Clean | Scrape | Fall | Refused | Went blind | Height at face | Speed at face | Saw the box at | Hops | Left a barrier | First across | Won | Extinction (races) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| rush | 60 | 30% | 15% | 55% | 0% | 100% | 60 | 67 | 138 | 3.7 | 0% | 45% | 45% | 5% |
| build | 60 | 45% | 5% | 0% | 25% | 0% | 70 | 71 | 138 | 3.7 | 25% | 5% | 5% | 5% |
| wait | 60 | 50% | 15% | 0% | 30% | 0% | 60 | 86 | 138 | 3.7 | 25% | 20% | 20% | 5% |

"Refused": knew the width and stood to the time limit because a fall was certain even at the ceiling and top speed. "Went blind": passed the point where it could still stop short of the face (or reached the face from a standstill) without knowing the width. "Extinction" is the share of that posture's races in which anyone's fall ended the run.

## By width (wf = width / stop-and-build fit). Each cell: clean / scrape / fall counts over 3 races, then wins

| wf | W | rush | build | wait | extinct | time-outs |
|---|---|---|---|---|---|---|
| 0.6 | 31 | 3/0/0 w3 | 3/0/0 w0 | 3/0/0 w0 | 0 | 0 |
| 0.71 | 36 | 3/0/0 w3 | 3/0/0 w0 | 3/0/0 w0 | 0 | 0 |
| 0.81 | 41 | 3/0/0 w3 | 3/0/0 w0 | 3/0/0 w0 | 0 | 0 |
| 0.92 | 47 | 3/0/0 w3 | 3/0/0 w0 | 3/0/0 w0 | 0 | 0 |
| 1.02 | 52 | 3/0/0 w3 | 3/0/0 w0 | 3/0/0 w0 | 0 | 0 |
| 1.13 | 57 | 3/0/0 w3 | 3/0/0 w0 | 3/0/0 w0 | 0 | 0 |
| 1.23 | 63 | 0/3/0 w3 | 3/0/0 w0 | 3/0/0 w0 | 0 | 0 |
| 1.34 | 68 | 0/3/0 w3 | 3/0/0 w0 | 3/0/0 w0 | 0 | 0 |
| 1.44 | 73 | 0/3/0 w3 | 3/0/0 w0 | 3/0/0 w0 | 0 | 0 |
| 1.55 | 79 | 0/0/3 w0 | 0/0/0 w0 | 3/0/0 w3 | 0 | 0 |
| 1.65 | 84 | 0/0/3 w0 | 0/0/0 w0 | 0/3/0 w3 | 0 | 0 |
| 1.76 | 89 | 0/0/3 w0 | 0/0/0 w0 | 0/3/0 w3 | 0 | 0 |
| 1.86 | 95 | 0/0/3 w0 | 0/0/0 w0 | 0/3/0 w3 | 0 | 0 |
| 1.97 | 100 | 0/0/3 w0 | 0/3/0 w3 | 0/0/0 w0 | 0 | 0 |
| 2.07 | 106 | 0/0/3 w0 | 0/0/0 w0 | 0/0/0 w0 | 0 | 3 |
| 2.18 | 111 | 0/0/3 w0 | 0/0/0 w0 | 0/0/0 w0 | 3 | 0 |
| 2.28 | 116 | 0/0/3 w0 | 0/0/0 w0 | 0/0/0 w0 | 0 | 3 |
| 2.39 | 122 | 0/0/3 w0 | 0/0/0 w0 | 0/0/0 w0 | 0 | 3 |
| 2.49 | 127 | 0/0/3 w0 | 0/0/0 w0 | 0/0/0 w0 | 0 | 3 |
| 2.6 | 132 | 0/0/3 w0 | 0/0/0 w0 | 0/0/0 w0 | 0 | 3 |

## Not shown
- Humans. Every lab here has perfect hands and presses at the clean point of the arc.
- The bar. Nothing draws the hidden far edge; this is the sim rule only.
- Barriers before the box are the same in every race, so arrival height varies only by posture and by the random bot draws of the seed.
- While a lab is blocked by a tower it cannot clear, the page's own bot plan drives it, and that plan still reads the true width.
