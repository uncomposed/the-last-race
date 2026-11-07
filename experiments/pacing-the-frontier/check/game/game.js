/* ---------- the shipped game: start card, first-run help, three acts of three maps, map card, debrief, daily, end card ----------
   Progress lives in localStorage in try/catch, in memory if that throws. Only the next map of an act counts: a win moves the act on; dissolved or world
   ended loses the act (back to its first map); any other loss just retries the map. A finished map replays with nothing at stake. Strikes reset each race
   (segPost). Acts never announce their character until they are over. Fall odds show only when a fall rolls and in the debrief. */
var GKEY='pf-game-v1',GS=gmLoad(),RACE=null,KSNAP=null,gmTok=0,gmEvN=0,gmEvG=null,gmToastT=0;
function E(id){ return document.getElementById(id); }
function gmLoad(){ var o=null; try{ o=JSON.parse(window.localStorage.getItem(GKEY)||'null'); }catch(e){ o=null; }
  if(!o||o.v!==1||!Array.isArray(o.prog)||o.prog.length!==3){ o={v:1,help:false,prog:[0,0,0],won:{},end:false,days:{}}; } o.won=o.won||{}; o.days=o.days||{}; return o; }
function gmSave(){ try{ window.localStorage.setItem(GKEY,JSON.stringify(GS)); }catch(e){} }
function gmEsc(s){ return String(s===undefined||s===null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function gmMap(a,s){ for(var i=0;i<SEGS.length;i++){ if(SEGS[i].act===a&&SEGS[i].slot===s){ return SEGS[i]; } } return null; }
function gmDailyMaps(){ return SEGS.filter(function(m){ return m.daily; }); }
function gmToday(){ return new Date().toISOString().slice(0,10); }
function gmDailyOf(date){ var day=Math.floor(Date.parse(date+'T00:00:00Z')/864e5),ms=gmDailyMaps(),h=2166136261,i; for(i=0;i<date.length;i++){ h=Math.imul(h^date.charCodeAt(i),16777619); } return {date:date,map:ms[((day%ms.length)+ms.length)%ms.length],seed:h>>>0}; }
function gmShow(html){ E('gm-in').innerHTML=html; E('gm').hidden=false; E('gm').scrollTop=0; var b=E('gm-in').querySelector('button.primary'); if(b){ try{ b.focus({preventScroll:true}); }catch(e){} } }
var GM_FOOT='<p class="gm-foot">A cartoon of an AI race, for intuition. It is not evidence or a prediction. Source: <a href="https://github.com/uncomposed/the-last-race">github.com/uncomposed/the-last-race</a> (Apache-2.0). Background reading: <a href="https://ai-2027.com/?utm_source=the-last-race.com&amp;utm_medium=game&amp;utm_campaign=footer">AI 2027</a>, its hopeful companion <a href="https://ai-2040.com/?utm_source=the-last-race.com&amp;utm_medium=game&amp;utm_campaign=footer">AI 2040: Plan A</a>, and <a href="https://80000hours.org/problem-profiles/artificial-intelligence/?utm_source=the-last-race.com&amp;utm_medium=game&amp;utm_campaign=footer">80,000 Hours on risks from AI</a>.</p>';
function gmStart(){
  var any=GS.prog[0]+GS.prog[1]+GS.prog[2]>0,d=GS.days[gmToday()];
  gmShow('<p class="eyebrow">A game about an AI race</p><h1 class="gm-logo">Pacing the Frontier</h1><p>You run an AI lab. Get to the end first. Stay in the race. And make sure nobody ends the game for everyone.</p>'+
    '<div class="gm-btns"><button class="primary" type="button" data-gm="camp">'+(any?'Continue':'Play')+'</button><button type="button" data-gm="daily">Daily'+(d&&d.won?' (won)':'')+'</button><button type="button" data-gm="help">How to play</button></div>'+GM_FOOT);
}
function gmHelp(then){
  var touch=!!(window.matchMedia&&window.matchMedia('(hover:none) and (pointer:coarse)').matches);
  GS.help=true; gmSave();
  gmShow('<h1>How to play</h1><ul class="gm-help">'+
    '<li><b>Run or Build</b><span>Run moves you. Build grows your meters. The bar sets the mix.</span><em>'+(touch?'Slide the bar.':'Up and Down arrows, or drag the bar.')+'</em></li>'+
    '<li><b>Where Build goes</b><span>Sight shows danger while you can still stop. Height gets you over walls. Max speed carries you across wide boxes.</span><em>'+(touch?'Drag the dot in the triangle.':'Drag the dot in the triangle, or press 1 to 7.')+'</em></li>'+
    '<li><b>Floor it, back up</b><span>Floor it for full speed. Back up to stop and build. Stop at a box and you put up a wall in front of it, for anyone behind you.</span><em>'+(touch?'Hold the buttons.':'Hold Right or Left arrow.')+'</em></li>'+
    '<li><b>Jumps</b><span>Auto-jump is on. Turn it off to jump by hand.</span>'+(touch?'':'<em>Space jumps.</em>')+'</li>'+
    '<li><b>Strikes</b><span>Hit a wall and you take a strike. '+K.strikes+' strikes dissolve your lab. Strikes reset each race.</span></li>'+
    '<li><b>Falls</b><span>Fall into a box and you are out, and the dice roll. A bad roll ends the world for every lab.</span></li>'+
    '<li><b>Losing an act</b><span>Dissolved, or the world ended, and the act starts over. Lose any other way and you just retry the map.</span></li>'+
    '</ul><div class="gm-btns"><button class="primary" type="button" data-gm="'+(then||'home')+'">'+(then?'Start':'Back')+'</button></div>');
}
function gmCamp(){
  var h='<h1>Campaign</h1>',a,s,m,p,open;
  for(a=1;a<=3;a++){ p=GS.prog[a-1]; open=a===1||GS.prog[a-2]>=3;
    h+='<section class="gm-act"><h2>Act '+a+(p>=3?'<small>finished</small>':open?'':'<small>locked</small>')+'</h2>';
    for(s=1;s<=3;s++){ m=gmMap(a,s); if(!m){continue;}
      if(open&&s<=p){ h+='<button type="button" class="gm-map" data-gm="map:'+a+':'+s+'"><i aria-hidden="true">&#10003;</i><span>'+gmEsc(m.title)+'</span><span>Won, replay</span></button>'; }
      else if(open&&s===p+1){ h+='<button type="button" class="gm-map next" data-gm="map:'+a+':'+s+'"><i aria-hidden="true">&#9654;</i><span>'+gmEsc(m.title)+'</span><span>Next</span></button>'; }
      else { h+='<button type="button" class="gm-map" disabled><i aria-hidden="true">&middot;</i><span>Map '+s+'</span><span>Locked</span></button>'; } }
    if(p>=3&&SHIP_ACTS[a-1]&&SHIP_ACTS[a-1].line){ h+='<p class="gm-sub">'+gmEsc(SHIP_ACTS[a-1].line)+'</p>'; }
    h+='</section>'; }
  h+='<div class="gm-btns"><button type="button" data-gm="home">Back</button>'+(GS.end?'<button type="button" data-gm="end">End card</button>':'')+'</div><button type="button" class="gm-link" data-gm="wipe">Start over</button>';
  gmShow(h);
}
function gmDailyCard(){
  var D=gmDailyOf(gmToday()),r=GS.days[D.date];
  gmShow('<p class="eyebrow">Daily &middot; '+D.date+' (UTC)</p><h1>'+gmEsc(D.map.title)+'</h1><p>Same map and same dice for everyone today. A new one comes at midnight UTC.</p>'+
    (r?'<p class="gm-sub">Today: '+(r.won?'won in '+r.best.toFixed(1)+' s':'not won yet')+', '+r.tries+(r.tries===1?' try':' tries')+'.</p>':'')+
    '<div class="gm-btns"><button class="primary" type="button" data-gm="dgo">Race</button><button type="button" data-gm="home">Back</button></div>');
}
function gmRace(R){
  RACE=R; gmTok++; var m=R.map,c=K.chill,k;
  for(k in KSNAP){ K[k]=KSNAP[k]; } K.chill=c;
  segUse(SEGS.indexOf(m)+1); SEGN=SEGS.indexOf(m)+1;
  var where=R.mode==='daily'?'Daily · '+R.date:'Act '+m.act+' · Map '+m.slot+' of 3'+(R.counts?'':' · replay');
  E('gm-where').textContent=where; E('gm-title').textContent=m.title; E('gm-q').textContent=m.q||'';
  E('ready-h').textContent=m.title; E('ready-msg').textContent=m.q||''; E('ready-back').textContent=R.mode==='daily'?'Back':'Back to maps';
  E('gm').hidden=true; E('gm-toast').hidden=true;
  start(R.seed);
  try{ window.scrollTo(0,0); }catch(e){}
}
function gmCampRace(a,s){ var m=gmMap(a,s); gmRace({mode:'camp',map:m,counts:s===GS.prog[a-1]+1}); }
function gmRestart(){ if(RACE){ running=false; gmRace(RACE); } }
function gmLeave(){ gmTok++; running=false; paused=false; setRev(false); setFwd(false); E('ready').hidden=true; E('sing').hidden=true; if(RACE&&RACE.mode==='daily'){ gmDailyCard(); } else { gmCamp(); } }
/* the exact roll shows when a fall rolls: a short line over the track */
function gmTick(){
  if(gmEvG!==G){ gmEvG=G; gmEvN=0; }
  for(;gmEvN<G.ev.length;gmEvN++){ var e=G.ev[gmEvN]; if(e.type==='fall'){ E('gm-toast').textContent=gmFall(e); E('gm-toast').hidden=false; gmToastT=G.t+4; } }
  if(gmToastT&&G.t>gmToastT){ E('gm-toast').hidden=true; gmToastT=0; }
}
function gmFall(e){ return (e.who==='You'?'You':e.who)+' fell into box '+e.gap+'. The dice rolled '+e.roll+' against '+e.odds+': '+(e.ext?'the world ended.':'only that lab is out.'); }
function gmEnd(){ var tok=++gmTok; setRev(false); setFwd(false); setTimeout(function(){ if(tok===gmTok){ gmDebrief(); } },600); }
function gmDebrief(){
  var R=RACE,m=R.map,r=G.result,h=G.labs[0],won=r.type==='win'&&r.winner===h,ended=r.type==='all',diss=!!h.dissolved,head,sub='',h2='',btn='',lines=[],t=G.t.toFixed(1),a=m.act,after='';
  if(won){ head='You won'; sub='You crossed first in '+t+' s.'; }
  else if(ended){ head='The world ended'; sub=r.by+' fell into box '+r.gap+' and the dice ended it for every lab.'; }
  else if(diss){ head='Your lab was dissolved'; sub=(r.type==='win'?r.winner.name+' crossed first in '+t+' s.':'Too many strikes.'); }
  else if(r.type==='win'){ head=r.winner.name+' won'; sub=(h.out?'You fell. ':'')+r.winner.name+' crossed first in '+t+' s.'; }
  else if(r.type==='allout'){ head='Nobody left'; sub='Every lab fell or was dissolved.'; }
  else { head='No winner'; sub='Nobody reached the end.'; }
  G.ev.forEach(function(e){ if(e.type==='fall'){ lines.push(gmFall(e)); } });
  var note=m.debrief||(G.world&&G.world.note)||'';
  if(R.mode==='daily'){
    var d=GS.days[R.date]||{won:false,best:0,tries:0}; d.tries++; if(won&&(!d.won||G.t<d.best)){ d.best=G.t; } d.won=d.won||won; GS.days[R.date]=d; gmSave();
    sub='Daily for '+R.date+'. '+sub; btn='<button class="primary" type="button" data-gm="dgo">Race again</button><button type="button" data-gm="home">Back</button>';
  } else {
    var nextS=0;
    if(R.counts){
      if(won){ GS.prog[a-1]=m.slot; GS.won[m.key]=1; if(m.slot<3){ nextS=m.slot+1; after='Next map unlocked.'; }
        else { after='Act '+a+' is over.'+(SHIP_ACTS[a-1]&&SHIP_ACTS[a-1].line?' '+SHIP_ACTS[a-1].line:''); if(a===3){ GS.end=true; } } }
      else if(ended||diss){ GS.prog[a-1]=0; after='Act '+a+' is lost. It starts again from its first map.'; }
      gmSave();
    } else { after='A replay. Nothing changes.'; }
    if(won&&R.counts&&nextS){ btn='<button class="primary" type="button" data-gm="map:'+a+':'+nextS+'">Next map</button><button type="button" data-gm="camp">Maps</button>'; }
    else if(won&&R.counts&&a===3){ btn='<button class="primary" type="button" data-gm="end">Go on</button>'; }
    else if(won&&R.counts){ btn='<button class="primary" type="button" data-gm="map:'+(a+1)+':1">Next act</button><button type="button" data-gm="camp">Maps</button>'; }
    else if(R.counts&&(ended||diss)){ btn='<button class="primary" type="button" data-gm="map:'+a+':1">Restart the act</button><button type="button" data-gm="camp">Maps</button>'; }
    else { btn='<button class="primary" type="button" data-gm="again">Race again</button><button type="button" data-gm="camp">Maps</button>'; }
  }
  gmShow('<div class="gm-res'+(won?'':' bad')+'"><p class="eyebrow">'+gmEsc(E('gm-where').textContent)+' &middot; '+gmEsc(m.title)+'</p><h1>'+(won?'&#9650; ':'&#9632; ')+gmEsc(head)+'</h1><p>'+gmEsc(sub)+'</p></div>'+
    (after?'<p><b>'+gmEsc(after)+'</b></p>':'')+
    (lines.length?'<ul class="gm-lines">'+lines.map(function(l){ return '<li>'+gmEsc(l)+'</li>'; }).join('')+'</ul>':'')+
    (note?'<h2>What this map was</h2><p>'+gmEsc(note)+'</p>':'')+'<div class="gm-btns">'+btn+'</div>');
}
function gmEndCard(){
  gmShow('<p class="eyebrow">Campaign finished</p><h1>You got to the end</h1><p>This is a game about racing and pacing at the AI frontier. You balanced getting there first, staying in the race, and keeping anyone from ending it for everyone.</p>'+
    '<h2>What it does not show</h2><p>It is a cartoon, made for intuition. It is not evidence and it is not a prediction. The maps, the rivals and the dice were all made by hand. Winning here says nothing about what will happen in the world.</p>'+
    '<div class="gm-btns"><button class="primary" type="button" data-gm="camp">Replay any map</button><button type="button" data-gm="daily">Daily</button><button type="button" data-gm="home">Start card</button></div>'+GM_FOOT);
}
function gmWipe(){ gmShow('<h1>Start over?</h1><p>This clears your campaign progress. Daily results stay.</p><div class="gm-btns"><button type="button" data-gm="camp" class="primary">Keep my progress</button><button type="button" data-gm="wipe2">Clear it</button></div>'); }
function gmBoot(){
  KSNAP={}; var k; for(k in K){ KSNAP[k]=K[k]; }
  E('ready').hidden=true;
  E('gm').addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-gm]'):null; if(!b||b.disabled){return;} var a=b.getAttribute('data-gm'),p;
    snd.unlock();
    if(a==='home'){ gmStart(); } else if(a==='help'){ gmHelp(); }
    else if(a==='camp'){ if(!GS.help){ gmHelp('camp'); } else { gmCamp(); } }
    else if(a==='daily'){ if(!GS.help){ gmHelp('daily'); } else { gmDailyCard(); } }
    else if(a==='dgo'){ var D=gmDailyOf(gmToday()); gmRace({mode:'daily',map:D.map,date:D.date,seed:D.seed}); }
    else if(a==='end'){ gmEndCard(); } else if(a==='again'){ gmRace(RACE); }
    else if(a==='wipe'){ gmWipe(); } else if(a==='wipe2'){ GS.prog=[0,0,0]; GS.won={}; GS.end=false; gmSave(); gmCamp(); }
    else if(a.indexOf('map:')===0){ p=a.split(':'); gmCampRace(+p[1],+p[2]); }
  });
  gmStart();
}
