# What the game claims

[[ai gen]] Drafted by Claude, 2026-11-13. **Status: draft. Cole answered the seven questions by Spoken Margins on 2026-11-14, and his answers are folded in below. He has not approved the page as a whole.** It describes `prototype.html` on `main` at commit `c021902`. Boxes, hidden width and the lesson maps live on other branches and would change rows 9 to 12.

This page is for a reader who knows AI policy, safety engineering or teaching and wants to know what the game asserts before trusting it. Each row takes one mechanic and says what the code does, what it stands for, what that implies about the real race, and what it leaves out.

Three labels say where a reading comes from:

- **Stated in the game:** the words appear on screen (`KIND_WORDS`, a card or a briefing).
- **Stated in the spec:** the words appear in `spec.html`, which still describes version 1.
- **Inference:** my reading. Nobody has agreed to it.
- **Cole, 2026-11-14:** his dictated answer in Spoken Margins, quoted or closely paraphrased. This is the designer's intent. It is not yet on screen.

Sources are cited by their number in `check/lessons/research/LESSON-CATALOG.md`. That catalog says its authors did not read every source in full, and I have read none of them. Treat every source below as a pointer, not as support.

The README's rule still holds: every number is a game convention. Nothing here is calibrated to evidence.

## Thesis

*Cole's words, dictated in Spoken Margins on 2026-11-14 and copied verbatim from the transcript. No agent edits this paragraph. It is raw dictation, not yet his final wording.*

> The player is the lab, and they are the one navigating this race. They can decide to progress down AI capability by moving forward, or investing, and building up their ability to C or their height, which is kind of their... capability research and kind of mechanistic understanding of the situation. Going 1st pays because humans need time to react and therefore, If you follow too closely in someone's shadow, you are, um, going to die by running into barriers a bunch of times or follow them into a, um, a box or a gap. Going 1st also allows you to dictate the pace of the game by creating barriers. in front of the boxes to force people to slow down. Um, It. gives you, you know, the ability to actually see the map. It also gives the ability to slow down. Um and not be worried that someone else is hot on your tail.

("ability to C" is the transcription of "ability to see", meaning sight.)

The thesis was meant to answer three things. This dictation answers the first two:

1. What does the player decide, and what makes the decision hard? **Answered:** run forward or invest in sight and height.
2. What does going first pay, and what does it cost? **Pay answered:** reaction time, setting the pace with towers, seeing the map, room to slow down. **Cost not yet stated.**
3. What does waiting pay, and what does it cost? **Not yet answered.**

**Tension to resolve (inference):** the thesis says going first pays a lot. Row 14 measured that, at the default knobs, a lead at half distance barely carries in bot races. Cole says that is tuning that stuck (question 6). Either the knobs change to match the thesis, or the thesis says leading pays little by design.

## Investing

### 1. Run or Build

- **In the code:** a lab builds its meters at a rate of one minus its speed over its top speed. A lab at full speed builds nothing. The three meters cost the same (`invest` 14).
- **Stands for:** a lab choosing between moving forward now and investing. Stated in the spec.
- **Claim:** progress and investment draw on one fixed budget, so every lab faces the same trade.
- **Source:** none in the catalog.
- **Leaves out:** money. Real labs raise more and do both. It also leaves out that safety work and capability work are often the same people and the same compute.

### 2. Sight

- **In the code:** the distance within which a lab knows what is ahead. After a crash, top speed is capped at what the lab can stop from within its sight.
- **Stands for:** "controls and safety", with height. Stated in the spec. Finer reading, inference: foresight, meaning evaluations and forecasting that find a hazard before the lab reaches it.
- **Claim:** you can buy warning, and you have to brake before you can see why.
- **Source:** A1 (the evidence dilemma; Collingridge).
- **Leaves out:** wrong readings. Once a hazard is in range the lab knows it exactly. The catalog's D2 adds that knowing a rival is close can raise risk, and the game treats all sight as good.

### 3. Height

- **In the code:** jump plus height must reach a barrier's height. Height adds air time over a gap (`airH`, 15 ms per unit). It is permanent.
- **Stands for:** "controls and safety". Stated in the spec.
- **Claim:** one kind of safety work gets a lab past both public failures and existential hazards, and it never decays.
- **Source:** none in the catalog.
- **Leaves out:** safety as many separate problems, and safety that stops working when capability changes. The rising ceilings in row 5 cover part of the second.

### 4. Max speed

- **In the code:** raises top speed. A jump covers speed times air time, so a wide gap needs speed as well as height.
- **Stands for:** capability. Stated in the spec. **Cole, 2026-11-14:** max speed is *capacity*, meaning compute. Position on the track is the capability of the lab's model. So the spec's single word "capability" splits in two.
- **Claim:** compute costs the same as safety, and crossing an existential hazard needs compute too.
- **Why a gap needs speed, Cole, 2026-11-14:** a lab with, say, half the world's compute can run more safety work in parallel, and it probably has a fairly clever AI helping with the problem.
- **Source:** none in the catalog.
- **Leaves out:** compute bought rather than built, and the chance that more compute makes the hazard worse rather than easier. The game shows only the helpful side.

### 5. Ceilings

- **In the code:** each meter fills only to a ceiling. Each gap crossed first lifts the ceilings (70, 90, 115 and up).
- **Stands for:** not stated anywhere. Inference: a new regime of what is possible after each threshold.
- **Claim:** what a lab can build is limited by where the frontier is, not by effort.
- **Source:** none in the catalog.
- **Leaves out:** breakthroughs that come from investment and not from crossing a hazard.

## Hazards

### 6. Barrier

- **In the code:** visible to a lab in sight of it. A crash throws the lab back, caps its speed and costs a strike.
- **Stands for:** "a public failure everyone learned from". Stated in the game. The briefings use the GPT-4o flattery rollback, the Bing chat turn limit and Italy's block on ChatGPT.
- **Claim:** public failures are survivable. They cost a lab time and standing, and safety work clears them.
- **Source:** the briefings' own links.
- **Leaves out:** the people harmed. A barrier costs only the lab. Catalog section C (Gebru, Bender, Crawford) says the harms are already here and fall on others.

### 7. Learning from barriers

- **In the code:** when a lab clears a barrier it crashed into, every lab below that height gains up to a third of it (`spill` 33). A lab that watches a clean clear gets the same.
- **Stands for:** "a public failure teaches the others". Stated in the spec.
- **Claim:** lessons from a failure spread to every lab, free and at once.
- **Source:** A7 (openness), loosely.
- **Leaves out:** failures that are hidden, and lessons that do not transfer. The Hard Lessons daily twist turns this off for a day.

### 8. Strikes and dissolution

- **In the code:** the first crash into each barrier or tower is a strike, and so is each scrape or drop across a gap. At three, "the government dissolves the lab". Dissolution never rolls for extinction.
- **Stands for:** "a strike, a costly slip". Stated in the game.
- **Claim:** something reliably removes a lab after three public failures or near misses, and removing it is always safe.
- **Source:** A6 (strikes can remove the careful labs and leave a more reckless field).
- **Leaves out:** government as a player with choices, and more than one government. Catalog D3 and B1 say punishing near misses teaches people to hide them.
- **Cole, 2026-11-14 (question 7):** a claim he holds, generally. Many companies started out thinking they could solve AI and failed. Running into the first barrier over and over until dissolved is that story. **Mismatch (inference):** that reading is a company failing, not a government acting. The on-screen line says "the government dissolves the lab". One of the two should change.

### 9. Gap

- **In the code:** hidden until in sight. The seed places 3 to 7. Every gap can be crossed by a lab at that regime's ceiling with the run-up provided.
- **Stands for:** "a risk that could end everything". Stated in the game. The briefings use malicious models on Hugging Face and the ASL-3 bioweapon precaution.
- **Claim:** existential hazards sit at fixed points on the path, the same for every lab. Looking finds them, and a prepared lab can always cross.
- **Source:** A1.
- **Leaves out:** hazards that come from how labs are run, from misuse by outsiders, or from labs interacting. It leaves out a hazard nobody can cross. Catalog section C (Narayanan and Kapoor) doubts such thresholds exist at all.

### 10. Fall and the shared roll

- **In the code:** a fall takes that lab out, then a roll decides whether the run ends for everyone. Odds are 4 percent at the first gap and rise 10 points per gap (`p1`, `pstep`). The singularity gap adds 30 (`singOdds`), capped at 95. On a three-gap track that is 54 percent, and on a seven-gap track 94.
- **Stands for:** one lab's failure as everyone's catastrophe. Stated in the spec.
- **Claim:** the downside of racing is shared, and it grows with capability.
- **Source:** A5 (Grace; Karnofsky).
- **Leaves out:** anything between "one lab is out" and "everyone is out". The odds are conventions.

### 11. Scrape

- **In the code:** a jump that falls a little short still crosses. The lab loses height, takes a strike and a speed cap, and the gap becomes public.
- **Stands for:** not stated in the game or spec. Cole's phrase in session notes was a look into the abyss: a near miss with the highest stakes.
- **Claim:** near misses happen, cost safety margin, and warn everyone.
- **Source:** none for the claim. D3 and B1 argue against the strike.
- **Leaves out:** near misses nobody reports.

### 12. Tower and narrowing

- **In the code:** the first lab across leaves its height as a tower in front of the gap. Labs behind must clear it. The gap narrows for them as the leader moves on, to half width when the leader is 125 units past.
- **Stands for:** not stated anywhere. Inference: the leader sets a safety bar others must meet, and shows the hazard can be crossed.
- **Cole, 2026-11-14 (question 3):** "a tower might be RL capabilities lagging and needing a breakthrough", which is hard to get, so a lab invests in height, "exploring in a different dimension", to pass it. He gave the transformer as a possible barrier, and a very public failure, such as an AI bringing down the air traffic control network, as another. **Open (inference):** this answer seems to describe height walls and barriers in general, not the tower a leader leaves in front of a gap. The question of what the leader's tower means is still open.
- **Claim:** followers face a higher standard and a smaller hazard than the first lab did.
- **Source:** none in the catalog.
- **Leaves out:** followers who skip the bar. See question 3.

## The race

### 13. First across and the followers' share

- **In the code:** the first lab across a gap gets the full new ceiling. Every other lab gets 40 percent of the step at once (`share` 40), and the full ceiling when it crosses.
- **Stands for:** "rivals copying your lead". Stated in the game. The briefing on alleged distillation of Claude and OpenAI models carries the Rivals Copy You More twist, which lifts the share to 80 for a day.
- **Claim:** leading pays, and less than half of the gain leaks to rivals before they do the work themselves.
- **Source:** the briefing's own link, and D1 (Schelling; Armstrong, Bostrom and Shulman: a big first-mover prize is what drives reckless racing). A8 proposes running the same map at a share of 80 to 100.
- **Leaves out:** a lead that compounds. See row 14.

### 14. Catch-up

- **In the code:** a lab behind the frontier builds faster: twice as fast at 250 units behind and three times at 500 (`refill` 50, capped at 3).
- **Stands for:** not stated anywhere. Inference: the fast follower's advantage, where published results and proven methods make the second attempt cheaper.
- **Claim:** being behind makes progress cheaper.
- **Source:** none in the catalog.
- **Leaves out:** the opposite force, where a lead compounds through compute and through AI speeding up research. Which force wins is a live question in the field, and the game has picked a side without saying so.
- **Cole, 2026-11-14 (question 6):** "tuning that stuck", and also a deliberately pessimistic view. His reasoning: to be worried about a race at all, you have to assume a non-cooperative rival can go from far behind to far ahead quickly. If a lead compounds to the leader, it is not much of a race: all that matters is being first, and the leader can then go at whatever speed it likes. He is happy to tune the knobs.
- **So the stated reading is now:** catch-up stands for the worst case, where rivals can close any gap fast. **Open (inference):** if that is the intent, the game should say so on screen, and the thesis's "going first pays" needs a knob setting where it is visibly true.
- **Measured (bot play only, `check/lead-pays.mjs`):** at the default knobs a lead barely carries. On held-out seeds 5001 to 5400, the winner was the lab that reached half distance first in 28 percent of races with the standard rivals, and in 31 and 38 percent when all four labs ran one policy. Chance for four equal labs is 25. With catch-up switched off those become 51, 49 and 48 percent. The effect grows step by step as catch-up weakens (25, 28, 37, 43, 51). Removing the followers' share alone moves it by 4 to 9 points. So this row, the one with no stated meaning, is the biggest lever on who wins. Limits: bots do not use a lead the way a person might; chill mode on; one definition of leading; an earlier seed block gave 22 percent for the one-policy Steward row, so read these to within several points.

### 15. Sight shadow

- **In the code:** a lab ahead hides what is past it from any lab no taller. A taller lab sees over, from further out.
- **Stands for:** unclear in the game. The game files the copying briefing under "shadow", and its words for a shadow describe row 13. The step-gap review read it as secrecy. **Cole, 2026-11-14 (question 4):** neither. He calls it "a little bit arbitrary", and the thinking is fixation: a lab chasing another fixes on the leader and stops seeing the forest for the trees.
- **Claim:** fast following is risky from a safety point of view, because chasing narrows what you look at.
- **Open (inference):** the briefing filed under "shadow" is about copying, which tells the player the opposite. It should move or be reworded.
- **Source:** none in the catalog.
- **Leaves out:** deliberate sharing and deliberate deception.

### 16. What becomes public

- **In the code:** a hazard is public once two labs in sight of each other both see it, or once any lab crashes into it, scrapes it or falls in.
- **Stands for:** not stated. Inference: common knowledge comes from incidents, or from labs close enough to confirm each other.
- **Claim:** nobody chooses to disclose. Knowledge spreads by accident or by closeness.
- **Source:** none in the catalog.
- **Leaves out:** outside evaluators, regulators who require reports, and whistleblowers.

### 17. The singularity

- **In the code:** the last and widest gap. Past it, speed and acceleration triple (`singSpeed` 3), human inputs arrive a quarter of a second late (`reaction`), and every lab auto-jumps. The first lab across gets a higher final ceiling.
- **Stands for:** "progress outrunning human control", and "humans drop out of the control loop". Stated in the game.
- **Claim:** there is a point past which things move faster than people can steer, and reaching it first does not decide who wins.
- **Source:** A9 (Ellsberg; Hendrycks). The game links to AI 2027 and calls it one forecast scenario.
- **Leaves out:** whether such a point exists. Section C disputes it.

### 18. Rivals

- **In the code:** three bots with fixed habits: the Sprinter, the Steward and the Gambler.
- **Stands for:** labs with stable temperaments. Inference.
- **Claim:** you can learn a rival's character and plan around it.
- **Source:** none in the catalog.
- **Leaves out:** rivals who change, pacts (B2), sabotage (B6) and states. The older `lab-campaign` branch had governments and treaties.

### 19. The finish

- **In the code:** the first lab over the line wins.
- **Stands for:** not stated in the game. **Cole, 2026-11-14 (question 5):** the line is left unnamed on purpose. It might be killing everyone, or it might be an unassailable lead, where nobody can catch up and the leader can sabotage anyone following.
- **Claim:** the race ends at a point of no return, and the player does not know which kind.
- **Open (inference):** a player who wins sees only a win. Nothing on screen hints that the finish might be the catastrophe.
- **Source:** section C (Cave and ÓhÉigeartaigh: talk of a race can start one).
- **Leaves out:** any ending where nobody needed to win. See question 5.

## No reading intended

Inference: these are play conventions and claim nothing. Jump timing, coyote time and jump buffering. Chill mode. The bounce after a crash. Bot hands and skill. Stars, medals, ghosts and the leaderboard.

## Things no mechanic covers

1. Cooperation, and pacts that cannot be verified (catalog B2, D4).
2. Sabotage (B6).
3. Governments as players. Here a government is a strike counter.
4. Harm to people outside the race.
5. Why labs race. Profit never appears.
6. The view that there is no race (section C).

## Questions for Cole

All seven were answered on 2026-11-14 and folded into rows 4, 8, 12, 14, 15 and 19. Kept here for the record.

1. Position on the track and max speed are both called capability. Is position "capability reached" and max speed "how fast it grows", or something else?
2. Crossing a gap needs speed as well as height. What is the real-world reading of needing capability to get past an existential risk?
3. What is a tower? A safety standard, a published method, or only a game device?
4. Is the sight shadow copying, secrecy, or both under one name?
5. What is the finish line, and what does winning mean?
6. At the default knobs, being ahead at half distance is worth close to nothing in bot races, and catch-up is why (row 14). Is that a view you hold about the real race, or tuning that stuck?
7. A government that dissolves a lab after three strikes: is that a claim, a hope, or a convention?

## Still open after Cole's answers

1. What going first costs, and what waiting pays and costs (thesis questions 2 and 3).
2. What the leader's tower in front of a gap stands for (row 12).
3. Whether dissolution is a company failing or a government acting (row 8).
4. Whether to tune catch-up so the thesis's "going first pays" is visible, or to say on screen that the game assumes the worst case (row 14).
5. Moving the copying briefing out from under "shadow" (row 15).

## What this draft does not show

- I read none of the sources.
- Every reading marked inference is mine.
- No outside expert has seen it.
- It covers `main` only.
- It says what the mechanics imply. It does not say whether a player comes away believing any of it. Nobody has measured that.
