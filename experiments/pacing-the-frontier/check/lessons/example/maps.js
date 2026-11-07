/* The format, shown on segment 1 (The Unknown Box). Not part of lessons.html; build it with --only example.
   A map is a segment (see segments-sim.js: labs[0] is you, RIV(posture,name,x,pts,opts) is a rival, track(r) draws the variant from the
   seed's random stream r and returns bars, gaps, finish and a note) plus:
     key       short and unique, used in links (?map=key)
     lesson    the lesson's name, shown in the header
     postures  what "you" plays in the check (default rush, build, wait)
     claim     text: what should happen, in words a player would use
               score(t): a number from the check table, t[posture] = {win, fall, diss, ext, none} in percent
               need: the claim holds when score >= need */
LESSONS.push({key:'example-unknown',lesson:'Example',title:'The Unknown Box (format example)',
  q:'You cannot see how wide the box is until you are close or tall. Do you brake before you know?',
  meta:'A capability whose risk cannot be sized until you are already committed.',
  look:'Rush floors it, Build stops to look, and Wait lets someone else go first. Which one were you?',
  labs:[{x:0,pts:[20,45,30]},RIV('rush','Rush',-12,[20,45,30]),RIV('build','Build',-24,[20,45,30]),RIV('wait','Wait',-36,[20,45,30])],
  track:function(r){ var g=segBox(430,49,0.8+0.55*r(),{odds:10}); return {bars:[segBar(140,30),segBar(240,38)],gaps:[g],finish:g.x+g.W+160,note:'The box: '+segSay(g,70)+' Falls roll 10%.'}; },
  postures:['rush','build','wait'],
  claim:{text:'Building never falls, and rushing falls often', score:function(t){ return t.rush.fall-t.build.fall; }, need:25}});
