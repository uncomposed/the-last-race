# Playtest data book: six drawn maps (issue 36, after step 2)

[[ai gen]] Written by Claude (playtest lead session), 2026-11-07. Status: the harness is `implemented`; every number here is `verified` (bot runs, reproducible at the end). No person has played these maps. Nothing here is `human_validated`.

## The short version

1. **Six maps to play, in this order:** drawn maps 6, 37, 180, 85, 164 and 72. The links and questions are in the test sheet at the end.
2. **I played every candidate before you.** That meant bot traces under human-lag keys on 20 seeds each, the page in the browser at the key moments, and a held-out check on seeds 9701-9720 that I didn't look at while choosing.
3. **Cut from step 2's six:** maps 9, 11 and 35, for dead time, no decision and an empty race. I also dropped map 4: its opening is identical to map 164's, and 164 is the cleaner of the two. To replace them I screened 240 draws (step 2 had looked at 40).
4. **All six pass the frustration screen on the held-out seeds.** Nobody stands still for over 15 s, rivals stay in the race, no rival's dice end the world, and the median win takes 29 to 56 s.
5. **Five of the six are maps I'd stake my judgement on as fun.** Map 180 is a deliberate control: your usual style wins it, so it tests whether a map is still fun when the habit is enough.
6. **Each map comes with a prediction, and the cross-map hypotheses each say which of your answers would prove me wrong.** A bland or frustrated answer is as useful as a fun one.

## 1. What makes a race fun or frustrating: the factor list

Each factor has a source, the proxy I measured, and the bar I used. A proxy is a bot number, not proof that a person enjoys anything.

| # | Factor | Source | Proxy here | Bar |
|---|---|---|---|---|
| F1 | **Interesting decisions, no dominant line.** If one build and one pace win everywhere, there's nothing to decide. | Meier 2012; Hunicke et al. 2004; your note that filling height and speed then flooring it made round 1 boring | maxout's win share; the cruiser's (sp-hs-slow or sp-even-slow); how many of the 8 bots win half their races | soft: maxout ≤ 0.5 |
| F2 | **Outcomes you can see and that matter later.** A choice made mid-race should change who wins. | Salen and Zimmerman 2004 (meaningful play) | c′: the best generic bot's wins minus the half-distance leader's | ≥ 0.23 on two seed blocks |
| F3 | **Challenge that fits, and a habit that gets interrupted.** Flow needs the task to stay just ahead of the player. | Csikszentmihalyi 1990; Chen 2007; Sweetser and Wyeth 2005; your Two Endings playtest | the moment your own style (bot coleFollow) stops working; expected tries | 1 to 3 tries |
| F4 | **Frequent small decisions.** Walls that force height and barriers right behind boxes. Long empty stretches feel bland. | Swink 2008; Cook 2007; your issue 36 comment on PR 38's variants | a2′: coleFollow's control changes per minute | ≥ 33.9 |
| F5 | **Failure that teaches.** A loss should point at something you can do differently next time. | Juul 2013; Gilleade and Dix 2004 | for each strike or fall: could the lab have stopped or jumped once the obstacle came into view? Tagged HIDDEN (no) or FAST (it chose to outrun its sight), then a look in the browser | a hit with no fair counterplay is a cut |
| F6 | **Skill over dice.** Dice that decide after you've acted (output randomness) feel unfair. Dice you plan around (input randomness) are fine. | Burgun (input vs output randomness); Costikyan 2013 | share of races a rival's fall ends the world | ≤ 0.20 (S6) |
| F7 | **Rivals who look like they're playing.** An AI that throws itself away reads as stupid, and a race with no rivals left is empty. | Johnson 2008; your note that a draw where every rival dies is bad | alone (the share of the race after the last rival is out); all rivals out with no world end | alone ≤ 0.10, all out ≤ 0.35 (S4) |
| F8 | **No dead time.** Waiting with nothing to decide is the classic blocked-goal frustration. | Gilleade and Dix 2004; Sweetser and Wyeth 2005 | races with a stop longer than 15 s | ≤ 0.10 (S5) |
| F9 | **Cheap retries.** A failure costs more the longer it takes to get back to it. | Juul 2013 | median winning time | ≤ 75 s (S7) |
| F10 | **More than one way to win** (competence and autonomy). | Ryan, Rigby and Przybylski 2006 | how many different bots are best across the set; does your style win anywhere | ≥ 4 different best bots |
| F11 | **Uncertainty kept until late, and an end you can't see.** | Costikyan 2013; your note that knowing where the map ends makes holding back trivial | hidden finish on the map | a mix of hidden and shown finishes, so the mix can be tested |

The "your note" entries are paraphrases of what you said about earlier maps, from the step 1 label file. They aren't quotes.

Sources:

1. Csikszentmihalyi, M. (1990). *Flow: The Psychology of Optimal Experience*. Harper and Row.
2. Chen, J. (2007). Flow in games (and everything else). *Communications of the ACM* 50(4), 31-34.
3. Sweetser, P. and Wyeth, P. (2005). GameFlow: a model for evaluating player enjoyment in games. *Computers in Entertainment* 3(3).
4. Meier, S. (2012). Interesting decisions. GDC talk.
5. Hunicke, R., LeBlanc, M. and Zubek, R. (2004). MDA: A formal approach to game design and game research. AAAI Workshop on Challenges in Game AI.
6. Salen, K. and Zimmerman, E. (2004). *Rules of Play*. MIT Press.
7. Juul, J. (2013). *The Art of Failure*. MIT Press.
8. Gilleade, K. and Dix, A. (2004). Using frustration in the design of adaptive videogames. ACE 2004. doi:10.1145/1067343.1067372
9. Burgun, K. Essays on input and output randomness, keithburgun.net.
10. Costikyan, G. (2013). *Uncertainty in Games*. MIT Press.
11. Johnson, S. (2008). Playing to lose: AI and Civilization. GDC talk (slides at designer-notes.com).
12. Ryan, R., Rigby, C. S. and Przybylski, A. (2006). The motivational pull of video games: a self-determination theory approach. *Motivation and Emotion* 30, 347-363.
13. Swink, S. (2008). *Game Feel*. Morgan Kaufmann.
14. Cook, D. (2007). The chemistry of game design. Gamasutra.
15. Koster, R. (2004). *A Theory of Fun for Game Design*. Paraglyph. (Fun as learning a pattern, boredom once it's mastered. This is the background for F1 and F3.)

## 2. How I judged the maps

1. **Harness.** `gen/play.mjs`, new in this branch, races the drawn maps with the step 1 bots under human-lag keys (`ship/hdnode.mjs`). For each race it logs:
   - every strike and fall, how many seconds of warning the player had, and a HIDDEN or FAST tag;
   - the longest stop;
   - when each rival went out and how;
   - the share of the race run alone.

   `--trace` prints one race second by second, so you can see where a strategy breaks.
2. **Frustration screen.** I wrote the rules down before drawing any maps beyond the six:
   - S1: the cruiser wins ≤ 0.5.
   - S2: maxout wins ≤ 0.5.
   - S3: the best generic bot wins ≥ 0.5.
   - S4: alone ≤ 0.10, and all rivals out (no world end) ≤ 0.35.
   - S5: a stop over 15 s in ≤ 0.10 of races.
   - S6: a rival's fall ends the world in ≤ 0.20 of races.
   - S7: median winning time ≤ 75 s.
3. **The screen's calibration failed on three rules, and I'm reporting that.** Run on the 10 shipped maps you validated, the seven rules pass only Elbows:
   - S1 rejects 4 of your fun maps (Steward, Takeoff, Red Box, Two Endings).
   - S3 rejects 4.
   - S2 rejects 2 (Takeoff, The Ladder).
   - S6 rejects Red Box, which is its lesson.

   So S1, S2, S3 and S6 are warnings, not cuts. **S4, S5 and S7 pass all 10 shipped maps, and they're the hard cuts.**
4. **Funnel.** I screened draws 1-240 on seeds 2001-2012, and 59 passed the hard cuts.
   - Draws 1-120: 27 passed. I ran step 2's fun filters (c′, a2′ and the rival rail, on seeds 1001 and 9601) on the 24 that step 2 hadn't already tested.
   - Draws 121-240: 32 passed. To save CPU, I ran the fun filters only on the 9 that also passed the warning rules.
   - Ten passed the fun filters on both blocks: 62, 63, 72, 85, 114, 135, 154, 164, 180 and 198.
   - With step 2's six (4, 6, 9, 11, 35, 37), that made 16 candidates. I read the per-incident log of all 16, and traced or opened in the browser the ones that reached the shortlist.
   - The final six then ran on seeds 9701-9720, which I hadn't used for any choice.
5. **Where the bots mislead, and how I corrected for it:**
   - **coleFollow falls into shown boxes on purpose-built maps (85 and 180).** That's bot error. The page tells you "your jump now: fall" and shows the box width, so a person waits. I checked this in the browser on map 180.
   - **Scripted bots can't use information they weren't built for.** When I made every box public to stand in for a second try, the bots stalled for 300 s. So "second-try" numbers here are my judgement, not bot output.
   - **Generic knobs.** All bots use one set of key-driver knobs, not tuned lesson bots. On the shipped maps these knobs win little. On the drawn maps they win a lot more, which predicts the drawn maps are easier (hypothesis H6).
   - **Your style.** coleFollow follows at sight range and builds sight, then speed. It doesn't do your out-building of a stopped leader well. Its losses on maps 6 and 37 are real habit losses. Its loss on map 85 isn't (see that map).

## 3. The six maps: predictions

Win shares are from the held-out seeds 9701-9720, 20 races per bot. "Your style" is the bot coleFollow.

| # | Map | Rivals and patterns | Winning line, in one sentence | Your style wins first try? | Expected tries | The interruption, and what you should feel | Top frustration risk | Predicted verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | **[6](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=6)** | the Warden; signs, tower, height gate, scrape-only box; finish shown | Build height before speed, pass the Warden while it stops at the tall tower box, then climb the wall staircase (139 to 164). | No (bot 2 of 20) | 2 | About 30 s in, the tall box at 2054 hides a 139 wall, and four more walls climb behind it. You should feel caught short of height, then see the pass: the Warden stops there too. | A strike at the hidden wall behind the tower on try 1. | **Fun, 55%** (bland 35%: four height-first bots win 19 or 20 of 20, so it may be easy once you've seen it) |
| 2 | **[37](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=37)** | the Pioneer; wall behind the box, pothole rhythm, hidden wall, height gate; finish hidden | Build some height for the opening wall (108), run the rhythm, and keep building height through it for the late staircase (134 to 165). | No (bot 1 of 20; the Pioneer wins 19) | 2 | About 30 s in, after a fast stretch of small boxes, a shaded box at 2173 hides a 134 wall, and the walls keep climbing. Same lesson as map 6, but it arrives when you're built for speed. | The opening wall at 521 if you start at the default split (most bots strike it), and the hidden wall at 2301. | **Fun, 55%** (bland 30%, frustrating 15%) |
| 3 | **[180](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=180)** (control) | the Warden; scrape-only boxes, wall behind the box, hidden wall; finish shown | Follow the Warden, let it cross the two wide shown boxes first (they narrow behind it), and pass it when it over-builds at the third box. | **Yes** (bot 11 of 20; its 9 losses are falls into a shown box, which is bot error) | 1 | Weak on purpose. About 8 s in, the Warden stops at the first wide box, and the readout says your jump is a fall. You wait. The pass comes around 40 s. | The tall shaded box at 2204 with a 137 wall behind it, near the end. | **Bland, 50%** (fun 40%). This is the control: your habit already wins. |
| 4 | **[85](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=85)** | the Pioneer; double box, scrape-only box, pothole rhythm; finish hidden | Clear the double box, hold at the wide box (1112) until the Pioneer crosses and narrows it, then floor it through the rhythm and pass before the unseen finish. | Likely (the bot wins 0 of 20, but it waits too long after the box and then cruises; I judge that bot error, see H4) | 1 or 2 | About 13 s in, at the wide box. The moment that matters is the Pioneer landing: following has to turn into racing at once. | Jumping the wide box anyway. That's a 20% roll, and in bot races it ended the world 1 to 4 times in 20. | **Fun, 55%** (bland 30%, frustrating 15%) |
| 5 | **[164](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=164)** | three sprinters (Kite, Rook, Jack); hidden wall, signs, height gate, stakes; finish hidden | Skip sight, build height and speed, take or creep past the wall hidden behind the first tall box, then outrun the sprinters where they brake for the late boxes. | No (bot 0 of 20, no falls; it's simply slower) | 2 or 3 | About 9 s in, the wall behind the tall box at 406 strikes nearly everyone, rivals included. The real turn comes around 25 to 35 s, when the sprinters brake and a speed build passes them. | Only speed builds win (hs-eyes 17 of 20, hs-tail 10, s-bold 8), and builds with sight win 0 or 1. The margin is a few metres, so a near miss may feel arbitrary. | **Fun, 50%** (frustrating 30%, bland 20%) |
| 6 | **[72](https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=72)** | three sprinters; height gate, wall behind the box, hidden wall; finish shown | Build height and speed and race the sprinters flat out (they never stop), accept or dodge the early strike in their shadow, and keep 101 height for the last wall behind the tower. | No (bot 0 of 20; following never works when the leaders don't stop) | 2 | About 6 s in, wall 2 (103) is hidden in the pack's shadow, the mechanic you validated. The second one comes around 25 s: a tall box at 1795 with a 135 wall behind it. | Flooring it is close to the whole answer (maxout 13 of 20, hs-eyes 14), so it may feel like no decision. | **Fun, 45%** (bland 40%, frustrating 15%). It's 30 s long. |

Variety across the six: four different best bots (hs-slow, hs-tail, hs-eyes and maxout), three rival types (Warden, Pioneer and the sprinters), and three hidden finishes against three shown.

### Held-out numbers behind the table (seeds 9701-9720)

| Map | Your style | maxout | Cruiser | Best bot | Alone | Rivals all out | Stop > 15 s | World ended by a rival | Median win (s) | Hit tagged HIDDEN |
|---|---|---|---|---|---|---|---|---|---|---|
| 6 | 0.10 | 0.00 | 1.00 | sp-hs-slow 1.00 | 0.01 | 0.06 | 0.00 | 0.01 | 55 | 0.11 |
| 37 | 0.05 | 0.00 | 0.75 | sp-hs-slow 0.75 | 0.03 | 0.05 | 0.00 | 0.00 | 47 | 0.16 |
| 180 | 0.55 | 0.00 | 0.00 | sp-hs-tail 0.60 | 0.00 | 0.00 | 0.00 | 0.00 | 56 | 0.00 |
| 85 | 0.00 | 0.15 | 0.00 | sp-hs-tail 0.55 | 0.01 | 0.05 | 0.01 | 0.00 | 45 | 0.00 |
| 164 | 0.00 | 0.00 | 0.05 | sp-hs-eyes 0.85 | 0.00 | 0.00 | 0.00 | 0.00 | 42 | 0.15 |
| 72 | 0.00 | 0.65 | 0.50 | sp-hs-eyes 0.70 | 0.00 | 0.00 | 0.00 | 0.00 | 29 | 0.38 |

Every map passes the hard cuts (S4, S5, S7), and S6 too. Warnings: S1 on maps 6 and 37 (the cruiser wins), and S2 on map 72 (maxout wins). The calibration above showed your fun maps trip these same warnings. On map 72, the HIDDEN share is the pack-shadow strike at wall 2. Map 164's first strike can be avoided once you know it's there. I checked this on map 4, which has the same opening (I didn't open 164 itself): in the browser, box 1 hides the wall behind it ("sight 218, shadowed by the tall box"), and crossing slowly (about speed 30) stops in about 40 against a 93-long landing strip.

## 4. Cross-map hypotheses, and what would prove each one wrong

1. **H1. Height gates interrupt your sight-then-speed habit** (maps 6 and 37). You lose try 1 on both, and the moment you name as interesting is the wall staircase.
   - **Wrong if** you win either map on try 1 with your usual build, or name a different moment on both.
2. **H2. A map your habit already wins feels bland** (map 180). You win on try 1 and call it easy or bland.
   - **Wrong if** you win on try 1 and call it fun. That would mean the lesson doesn't need to beat your habit for a map to be fun.
   - If you *lose* map 180 on try 1, my model of your habit is wrong instead, and H3 takes the hit.
3. **H3. The bot predicts your first try.** On maps where coleFollow wins at least half (180), you win try 1. Where it wins 10% or less (6, 37, 164, 72), you lose try 1. Map 85 is left out on purpose (see H4).
   - **Wrong if** 2 or more of those 5 maps go the other way.
4. **H4. coleFollow's loss on map 85 is the bot's fault, not the map's.** You win map 85 within 2 tries by waiting for the Pioneer.
   - **Wrong if** you need 3 or more tries, or you waited and still lost. Then I was wrong to overrule the bot, and the after-box race matters more than I thought.
5. **H5. Early shadow strikes feel fair** (map 164's first wall, map 72's wall in the pack's shadow). You may take a strike, but you don't call either unfair.
   - **Wrong if** you call either strike unfair or cheap.
6. **H6. The drawn maps are easier than the campaign.** Generic bots win far more here than on your shipped maps. Prediction: your median tries across the six is 2 or fewer, and you call none of them frustrating.
   - **Wrong if** your median is 3 or more, or 2 or more maps get "frustrating".
7. **H7. The frustration screen catches what frustrates you.** None of the six is frustrating.
   - **Wrong if** any map gets "frustrating". The moment you name is then what the screen misses.
8. **H8. A hidden finish helps** (37, 85 and 164 hidden; 6, 180 and 72 shown). Of the maps you call fun, most are hidden-finish maps.
   - **Wrong if** you call more shown-finish maps fun than hidden-finish ones.
   - This is the weakest test: six maps, and the finish isn't the only difference between them.

## 5. What I cut, and why

| Map | Cut for | Evidence (seeds 2001-2020, or 2001-2012 for 135, 154 and 198) |
|---|---|---|
| 9 | Dead time (F8) | The Warden stands about 40 s at a 189-wide scrape box sized to the full ceiling. 23% of races have a stop over 15 s (shipped maximum: 8%), and followers' races last 105 to 125 s. |
| 11 | No decision (F1) | All 8 bots win at least half, and maxout wins 95%. Deuce dissolves at the opening bait walls every race, whatever you do. |
| 35 | Empty race (F7) | The bait rivals (one strike each) die at the first walls before you can lead them, in 73% of races. Then about 60 s is raced alone. |
| 4 | Overlap, not frustration | Same opening as 164 (a tall shaded box at about 406 with a wall behind it). It stacks six patterns, and its rhythm pothole sometimes kills the Pioneer. 164 is the cleaner use of that opening. |
| 62 | Forced strike, short | Nearly every bot strikes at the first obstacle (a shaded tower at 700), and coleFollow falls there 9 times in 20. maxout wins 14 of 20, and the road is only 2077 long. |
| 63 | Overlap and length | Same lesson as 6 (pass the Warden) and the same first-box gotcha as 164. Winning races take 56 to 61 s, and a 40% box near the end risks the world. |
| 114 | Too easy, overlap | Six bots win half or more. Its opening fence is identical to 37's. |
| 135 | Length | Median win 74 s, at the limit. A third Warden map. |
| 154 | Dice at the end (F6) | A 40% box at 5305, near the finish of a 5699 road, ends the world in up to 7 of 12 races for some bots, after 80 s of racing. |
| 198 | Overlap, many strike-outs | A third "wait at the wide box" map (with 85 and 180), and generic bots strike out (three strikes) in 4 or 5 of 12 races. |

## 6. Generator follow-ups (not changed in this branch)

I didn't change the generator. The six don't need it, and any change would redraw every seed and break the step 2 links. These are worth a later pass:

1. **Bait rivals die on their own.** With one strike, they die at the first walls when the bait block comes early (35, 11). In Red Box, the red box follows straight away.
2. **Steward plus a box at the edge of the ceiling's reach makes a standing contest** (9).
3. **Stock openings.** The hidden-wall block and the fence block, placed first, give different seeds the same first 500 metres (4, 62, 63 and 164; 37 and 114).
4. **A high-odds box (40%) late in a long road** turns a skill race into a dice roll (154, 63).
5. **Drawn maps suit the cruiser** more than the campaign does (H6 will say whether that shows in play).

## 7. Test sheet

Six maps, about 2 tries each, under a minute a try. Play them in this order. For each map, answer the three questions by voice; the numbers let you say "map 2, question 3: ...". Skip any question you like.

1. **Map 6:** https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=6
   1. How many tries to win, or did you give up?
   2. One word for it.
   3. Did the wall staircase after the tall box catch you short of height? Was anything unfair?
2. **Map 37:** https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=37
   1. How many tries to win, or did you give up?
   2. One word for it.
   3. When did it get interesting? Was anything unfair?
3. **Map 180:** https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=180
   1. How many tries to win, or did you give up?
   2. One word for it.
   3. Did you win just by following the Warden? Was there a moment you had to think?
4. **Map 85:** https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=85
   1. How many tries to win, or did you give up?
   2. One word for it.
   3. At the wide box, did you wait for the Pioneer or jump? Was anything unfair?
5. **Map 164:** https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=164
   1. How many tries to win, or did you give up?
   2. One word for it.
   3. Did the first wall feel fair? What build won it for you?
6. **Map 72:** https://the-last-race.com/preview/pr-40/lessons.html?gen=1&seed=72
   1. How many tries to win, or did you give up?
   2. One word for it.
   3. Did the early strike in the pack's shadow feel fair? Was there a real decision, or just floor it?

At the end, one more question: which map would you play again?

## Reproduce

Run these from `experiments/pacing-the-frontier/check/lessons`, after building the page with `node build.mjs --only campaign+ship+reader+gen`.

The held-out table (about 2 minutes each; I ran two at a time):

```
node gen/play.mjs --draw 6,37,85 --start 9701 --n 20 --road 1 --json ho-a.json
node gen/play.mjs --draw 180,164,72 --start 9701 --n 20 --road 1 --json ho-b.json
```

One race, second by second (here, your style on map 180):

```
node gen/play.mjs --draw 180 --bots coleFollow --trace 2001 --every 3
```

The screen over draws 1-240 used `--draw <list> --start 2001 --n 12`. The fun filters are step 2's `fun/tests.mjs` `testMap` on seeds 1001 and 9601, 40 races per bot.
