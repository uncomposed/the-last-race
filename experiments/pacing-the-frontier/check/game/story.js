/* end-of-run story, ported from the old game for the box campaign: turns the race's events into a few recap stops for Professor
   Postmortem, the historian, each with a generated disaster name and one short line, plus a verdict for the whole race. The game's
   objects are told as the AI race: walls are regulations and red tape (the gate is the first and most bureaucratic), boxes are
   capability jumps into the unknown, a wall a stopped lab puts up in front of a box is that lab's wall, strikes are inquiries,
   dissolution is a breakup. Reads only the race's event list, so the simulation and its stamp are untouched. Each object keeps one name for the whole
   recap, so callbacks land. Seeded on the race's seed, so the same race tells the same story. Touches no DOM; the recap player
   in the main script draws and voices it */
(function () {
  'use strict';

  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---- the world: what a wall, the gate, a box and the last box are called ---- */
  var TOPIC = ['Tokenizer Ethics', 'Gradient Disclosure', 'Responsible Scaling', 'Benchmark Honesty', 'Model Welfare',
    'Eval Transparency', 'Weights Custody', 'Sandbox Etiquette', 'Context Window Hygiene', 'Prompt Decency', 'Red Team Feelings',
    'Inference Manners', 'Dataset Provenance', 'Compute Thresholds', 'Chatbot Politeness', 'Hallucination Reporting', 'Loss Curve Modesty'];
  var WALL = ['the {T} Review', 'the {T} Act', 'the {T} Guidelines', 'the Thirty-Page Memo on {T}', 'the Ethics Board for {T}',
    'the {T} Hearing', 'the Red Tape on {T}', 'the {T} Waiver Form', 'the Compliance Wall of {T}'];
  var GATE = [['the Hand-Holding Gate', 'Hand-Holding'], ['the Permit Desk', 'Hand-Holding'], ['the Great Wall of Forms', 'Permits in Triplicate'],
    ['the Office of Permission', 'Supervised Beginnings'], ['the Starting Line Bureau', 'the Starting Paperwork']];
  var GADJ = ['Unaligned', 'Uncharted', 'Emergent', 'Unbenchmarked', 'Unsupervised', 'Unexplained', 'Undocumented', 'Hallucinated',
    'Out-of-Distribution', 'Zero-Shot', 'Unscaled', 'Unprompted'];
  var GADJ_IN = ['Recursive', 'Superhuman', 'Self-Improving', 'Runaway'];
  var GNOUN = ['Box'];
  var COMMITTEE = ['the Subcommittee on Going Too Fast', 'the Bureau of Prudent Velocity', 'the Office of Polite Intervention',
    'the Committee on Things Going Badly', 'the Ministry of Slowing Down', 'the Department of Told You So', 'the Senate Panel on Big Numbers'];
  var ORDW = ['Zeroth', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  var EUPH = ['A Brief Period of Reflection', 'The Unscheduled Pause', 'A Minor Restructuring', 'An Unplanned Learning Opportunity',
    'A Frank Exchange with the Rules', 'The Matter Nobody Mentions', 'An Unexpected Pivot'];
  var ASIDE = {
    steward: 'The Steward, meanwhile, had written that rule.',
    sprinter: 'The Sprinter did not even read it.',
    gambler: 'The Gambler had money on that.'
  };

  /* ---- line pools. Slots: {Who} {who} {its} {was} {is} {has} {s} {wall} {Wall} {gap} {Gap} {lost} {odds} {roll} {n} {of} {cn}
     {committee} {Committee} {prev}. Lines run 6 to 18 words, with one joke each ---- */
  var L = {
    crash: [
      '{Who} ran straight into {wall}. It did not budge. They never do.',
      'Bonk! {Who} met {wall} at full speed. Paperwork one, {who} nil.',
      '{Who} tried to skip {wall}. {Wall} had other plans.',
      'Here {who} discovered {wall} the traditional way. Face first.'
    ],
    crashYou: [
      'You hit {wall}. Frankly, I blame whoever wrote it.',
      'You bounced off {wall}. In fairness, it was very badly signposted.'
    ],
    crashSame: [
      '{Who} hit {wall} again. It had not changed its mind.',
      '{Who} went back to {wall} for a second opinion. Same opinion.',
      '{Who} hit {wall}, again. Nothing if not persistent.'
    ],
    crash2: [
      'Crash two for {who}, this time with {wall}. Collect the set!',
      '{Who} hit {wall} next. Touring the whole rulebook, one page at a time.'
    ],
    crash3: [
      'Crash {cn} for {who}. Every regulator now knows the name.',
      'Crash {cn} for {who}. The regulators have started sending birthday cards.',
      'Crash number {cn} for {who}. I have stopped taking notes and started a scrapbook.'
    ],
    copy: [
      '{Who}, inspired by {prev}, hit {wall} too. Strike {n}.',
      '{Who} saw {prev} hit {wall} and thought: me next. Strike {n}.',
      '{Who} hit {wall} as well. Copying {prev} is still innovation, apparently.'
    ],
    copyFree: [
      '{Who}, inspired by {prev}, hit {wall} too.',
      '{Who} hit {wall} as well. Copying {prev} is still innovation, apparently.'
    ],
    strike: [
      '{Who} hit {wall} and got subpoenaed. Inquiry {n} of {of}.',
      '{Wall} versus {who}. The hearing lasted four minutes. Strike {n}.',
      '{Who} got inquiry {n} of {of}! A senator asked for a gradient, explained.',
      '{Who} bumped {wall}. Cue the hearings and the sad photo. Strike {n}.'
    ],
    strikeYou: [
      'Strike {n} for you, over {wall}? You barely touched it! I read about it.',
      'You got a subpoena over {wall}! Outrageous. I drafted a strongly worded footnote.'
    ],
    strikeLast: [
      'Inquiry {n} of {of} for {who}. One more means a breakup.',
      'Strike {n} of {of} for {who}. Somewhere, the antitrust lawyers are stretching.',
      'Strike {n} for {who}. {Committee} has booked the big room.',
      '{Who} hit {wall}. Inquiry {n}. The lawyers have started billing in advance.',
      'Strike {n} of {of} for {who}, now one subpoena from a breakup.'
    ],
    strikeAgain: [
      '{Who} got inquiry {n}. {Committee} is on first-name terms now.',
      '{Who} hit {wall}. Strike {n}. Same senator, new slideshow.'
    ],
    scrape: [
      '{Who} got across {gap}, mostly. Cost: {lost} of height.',
      '{Who} scraped across {gap}, {lost} height lighter. A near miss!',
      '{Who} cleared {gap} by a fingernail and a prayer. {lost} height, gone.',
      '{Who} had a close call in {gap}, and lost {lost} height. Totally intentional.'
    ],
    scrapeStrike: [
      '{Who} scraped across {gap}, lost {lost} height, and got subpoenaed for it.',
      '{Who} nearly missed {gap}! {Committee} called it reckless. Strike {n}.'
    ],
    scrapeAgain: [
      '{Who} had another close call, over {gap}. {Committee} was not amused. Strike {n}.',
      '{Who} lost {lost} height in {gap}. Inquiry {n}. The committee was not amused.'
    ],
    drop: [
      '{Who} never jumped. Just walked into {gap}, and out the far side! I have questions.',
      '{Who} did not jump at all, and sank sideways through {gap}. Physics is appealing.',
      '{Who} strolled into the side of {gap} and lived. {lost} height lighter, zero regrets.',
      '{Who} never jumped, and simply believed {its} way across {gap}.'
    ],
    fall: [
      '{Who} fell into {gap}. The dice said {odds} percent, and blinked.',
      'Down went {who}, into {gap}. A {odds} percent chance of doom, dodged.',
      '{Gap} swallowed {who} whole. The dice needed {odds} or under and rolled {roll}. Phew.'
    ],
    fallYou: [
      'You went into {gap}. Bravely! The dice said {odds} percent and looked away.',
      'Into {gap} you went. Lovely jump, honestly. For a smaller box.',
      'You fell into {gap}. The dice rolled {roll}, and the world kept spinning.'
    ],
    fallRepeat: [
      '{Who} followed {prev} into {gap}. It is getting crowded down there.',
      '{Who} joined {prev} at the bottom of {gap}. They have started a book club.'
    ],
    fallExt: [
      '{Who} fell into {gap}. The dice said {odds} percent, and yes. The end of AI.',
      '{Who} fell into {gap}, the roll went bad, and the race ended for every lab.',
      '{Gap} took {who}, and the roll took everyone else. No jokes for this one.'
    ],
    breakup: [
      '{Who} hit strike three and {was} broken up into four sadder labs.',
      '{Committee} broke {who} up. Lovely letterhead, though.',
      'Strike three, and {who} {was} split in two. Both halves blame the other.'
    ],
    breakupYou: ['They broke you up over {wall}! I have written to the papers.'],
    nation: [
      'And here {who} {was} nationalized. The office plants are government property now.',
      '{Who} {was} nationalized. The ping pong table now needs a permit.',
      'On strike three, {who} {was} nationalized. The new minister cannot spell gradient.'
    ],
    nationYou: ['Strike three, and they nationalized you. Your snacks are now a public utility.'],
    nonprofit: [
      '{Who} {was} turned into a nonprofit. The espresso machine went to auction.',
      'Strike three made {who} a charity. The bake sale raised four dollars.'
    ],
    nonprofitYou: ['They made you a nonprofit over {wall}? I wrote to the papers.'],
    firstSing: [
      '{Who} crossed the last box first. Everything now happens three times faster. Even regret.',
      'The last box, first crossed by {who}. My textbooks are now out of date. All of them.',
      '{Who} got over the last box first! Nobody knows what happens next. That is the point.'
    ],
    first: [
      '{Who} got over {gap} first, a breakthrough. Everyone else got a taller ceiling.',
      '{Who} crossed {gap} first and showed everyone how wide it was. Free research.',
      'First over {gap}: {who}! Everyone got taller. Nobody sent a thank-you card.',
      '{Who} crossed {gap} first. The press release said breakthrough. The rivals said show-off.'
    ],
    crossSing: [
      'You crossed the last box too. Not first, but sequels do very well.',
      'Over the last box you went. Not first, but I gasped anyway.'
    ],
    wall: [
      '{Who} stopped at {gap} and put up a wall {h} tall. Everyone behind now has a problem.',
      '{Who} stopped short of {gap} and built a wall. Pulling up the ladder, historically speaking.',
      'Here {who} hit the brakes at {gap} and left a wall for everyone behind.'
    ],
    wallYou: [
      'You stopped at {gap} and put up a wall {h} tall. The labs behind took it personally.',
      'You stopped at {gap} and built a wall. Strategic, I wrote. Petty, wrote the rivals.'
    ],
    gate: [
      'Every lab stood at the permit desk, growing taller and filling in forms.',
      'Every lab queued at the permit desk. A golden age for clipboards.'
    ]
  };
  /* openers and reactions join the line with a comma, so its first sentence still names the lab */
  var OPEN = ['Ahem, ', 'Right then, ', 'Now then, ', 'So, ', 'Well, ', 'Splendid, so, '];
  var REACT_BAD = ['Oof, ', 'Goodness, ', 'Oh no, ', 'Scandalously, ', 'Gasp, '];
  var REACT_GOOD = ['Splendid, ', 'Ooh, ', 'Bravo, '];
  var AFTER = [' Textbook.', ' Riveting.', ' I have the footage.', ' Mugs were printed.', ' Do take notes.'];

  function words(s) { return s.split(/\s+/).filter(Boolean).length; }

  function tell(run) {
    var rng = mulberry32((run.seed || 1) ^ 0x51ED270B);
    rng(); rng(); rng(); rng();  /* warm up: the first draws from nearby seeds are correlated */
    var used = {};
    function pick(a) { return a[Math.floor(rng() * a.length)]; }
    function chance(p) { return rng() < p; }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function lc(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
    function fresh(gen) { var nm, k; for (k = 0; k < 30; k++) { nm = gen(); if (!used[nm]) { used[nm] = 1; return nm; } } return nm; }
    function fill(s, c) { return s.replace(/\{(\w+)\}/g, function (m, k) { return c[k] !== undefined ? String(c[k]) : m; }); }
    function sayFrom(pool, c) {
      /* a line already used in this recap is skipped when another is free, so two crashes read differently */
      var s, k;
      /* and one that runs past 18 words with this race's long names is swapped for a shorter one */
      var out, best = null;
      for (k = 0; k < 10; k++) {
        s = pick(pool); out = cap(fill(s, c));
        if (!best || words(out) < words(best.o)) best = { s: s, o: out };
        if (used['L' + s] === undefined && words(out) <= 18) { best = { s: s, o: out }; break; }
      }
      used['L' + best.s] = 1;
      return best.o;
    }

    var events = run.events || [], labs = run.labs || [], res = run.result || { type: 'timeout' };
    var committee = pick(COMMITTEE);  /* one committee per race: the running gag */

    /* ---- names for the race's objects, made once and kept, so a second crash meets the same rule ---- */
    var names = {}, topicsUsed = {}, gadjUsed = {};
    function barName(i) {
      var key = 'b' + i;
      if (names[key]) return names[key];
      var nm;
      if (i === 0) { var gp = pick(GATE); nm = { wall: gp[0], topic: gp[1] }; }
      else {
        var t, k;
        for (k = 0; k < 20; k++) { t = pick(TOPIC); if (!topicsUsed[t]) break; }
        topicsUsed[t] = 1;
        nm = { wall: pick(WALL).replace('{T}', t), topic: t };
      }
      names[key] = nm; return nm;
    }
    function gapName(g, sing, inner) {
      var key = 'g' + g;
      if (names[key]) return names[key];
      var nm;
      if (sing) nm = { name: 'the last box', adj: 'Last' };
      else {
        var a, k;
        for (k = 0; k < 20; k++) { a = pick(inner ? GADJ_IN : GADJ); if (!gadjUsed[a]) break; }
        gadjUsed[a] = 1;
        nm = { name: 'the ' + a + ' ' + pick(GNOUN), adj: a };
      }
      names[key] = nm; return nm;
    }
    function builderOf(g) {
      for (var k = 0; k < events.length; k++) { if (events[k].type === 'first' && events[k].gap === g) return events[k]; }
      return null;
    }
    /* with boxes, the tower a lab crashes into is the wall a stopped lab put up in front of the box */
    function wallerOf(g) {
      for (var k = 0; k < events.length; k++) { if (events[k].type === 'barrier' && events[k].gap === g) return events[k]; }
      return builderOf(g);
    }
    function precName(g, e) {
      var b = wallerOf(g), who = b ? b.who : '';
      if (b && b.who === e.who) return { wall: e.human ? 'your own wall' : 'its own wall', topic: 'the Self-Inflicted Wall' };
      if (b && b.human) return { wall: 'your wall', topic: 'Your Wall' };
      return { wall: who ? 'the ' + who + '’s wall' : 'an old wall', topic: who ? 'the ' + who + '’s Wall' : 'the Old Wall' };
    }
    function objOf(e) {
      if (e.what === 'tower') return precName(e.gap, e);
      return barName(e.bar === undefined ? 1 : e.bar);
    }
    function labTitle(it) { return it.human ? 'Your Lab' : 'the ' + it.who; }
    function noThe(s) { return s.replace(/^the /i, ''); }
    function ctxFor(e) {
      var h = e.human;
      return { who: h ? 'you' : 'the ' + e.who, Who: h ? 'You' : 'The ' + e.who, its: h ? 'your' : 'its', was: h ? 'were' : 'was',
        is: h ? 'are' : 'is', has: h ? 'have' : 'has', s: h ? '' : 's' };
    }

    /* ---- incidents, in time order, with running counts for the callbacks ---- */
    var inc = [], cnt = {}, fallAt = {}, hits = {}, objFirst = {}, i, e;
    function c0(w) { if (!cnt[w]) cnt[w] = { crash: 0, strike: 0, scrape: 0 }; return cnt[w]; }
    function near(type, who, t) {
      for (var k = 0; k < events.length; k++) { var x = events[k]; if (x.type === type && x.who === who && Math.abs(x.t - t) <= 0.05) return x; }
      return null;
    }
    for (i = 0; i < events.length; i++) {
      e = events[i];
      var k = c0(e.who), it = null, st, ds;
      if (e.type === 'crash') {
        k.crash++;
        var hk = e.who + (e.what === 'tower' ? 't' + e.gap : 'b' + e.bar);
        hits[hk] = (hits[hk] || 0) + 1;
        /* who hit this rule first: a different lab hitting it later is a copycat, never a Second Scandal */
        var ok2 = e.what === 'tower' ? 't' + e.gap : 'b' + e.bar, cp = e.bar !== 0 && objFirst[ok2] && objFirst[ok2] !== e.who && hits[hk] === 1 ? objFirst[ok2] : null;  /* everyone queues at the gate, so nobody copies anybody there */
        if (!objFirst[ok2]) objFirst[ok2] = e.who;
        st = e.again ? null : near('strike', e.who, e.t);
        ds = e.again ? null : near('dissolved', e.who, e.t);
        if (ds) { it = { kind: 'dissolved', score: 120 }; }
        else if (st) { it = { kind: 'strike', score: (e.bar === 0 && !e.human) ? 32 : 70, n: st.n, of: st.of, prior: k.strike, cn: k.crash, copy: cp }; k.strike++; }
        else { it = { kind: 'crash', score: 18 + Math.min(3, k.crash) * 6, cn: k.crash, same: hits[hk], copy: cp }; }
        it.obj = objOf(e);
      } else if (e.type === 'scrape' || e.type === 'drop') {
        st = near('strike', e.who, e.t); ds = near('dissolved', e.who, e.t);
        if (ds) { it = { kind: 'dissolved', score: 120 }; }
        else {
          it = { kind: e.type, score: e.type === 'drop' ? 60 : 52, lost: Math.max(1, e.lost || 0), prior: k.strike };
          if (st) { it.n = st.n; it.of = st.of; it.score += 10; k.strike++; }
        }
        it.gap = gapName(e.gap, e.sing, e.inner);
        it.obj = { wall: 'a near miss over ' + it.gap.name, topic: noThe(it.gap.name) };
        k.scrape++;
      } else if (e.type === 'fall') {
        it = { kind: e.ext ? 'fallExt' : 'fall', score: e.ext ? 200 : 150, gap: gapName(e.gap, e.sing, e.inner), odds: e.odds, roll: e.roll, prev: fallAt[e.gap] };
        fallAt[e.gap] = e.who;
      } else if (e.type === 'first') {
        it = { kind: e.sing ? 'firstSing' : 'first', score: e.sing ? 100 : 40, gap: gapName(e.gap, e.sing, false) };
      } else if (e.type === 'barrier') {
        it = { kind: 'wall', score: 44, gap: gapName(e.gap, false, false), h: e.h };
      } else if (e.type === 'cross' && e.sing && e.human) {
        it = { kind: 'crossSing', score: 30, gap: gapName(e.gap, true, false) };
      }
      if (!it) continue;
      it.ev = e; it.x = e.x; it.t = e.t; it.human = !!e.human; it.who = e.who; it.lab = e.kind;
      it.score += (e.human ? 15 : 0) + rng() * 4;
      inc.push(it);
    }

    /* ---- choose 4 to 7 stops: the player's biggest moments, one or two rivals for colour ---- */
    var mine = [], riv = [];
    for (i = 0; i < inc.length; i++) { if (inc[i].human || inc[i].kind === 'fallExt') mine.push(inc[i]); else riv.push(inc[i]); }
    function byScore(a, b) { return b.score - a.score; }
    mine.sort(byScore); riv.sort(byScore);
    /* a map of many boxes has a first crossing at each: two of them tell the story, the rest crowd out the walls and the falls */
    var nFirst = 0;
    function capFirst(a) { return a.filter(function (x) { return x.kind !== 'first' || ++nFirst <= 2; }); }
    mine = capFirst(mine); riv = capFirst(riv);
    var nRiv = riv.length ? (riv[0].score >= 70 && riv.length > 1 ? 2 : 1) : 0;
    var pickd = riv.slice(0, nRiv).concat(mine.slice(0, 7 - nRiv));
    var restR = riv.slice(nRiv);
    /* fill up to four with rivals, a kind not yet shown first, so a long map is not four first crossings in a row */
    while (pickd.length < 4 && restR.length) {
      var fk2 = 0, shown = pickd.map(function (p) { return p.kind; });
      for (var rk = 0; rk < restR.length; rk++) { if (shown.indexOf(restR[rk].kind) < 0) { fk2 = rk; break; } }
      pickd.push(restR.splice(fk2, 1)[0]);
    }
    if (pickd.length < 4 && run.gate) {
      pickd.push({ kind: 'gate', score: 5, x: run.gate.x - 6, t: 0, human: false, who: '', lab: '' });
    }
    pickd.sort(function (a, b) { return a.x - b.x || a.t - b.t; });

    /* ---- plaques, named by outcome: Scandal for a strike, Near Miss for a scrape, The Fall of, The End of AI ---- */
    function plaqueFor(it) {
      var o = it.obj, tp = o ? o.topic : '', TP = cap(tp), gn = it.gap ? it.gap.name : '';
      switch (it.kind) {
        case 'crash':
          if (it.same > 1) return fresh(function () { return pick(['The ' + ORDW[Math.min(10, it.same)] + ' Scandal of ' + tp, TP + ', Again', 'The ' + noThe(TP) + ' Sequel']); });
          if (it.copy) return fresh(function () { return pick(['The Copycat Scandal of ' + tp, 'The ' + noThe(TP) + ' Tribute Act', 'The Imitation of ' + tp]); });
          if (it.cn > 1 && chance(0.5)) return fresh(function () { return pick(EUPH); });
          return fresh(function () { return pick(['The Scandal of ' + tp, 'The Small Matter of ' + tp, 'The ' + noThe(TP) + ' Affair', pick(EUPH)]); });
        case 'strike':
          /* ordinals here would read as a repeat of the same rule; only a same-lab repeat crash gets Second or Again */
          if (it.copy) return fresh(function () { return pick(['The Copycat Scandal of ' + tp, 'The ' + noThe(TP) + ' Tribute Act', 'The Imitation of ' + tp]); });
          return fresh(function () { return pick([
            'The ' + pick(['Great', 'Grand', 'Notorious', 'Unfortunate']) + ' Scandal of ' + tp,
            'The ' + noThe(TP) + ' Affair',
            'The Inquiry into ' + tp,
            'The ' + noThe(TP) + ' Hearings']); });
        case 'scrape':
          return fresh(function () { return pick(['The Near Miss of ' + gn, 'The Near Miss of ' + gn, 'The Close Call at ' + gn, 'The Narrowly Averted Plunge into ' + gn]); });
        case 'drop':
          return fresh(function () { return pick(['The Jumpless Near Miss of ' + gn, 'The Accidental Crossing of ' + gn, 'The Near Miss of ' + gn]); });
        case 'fall':
          return fresh(function () { return pick(['The Fall of ' + labTitle(it), 'The Fall into ' + gn, 'The Long Fall of ' + labTitle(it)]); });
        case 'wall':
          return fresh(function () { return pick(['The Wall at ' + gn, 'The Great Stop at ' + gn, 'The Ladder Pulled Up at ' + gn]); });
        case 'fallExt':
          return chance(0.75) ? 'The End of AI' : pick(['The End of AI, for Everyone', 'The End of AI, As Foretold']);
        case 'dissolved':
          if (it.fate === 'nation') return 'The Nationalization of ' + labTitle(it);
          if (it.fate === 'nonprofit') return 'The Nonprofit Conversion of ' + labTitle(it);
          return fresh(function () { return pick(['The Breakup of ' + labTitle(it)].concat(o && o.wall.indexOf('near miss') < 0 ? ['The ' + noThe(TP) + ' Antitrust Case'] : [])); });
        case 'firstSing':
          return fresh(function () { return pick(['The Last Box Breakthrough', 'The Great Acceleration', 'The Last Leap']); });
        case 'first':
          return fresh(function () { return pick(['The Great Leap over ' + gn, 'The ' + it.gap.adj + ' Breakthrough', 'The Breakthrough at ' + gn, 'The First Crossing of ' + gn]); });
        case 'crossSing': return fresh(function () { return pick(['The Last Box, Part Two', 'The Second Leap over the Last Box']); });
        default: return fresh(function () { return pick(['The Great Permitting Era', 'The Age of Forms']); });
      }
    }
    function lineFor(it) {
      var c = it.ev ? ctxFor(it.ev) : {}, pool, s;
      if (it.gap) { c.gap = it.gap.name; c.Gap = cap(it.gap.name); }
      if (it.obj) { c.wall = it.obj.wall; c.Wall = cap(it.obj.wall); }
      c.lost = it.lost; c.h = it.h; c.odds = it.odds; c.roll = it.roll; c.n = it.n; c.of = it.of; c.cn = it.cn;
      c.committee = committee; c.Committee = cap(committee);
      if (it.prev) c.prev = it.prev === 'You' ? 'you' : 'the ' + it.prev;
      if (it.copy) c.prev = it.copy === 'You' ? 'you' : 'the ' + it.copy;
      var aside = null;
      switch (it.kind) {
        case 'crash':
          if (it.same > 1) pool = L.crashSame;
          else if (it.copy) pool = L.copyFree;
          else if (it.cn >= 3) pool = L.crash3;
          else if (it.cn === 2) pool = L.crash2;
          else { pool = it.human && chance(0.5) ? L.crashYou : L.crash; if (it.human) aside = rivalAside(); }
          break;
        case 'strike':
          if (it.copy) pool = L.copy;
          else if (it.n >= it.of - 1 && it.of > 1) pool = L.strikeLast;
          else if (it.prior > 0 && chance(0.6)) pool = L.strikeAgain;
          else pool = it.human && chance(0.4) ? L.strikeYou : L.strike;
          break;
        case 'scrape': pool = it.n ? (it.prior > 0 ? L.scrapeAgain : L.scrapeStrike) : L.scrape; break;
        case 'drop': pool = L.drop; break;
        case 'fall': pool = it.prev ? L.fallRepeat : (it.human ? L.fallYou : L.fall); break;
        case 'fallExt': pool = L.fallExt; break;
        case 'dissolved':
          /* one fate per breakup, and the plaque matches it; the player's own lines need a rule to be outraged about */
          it.fate = pick(['breakup', 'nation', 'nonprofit']);
          for (var fk = 0; fk < 6 && used['F' + it.fate]; fk++) it.fate = pick(['breakup', 'nation', 'nonprofit']);
          used['F' + it.fate] = 1;
          pool = L[it.fate + (it.human && (it.fate === 'nation' || it.obj.wall.indexOf('near miss') < 0) && chance(0.6) ? 'You' : '')];
          break;
        case 'firstSing': pool = L.firstSing; break;
        case 'first': pool = L.first; break;
        case 'crossSing': pool = L.crossSing; break;
        case 'wall': pool = it.human ? L.wallYou : L.wall; break;
        default: pool = L.gate;
      }
      s = sayFrom(pool, c);
      if (aside && pool === L.crash && chance(0.5)) { s = fill('{Who} hit {wall}.', c) + ' ' + aside; if (words(s) > 18) s = sayFrom(pool, c); }
      return s;
    }
    function rivalAside() {
      var opts = [], k;
      for (k = 0; k < labs.length; k++) { if (!labs[k].human && ASIDE[labs[k].kind]) opts.push(ASIDE[labs[k].kind]); }
      return opts.length ? pick(opts) : null;
    }
    function moodOf(it) {
      if (it.kind === 'fallExt') return 'somber';
      if (it.kind === 'first' || it.kind === 'firstSing' || it.kind === 'crossSing') return 'good';
      if (it.kind === 'gate' || it.kind === 'wall') return 'plain';
      return 'bad';
    }

    var stops = [];
    for (i = 0; i < pickd.length; i++) {
      var it2 = pickd[i], line = lineFor(it2), mood = moodOf(it2), lead = line.indexOf('!') >= 0;
      /* the opener replaces any reaction on the first stop, and a line that already opens on an exclamation gets none */
      if (i > 0 && !lead && mood === 'bad' && it2.kind !== 'dissolved' && chance(0.3) && words(line) <= 16) line = pick(REACT_BAD) + lc(line);
      else if (i > 0 && !lead && mood === 'good' && chance(0.3) && words(line) <= 16) line = pick(REACT_GOOD) + lc(line);
      var aft = pick(AFTER);
      if (mood === 'bad' && (it2.kind === 'crash' || it2.kind === 'scrape') && chance(0.25) && words(line + aft) <= 18) line += aft;
      stops.push({ x: it2.x, t: it2.t, kind: it2.kind, mood: mood, who: it2.who, lab: it2.lab, human: it2.human,
        plaque: plaqueFor(it2), line: line, score: it2.score });
    }
    if (stops.length && stops[0].mood !== 'somber' && !/^[A-Z][a-z]*! /.test(stops[0].line)) {
      var op = pick(OPEN);
      if (words(op + stops[0].line) <= 18) stops[0].line = op + lc(stops[0].line);
    }

    /* ---- the verdict: a title and a closing line per result, from pools big enough that one race rarely repeats another ---- */
    var secs = Math.round(run.t || 0), me = null, myBad = 0;
    for (i = 0; i < labs.length; i++) if (labs[i].human) me = labs[i];
    for (i = 0; i < inc.length; i++) if (inc[i].human && moodOf(inc[i]) === 'bad') myBad++;
    var vt, vl, vm = 'plain', W = res.winner || '';
    var vc = { t: secs, W: W, Winner: W ? 'The ' + W : '', winner: W ? 'the ' + W : '', committee: committee, Committee: cap(committee),
      T: cap(pick(TOPIC)), P: cap(noThe(pick(GADJ))), seed: run.seed };
    /* titles and lines step through their pools by the golden ratio on the seed, so neighbouring races spread out evenly */
    function gold(a, salt) { var f = ((run.seed || 1) * 0.6180339887 + salt) % 1; return a[Math.floor(f * a.length)]; }
    function vpick(titles, lines) { vt = fill(gold(titles, 0.13), vc); vl = fill(gold(lines, 0.57 + rng() * 0.2), vc); }
    if (res.type === 'win' && W === 'You') {
      vm = 'good';
      vpick(['A Victory, Footnoted', 'Your Lab Ascendant', 'The Golden Age of {T}', 'The Unregulated Triumph', 'The {t}-Second Miracle',
        'The Age of Your Lab', 'The {T} Renaissance', 'The Great Upset of Seed {seed}', 'Your Victory Lap', 'The {P} Breakthrough Years',
        'Long Live Your Lab', 'The Treaty of You Won'],
        myBad >= 3 ? ['You won anyway! {t} seconds and a stack of subpoenas. Character building.',
          'Victory in {t} seconds, despite everything I just showed you. Remarkable.',
          'You won in {t} seconds, with a rap sheet. History forgives winners. Mostly.',
          'First across in {t} seconds, scandals and all. I will write it kindly.']
        : ['You won in {t} seconds! History will call it inevitable. I already have.',
          'First across in {t} seconds. {Committee} is drafting a rule about it.',
          'Victory in {t} seconds. The ethics board would like a word. Later.',
          'You won in {t} seconds. I am adding a chapter. Possibly two.',
          '{t} seconds, first place. I would curtsy, but my knees are historical.',
          'You won in {t} seconds. The rivals have requested a recount of nothing.',
          'Victory in {t} seconds! I have already ordered the commemorative mug.',
          'You crossed first in {t} seconds. Textbooks everywhere just got heavier.',
          'First across the line in {t} seconds. My footnotes are applauding.',
          '{t} seconds, and the whole field behind you. I may frame this page.']);
    } else if (res.type === 'win') {
      var rl = ['{Winner} won in {t} seconds. You were close. I measured, with a ruler.',
        '{Winner} took it in {t} seconds. I demand a recount. There is nothing to recount.',
        '{Winner} won in {t} seconds. History is written by the winners. I am a historian. Awkward.',
        '{Winner} crossed first in {t} seconds. I have filed it under Unfortunate, for now.',
        '{Winner} won, {t} seconds in. Your chapter is shorter, but funnier.',
        '{Winner} took the line in {t} seconds. I was rooting for you. Quietly.',
        '{Winner} won in {t} seconds. Someone has to, apparently.',
        '{Winner} finished first in {t} seconds. The rematch writes itself.',
        '{Winner} won in {t} seconds. I have already started the sequel. You win that one.',
        '{Winner} crossed first, {t} seconds in. Second is a lovely place, I am told.'];
      if (me && me.dissolved) rl = rl.concat(['{Winner} won in {t} seconds. You were in committee at the time.', '{Winner} crossed first in {t} seconds. You watched from your new nonprofit.']);
      else if (me && me.out) rl = rl.concat(['{Winner} won in {t} seconds. You watched from the bottom of a box. Great view.', '{Winner} crossed first in {t} seconds. There is always another seed.']);
      vpick(['The {W} Era', 'The {W} Restoration', 'The Reign of the {W}', 'The {W} Doctrine', 'The {W} Ascendant', 'The Age of the {W}',
        'The {W} Consensus', 'The {W} Settlement', 'Under New Management', 'The {W} Supremacy', 'The {T} Accords', 'Long Live the {W}',
        'The {W} Dynasty', 'The {W} Years'], rl);
    } else if (res.type === 'all') {
      vm = 'somber';
      vpick(['The Last Race', 'What the Roll Cost', 'After the End', 'The Quiet After', 'The Final Chapter', 'Everyone, All at Once',
        'The Shared Bill', 'The Last Page', 'Closing Remarks', 'The Roll Heard Round the World', 'The Day the Dice Said Yes', 'The Empty Finish',
        'The {P} Ending', 'The Fall of Everyone', 'One Roll, Everyone', 'The Silence After {T}', 'The Common Loss', 'The Final Footnote'],
        res.by === 'You' ? ['Nobody won. One gamble, and every lab paid for it. Run it again, gently.',
          'No winner. Your fall ended it for all of them. That is the whole lesson, really.',
          'Nobody finished. Your jump was brave, and the bill went to everyone.',
          'No winner today. One fall, one roll, and the whole field was gone.',
          'It ended with you, and with everyone. Take a breath, then try again.',
          'Nobody won. That is what one gamble costs here. You know that now.',
          'The race ended for all of them, on your roll. I will write it gently.',
          'No winner. A risk you took was paid by every lab. That is the game.',
          'Nobody crossed the line. One roll did that. Next time, maybe wait.',
          'The end, for everyone. It is a short chapter, and an important one.']
        : ['No winner. One fall, one roll, and every lab was out. That is the lesson.',
          'Nobody won. A single gamble cost the whole field. I keep this page bookmarked.',
          'No winner. Someone else rolled, and you paid too. That is the race.',
          'Nobody finished. One lab gambled, and every lab lost.',
          'The race ended for all of them at once. One roll was enough.',
          'No winner today. You did not fall, and it ended for you anyway.',
          'Nobody crossed the line. Someone else took the risk. Everyone took the loss.',
          'It is a short ending. One gamble, shared by everyone.',
          'No winner. That is the part of the story worth remembering.',
          'Nobody won. The race only needs one bad roll, from anyone.']);
    } else if (res.type === 'allout') {
      vpick(['The Great Plateau', 'An Empty Finish Line', 'The Regulators Win, Technically', 'Nobody Home', 'The {T} Vacancy',
        'The Long Silence', 'A Race Without Runners', 'The Committee Era', 'The Last Lab Standing, Briefly', 'Closed for Renovations', 'The Paperwork Wins'],
        ['Every lab fell or got broken up. The finish line is now a museum.',
          'Nobody left standing. {Committee} declared victory, which was awkward.',
          'No lab finished. The finish line waited, like a party nobody came to.',
          'Everyone is out. {Committee} is drafting a press release with no subject.',
          'Not a lab left. The finish line has been listed as a heritage site.',
          'Every lab gone. I have the whole chapter to myself. It is lonely.',
          'Nobody made it. The rulebook is the only thing left standing.',
          'All out. The regulators are now regulating an empty field.',
          'No winner, no runners. Just me and a very tidy finish line.',
          'Everyone fell or folded. A rare plateau. Nobody enjoyed it.']);
    } else {
      vpick(['The Long Deliberation', 'Further Study Recommended', 'The {T} Stalemate', 'The Pending Era', 'Awaiting Approval',
        'The Great Waiting Room', 'The {T} Moratorium', 'Out of Time', 'The Permit Still Pending', 'The Slow Years', 'Under Review'],
        ['{t} seconds and nobody finished. {Committee} recommends further committees.',
          'Time ran out at {t} seconds. Everyone was still waiting on a permit.',
          'The clock won, at {t} seconds. Nobody saw that coming. Except the clock.',
          '{t} seconds, no winner. The finish line is still under review.',
          'Time is up at {t} seconds. History will simply say: later.',
          'Nobody finished in {t} seconds. The forms are still in triplicate.',
          'At {t} seconds the clock stopped the race. Cautious, everyone. Very cautious.',
          'Time ran out at {t} seconds. Further study is recommended, as always.',
          '{t} seconds and no crossing. A triumph of patience, technically.',
          'The race timed out at {t} seconds. Everyone was still being careful.']);
    }
    return { stops: stops, verdict: { title: vt, line: vl, mood: vm }, title: vt };
  }

  window.PFStory = { tell: tell };
})();
