/* ---------- the shipped game: start card, first-run help, three acts of three maps, map card, debrief, daily, end card ----------
   Progress lives in localStorage in try/catch, in memory if that throws. Only the next map of an act counts: a win moves the act on; any loss, a dissolve
   or a world end included, retries just that map (Cole, 2026-11-06). A finished map replays with nothing at stake. Strikes reset each race
   (segPost). Acts never announce their character until they are over. Fall odds show only when a fall rolls and in the debrief. */
var GKEY='pf-game-v1',GS=gmLoad(),RACE=null,KSNAP=null,gmTok=0,gmEvN=0,gmEvG=null,gmToastT=0;
var SIM_ID='';  /* the hash of the simulation section, maps included: build.mjs fills it in */
/* ghosts: off unless this browser has asked for them, with ?ghosts=1 (and ?ghosts=0 to stop). Off means nothing is recorded, stored or drawn */
var GH_ON=gmSwitch('ghosts','pf-ghosts'),GH_KEY='pf-ghost-v1',REC=null,GHOST=null,GH_MAX=60;
function gmSwitch(q,key){ var m=new RegExp('[?&]'+q+'=(0|1)(?:&|$)').exec(location.search),v=null; try{ if(m){ if(m[1]==='1'){ window.localStorage.setItem(key,'1'); } else { window.localStorage.removeItem(key); } } v=window.localStorage.getItem(key); }catch(e){ v=m&&m[1]==='1'?'1':null; } return v==='1'; }
/* the daily board: off unless this browser asks with ?lb=prod or ?lb=local (?lb=off stops), and only when the server answers that it runs this exact simulation.
   LB_PROD stays empty until Cole's server is live. Until then, and whenever the check fails, nothing about a board shows anywhere. Nothing leaves the device unless the player presses Publish. */
var LB_PROD='',LB_LOCAL='http://127.0.0.1:8787',LB_ORIGIN=lbOrigin(),LB_OK=false,LB_WAIT=4000,LB_NAME='pf-lb-name',LB_TOKEN='pf-lb-token',LB_PENDING=null;
function lbOrigin(){ var m=/[?&]lb=(prod|local|off)(?:&|$)/.exec(location.search),v=null; try{ if(m){ if(m[1]==='off'){ window.localStorage.removeItem('pf-lb'); } else { window.localStorage.setItem('pf-lb',m[1]); } } v=window.localStorage.getItem('pf-lb'); }catch(e){ v=m&&m[1]!=='off'?m[1]:null; } return v==='prod'?LB_PROD:v==='local'?LB_LOCAL:''; }
function lbCall(path,body,cb){
  if(!LB_ORIGIN||typeof fetch!=='function'){ cb(null); return; }
  var done=false,ctl=typeof AbortController!=='undefined'?new AbortController():null,o={method:body?'POST':'GET',credentials:'omit',mode:'cors'},t;
  function fin(v){ if(!done){ done=true; clearTimeout(t); cb(v); } }
  if(body){ o.headers={'Content-Type':'application/json'}; o.body=JSON.stringify(body); } if(ctl){ o.signal=ctl.signal; }
  t=setTimeout(function(){ if(ctl){ try{ ctl.abort(); }catch(e){} } fin(null); },LB_WAIT);
  fetch(LB_ORIGIN+path,o).then(function(r){ return r.json().then(function(j){ fin({status:r.status,json:j}); }); }).catch(function(){ fin(null); });
}
/* can this server verify a run from this build? anything but a clear yes keeps the board hidden */
function lbProbe(then){ LB_OK=false; if(!LB_ORIGIN){ if(then){ then(); } return; } lbCall('/v1/sim/'+SIM_ID,null,function(a){ LB_OK=!!(a&&a.status===200&&a.json&&a.json.ok===true&&a.json.sim===SIM_ID); if(then){ then(); } }); }
function lbPlaceLine(rows,t){ var f=0,i; for(i=0;i<rows.length;i++){ if(rows[i]<t){ f++; } } var n=rows.length; return n?'You would be '+lbOrd(f+1)+(n>=100?' of '+(n+1):'')+' today.':'You would be the first on today\'s board.'; }
function lbOrd(n){ var s=n%100; return n+((s>=11&&s<=13)?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th')); }
function lbRows(title,rows){ return '<h2>'+gmEsc(title)+'</h2><ol class="gm-lb">'+rows.slice(0,10).map(function(r){ return '<li><span>'+gmEsc(r.name)+'</span><span>'+Number(r.t).toFixed(3)+' s</span><span>'+Number(r.attempts)+(r.attempts===1?' try':' tries')+', '+(r.chill?'auto-jump':'hand jump')+'</span></li>'; }).join('')+'</ol>'; }
/* a board only appears once it has loaded and is whole; a failure leaves the card as it would be with no board at all */
function lbBoard(date,key,el){
  lbCall('/v1/daily/'+date+'/'+key,null,function(a){
    var j=a&&a.status===200&&a.json,box=E(el); if(!box||!j||!Array.isArray(j.any)||!Array.isArray(j.first)){ return; }
    box.innerHTML=(j.any.length?lbRows('Today, any try',j.any)+(j.first.length?lbRows('Today, first try',j.first):''):'<p class="gm-sub">Nobody has published today yet.</p>')+'<p class="gm-sub">Times are checked by racing them again on the server. Tries are what each browser reports, and are not checked.</p>';
  });
}
function lbOffer(R,run,tries){
  LB_PENDING={date:R.date,run:run,tries:tries};
  lbCall('/v1/daily/'+R.date+'/'+R.map.key,null,function(a){
    var j=a&&a.status===200&&a.json,box=E('gm-lb'); if(!box||!j||!Array.isArray(j.times)){ return; }
    box.innerHTML='<p>'+lbPlaceLine(j.times,run.end.t)+'</p><p class="gm-sub">Your time stays on this device unless you publish it.</p><div class="gm-btns"><button type="button" data-gm="lbpub">Publish my time</button></div>';
  });
}
function lbPublishCard(){
  var P=LB_PENDING,n=''; try{ n=window.localStorage.getItem(LB_NAME)||''; }catch(e){}
  E('gm-lb').innerHTML='<h2>Publish</h2><label class="gm-lbname">Name, up to 16 letters <input id="gm-lbn" maxlength="16" value="'+gmEsc(n)+'"></label><p class="gm-sub">This sends your name, your time of '+P.run.end.t.toFixed(3)+' s, your '+P.tries+(P.tries===1?' try':' tries')+' today, whether auto-jump was on, your controls for this race so the server can race them again, and a random code that lets this browser remove the entry. No account, and nothing else.</p><div class="gm-btns"><button type="button" data-gm="lbsend">Send it</button><button type="button" class="primary" data-gm="lbkeep">Keep it private</button></div>';
}
function lbToken(){ var t=null; try{ t=window.localStorage.getItem(LB_TOKEN); }catch(e){} if(t&&/^[0-9a-f]{32}$/.test(t)){ return t; } if(!window.crypto||!window.crypto.getRandomValues){ return null; } var u=new Uint8Array(16),i; window.crypto.getRandomValues(u); t=''; for(i=0;i<16;i++){ t+=(u[i]<16?'0':'')+u[i].toString(16); } try{ window.localStorage.setItem(LB_TOKEN,t); }catch(e){} return t; }
function lbSend(){
  var P=LB_PENDING,box=E('gm-lb'),name=(E('gm-lbn').value||'').trim().slice(0,16),tok=lbToken();
  if(!name){ E('gm-lbn').focus(); return; } if(!tok){ box.innerHTML='<p class="gm-sub">This browser cannot publish. Your result here is safe.</p>'; return; }
  try{ window.localStorage.setItem(LB_NAME,name); }catch(e){}
  box.innerHTML='<p class="gm-sub">Racing your run again on the server.</p>';
  lbCall('/v1/daily/'+P.date+'/'+P.run.map,{run:P.run,name:name,tries:P.tries,token:tok},function(a){
    var j=a&&a.json,b=E('gm-lb'); if(!b){ return; }
    if(a&&a.status===200&&j&&j.ok===true&&typeof j.place==='number'){ b.innerHTML='<p><b>Published: '+lbOrd(j.place)+(j.entries>=100?' of '+Number(j.entries):'')+'.</b></p>'; LB_PENDING=null; }
    else if(a&&j&&j.ok===false){ b.innerHTML='<p>This run could not be verified, so nothing was stored.</p>'; LB_PENDING=null; }
    else { b.innerHTML='<p class="gm-sub">The server did not answer. Your result here is safe.</p><div class="gm-btns"><button type="button" data-gm="lbsend2">Try again</button></div>'; }
  });
}
function ghStore(){ try{ var o=JSON.parse(window.localStorage.getItem(GH_KEY)||'null'); return o&&typeof o==='object'?o:{}; }catch(e){ return {}; } }
function ghStoreSet(o){ var ks=Object.keys(o); while(ks.length>GH_MAX){ delete o[ks.shift()]; } try{ window.localStorage.setItem(GH_KEY,JSON.stringify(o)); }catch(e){} }
function ghSlot(R){ return R.mode==='daily'?'d:'+R.date+':'+R.map.key:R.map.key; }
/* race the stored best again before showing it. A run from another build, or one that does not end as it did, is dropped and says so. Returns {t,run,x,y} or {why} or null */
function ghLoad(R){
  var s=ghStore(),k=ghSlot(R),r=s[k],why,tr=[],m,o; if(!r){ return null; }
  why=ghRefuse(r,SIM_ID,SEGS);
  if(!why){ o=ghReplay({K:K,KSNAP:KSNAP,SEGS:SEGS,segUse:segUse,newGame:newGame,step:stepGame,G:function(){ return G; }},r,function(g){ var l=g.labs[0]; tr.push(l.x,heightOf(l)+l.jy,l.out||l.dissolved?1:0); }); if(!ghSame(o,r)){ why='it does not replay the same here'; } }
  if(why){ delete s[k]; ghStoreSet(s); return {why:why}; }
  return {run:r,tr:tr,t:r.end.t};
}
/* the ghost is drawn from its replay and never touches the race: a dashed outline with a label, so it reads without colour */
function ghDrawBest(cam,VW,FW){
  if(!GHOST||!GHOST.tr||!G){ return; }
  var tr=GHOST.tr,i=Math.min(Math.round(G.t*60),tr.length/3)-1; if(i<0){ i=0; }
  var x=tr[3*i],h=tr[3*i+1],gone=tr[3*i+2],U=CM?1/Z:1,sx=x-cam-C.RW,y=GY-h-C.RW,lab='Your best'+(gone?' (out)':'');
  ctx.save(); ctx.font=FW; ctx.fillStyle=COL.ink; ctx.strokeStyle=COL.ink; ctx.lineWidth=1.2*U;
  if(sx<-C.RW-4||sx>VW+4){ var d=Math.round(Math.abs(x-G.labs[0].x)),t=sx>VW?lab+' '+d+' ahead >':'< '+lab+' '+d+' behind',w=ctx.measureText(t).width; ctx.fillText(t,sx>VW?VW-w-6*U:6*U,GY-(CM?44:60)*U); ctx.restore(); return; }
  ctx.globalAlpha=gone?0.45:0.9; ctx.setLineDash([3*U,2*U]); ctx.strokeRect(sx,y,C.RW,C.RW); ctx.setLineDash([]); ctx.fillText(lab,sx,y-20*U); ctx.restore();
}
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
    '<div class="gm-btns"><button class="primary" type="button" data-gm="camp">'+(any?'Continue':'Play')+'</button><button type="button" data-gm="daily">Daily'+(d&&d.won?' (won)':'')+'</button><button type="button" data-gm="help">How to play</button>'+(ptOn()?'<button type="button" data-gm="ptl">Playtest</button>':'')+'</div>'+GM_FOOT);
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
    '<li><b>Losing</b><span>Lose any way you like and you retry that map. Maps you have won stay won.</span></li>'+
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
    '<div class="gm-btns"><button class="primary" type="button" data-gm="dgo">Race</button><button type="button" data-gm="home">Back</button></div><div id="gm-lbb"></div>');
  if(LB_ORIGIN){ lbProbe(function(){ if(LB_OK){ lbBoard(D.date,D.map.key,'gm-lbb'); } }); }
}
function gmRace(R){
  ptQuit(); RACE=R; gmTok++; var m=R.map,c=K.chill,k,seed=R.seed;
  GHOST=null; REC=null;
  if(GH_ON&&R.mode!=='gen'){ GHOST=ghLoad(R); if(GHOST&&GHOST.run&&R.mode!=='daily'){ seed=GHOST.run.seed; } }  /* a won map, raced on the same dice as your best */
  for(k in KSNAP){ K[k]=KSNAP[k]; } K.chill=c;
  segUse(SEGS.indexOf(m)+1); SEGN=SEGS.indexOf(m)+1;
  var where=R.mode==='daily'?'Daily · '+R.date:R.mode==='gen'?(R.pt?'Playtest · drawn map '+R.gen:'Drawn map '+R.gen+' · research'):'Act '+m.act+' · Map '+m.slot+' of 3'+(R.counts?'':' · replay');
  E('gm-where').textContent=where; E('gm-title').textContent=m.title; E('gm-q').textContent=m.q||'';
  E('ready-h').textContent=m.title; E('ready-msg').textContent=(m.q||'')+(GHOST&&GHOST.run?' Your best, '+GHOST.t.toFixed(1)+' s, races with you.':GHOST?' Your saved best was dropped: '+GHOST.why+'.':''); E('ready-back').textContent=R.mode==='camp'?'Back to maps':'Back';
  E('gm').hidden=true; E('gm-toast').hidden=true;
  start(seed);
  if(R.mode==='gen'){ REC=ghNew(SIM_ID,m.key,G.seed,K.chill); REC.at=new Date().toISOString(); }  /* the playtest log: every race on a drawn map, with the dice it really got. No ghost is drawn or stored */
  else if(GH_ON||(LB_OK&&R.mode==='daily')){ REC=ghNew(SIM_ID,m.key,G.seed,K.chill); }
  try{ window.scrollTo(0,0); }catch(e){}
}
/* drawn maps (issue 36 step 2, research only): ?gen=1&seed=N goes straight into the pattern generator's map N. Nothing counts toward the campaign;
   each race is recorded in the playtest log on this device (below).
   On a map with a hidden finish the flag and the minimap tick stay hidden until the finish is within your sight, and the minimap is scaled to what
   you know instead of to the finish */
function gmFinSeen(){ var h=G.labs[0]; return !(SEG&&SEG.hideFinish)||G.over||G.finish-h.x<=sightRange(h); }
function gmMapLen(t){ if(gmFinSeen()){ return G.finish; } var f=t.x+sightRange(t),i;
  for(i=0;i<G.labs.length;i++){ f=Math.max(f,G.labs[i].x); }
  for(i=0;i<G.barriers.length;i++){ if(knowsBar(t,i)){ f=Math.max(f,G.barriers[i].x); } }
  for(i=0;i<G.gaps.length;i++){ if(knowsGap(t,i)){ f=Math.max(f,G.gaps[i].x+G.gaps[i].W); } }
  return f+600; }
function gmGenSeed(){ var q=/[?&]gen=1(?:&|$)/.test(location.search)&&/[?&]seed=(\d{1,9})(?:&|$)/.exec(location.search); return q&&typeof gnDraw==='function'?+q[1]:0; }
/* one line, and nothing of the page in it: check/lessons/gen/replay-log.mjs runs this same text under Node to register a drawn map before replaying it */
function gmGenMap(seed){ var m=null,i; for(i=0;i<SEGS.length;i++){ if(SEGS[i].key==='gn-'+seed){ m=SEGS[i]; } } if(!m){ m=gnDraw(seed); m.soft=m.soft||{n:3}; Object.defineProperty(m,'labs',{get:function(){ return shLabs(this.P); },enumerable:true,configurable:true}); SEGS.push(m); } return m; }
function gmGenRace(seed,pt){ var m=gmGenMap(seed); m.title=pt?'Map '+pt+' of '+PT_MAPS.length:'Drawn map '+seed; gmRace({mode:'gen',map:m,gen:seed,counts:false,pt:pt||0}); }
/* ---------- the playtest (issue 36 step 3): every race on a drawn map is recorded on this device, each map gets a verdict, and the log is copied out by hand ----------
   ?playtest=1 lists the data book's six maps in its play order (check/lessons/gen/DATABOOK.md, section 7). A record is the ghost's run (the dice, the map and
   every change to the controls) plus how the race went, so check/lessons/gen/replay-log.mjs can race it again under Node. A race left after Go is recorded as quit.
   Nothing is sent anywhere. One localStorage key, in try/catch, in memory if that throws; when a write fails for size the oldest races lose their controls and
   keep their results, and the cards say so. A verdict is a word and a shape, and a choice is a filled button: colour never carries either alone. */
var PT_KEY='pf-playtest-v1',PT_MAPS=[6,37,180,85,164,72],PT=ptLoad(),PT_MEM=false,PT_T=0,PT_LAST=null,PT_CUR=0;
/* question 3 of each map, word for word from the test sheet. Only the verdict card shows it: before the race it would give the map away */
var PT_Q=['Did the wall staircase after the tall box catch you short of height? Was anything unfair?','When did it get interesting? Was anything unfair?','Did you win just by following the Warden? Was there a moment you had to think?',
  'At the wide box, did you wait for the Pioneer or jump? Was anything unfair?','Did the first wall feel fair? What build won it for you?','Did the early strike in the pack\'s shadow feel fair? Was there a real decision, or just floor it?'];
var PT_V=[['fun','Fun','&#9733;'],['bland','Bland','&#9644;'],['frustrating','Frustrating','&#10005;']];
function ptOn(){ return /[?&]playtest=1(?:&|$)/.test(location.search)&&typeof gnDraw==='function'; }
function ptNew(){ return {v:1,runs:[],verdicts:{},again:null}; }
function ptLoad(){ var o=null; try{ o=JSON.parse(window.localStorage.getItem(PT_KEY)||'null'); }catch(e){ o=null; } if(!o||o.v!==1||!Array.isArray(o.runs)){ o=ptNew(); } o.verdicts=o.verdicts||{}; return o; }
/* write the log. If it does not fit, cut the controls of the oldest race that still has them and try again. If nothing fits, put the controls back and keep the log in
   memory; from then on a failed write is not retried with cuts, so a browser with no storage at all does not pay for them on every save */
function ptStore(){
  var rs=PT.runs,cut=[],i=0; if(PT_T){ clearTimeout(PT_T); PT_T=0; }
  for(;;){
    try{ window.localStorage.setItem(PT_KEY,JSON.stringify(PT)); PT_MEM=false; return; }catch(e){ if(PT_MEM){ return; } }
    while(i<rs.length&&!rs[i].inp){ i++; } if(i>=rs.length){ break; }
    cut.push([rs[i],rs[i].inp]); delete rs[i].inp; rs[i].cut=1;
  }
  cut.forEach(function(c){ c[0].inp=c[1]; delete c[0].cut; }); PT_MEM=true;
}
function ptSoon(){ if(!PT_T){ PT_T=setTimeout(ptStore,300); } }
function ptFlush(){ if(PT_T){ ptStore(); } }
function ptRuns(d){ return PT.runs.filter(function(r){ return r.draw===d; }); }
function ptWon(d){ return ptRuns(d).some(function(r){ return !!(r.end&&r.end.won); }); }
function ptVerdictOf(d,make){ return PT.verdicts[d]||(make?(PT.verdicts[d]={v:null,note:''}):{}); }  /* make: about to write to it */
function ptV(k){ for(var i=0;i<PT_V.length;i++){ if(PT_V[i][0]===k){ return PT_V[i]; } } return null; }
function ptTries(n){ return n+(n===1?' try':' tries'); }
function ptRaces(){ var n=PT.runs.length; return n+(n===1?' race':' races'); }
function ptWarn(){ var n=PT.runs.filter(function(r){ return r.cut; }).length;
  return PT_MEM?'Not saved: this browser will not store the log. It lasts until this page closes, so copy it before you leave.':n?'Storage is full. The oldest '+(n===1?'race':n+' races')+' kept the result and lost the controls. Copy the full log, then clear it.':''; }
function ptWarnP(){ var w=ptWarn(); return w?'<p class="pt-warn">'+gmEsc(w)+'</p>':''; }
/* the player's own events and every fall, with only the numbers that say what happened */
function ptEvs(){
  var o=[],ks=['gap','bar','h','n','of','what','v','w','cov','roll','odds'];
  G.ev.forEach(function(e){ if(!e.human&&e.type!=='fall'){ return; } var q={t:e.t,e:e.type,x:e.x},i; if(!e.human){ q.who=e.who; }
    for(i=0;i<ks.length;i++){ if(e[ks[i]]!==undefined){ q[ks[i]]=e[ks[i]]; } } if(e.ext){ q.ext=1; } if(e.again){ q.again=1; } o.push(q); });
  return o;
}
function ptLive(){ return !!(REC&&RACE&&RACE.mode==='gen'&&REC.n>0&&G&&!G.over); }
function ptQuit(){ if(ptLive()){ ptAdd(true); } }
/* one record per race. quit: Go was pressed and the race was left before its end, so there is no end, only where it stood. keep: the page is being hidden,
   so store what there is and go on recording; the same record is filled in again if the race goes on */
function ptAdd(quit,keep){
  var r=REC,h=G.labs[0],d=RACE.gen,e=r.pt||{}; ghEnd(r,G);
  e.v=1; e.draw=d; e.key=r.map; e.sim=r.sim; e.seed=r.seed; e.chill=r.chill; e.at=r.at; e['try']=e['try']||ptRuns(d).length+1; e.n=r.n; e.inp=r.inp; delete e.cut;
  e.end=quit?null:r.end; if(quit){ e.quit={t:r.end.t,print:r.end.print}; } else { delete e.quit; }
  e.strikes=h.strikes||0; e.out=h.out?1:0; e.dissolved=h.dissolved?1:0; e.ev=ptEvs();
  if(!r.pt){ PT.runs.push(e); } r.pt=e; r.end=null; PT_LAST=e; if(!keep){ REC=null; } ptStore();
}
function ptRace(i){ PT_CUR=i; gmGenRace(PT_MAPS[i-1],i); }
function ptList(){
  var h='<p class="eyebrow">Playtest</p><h1>Six maps</h1><p>Play them in this order, about two tries each. Every race is recorded on this device, win or lose.</p>'+ptWarnP(),next=0,i,d,n,v;
  for(i=0;i<PT_MAPS.length;i++){ if(!next&&!ptVerdictOf(PT_MAPS[i]).v){ next=i+1; } }
  for(i=0;i<PT_MAPS.length;i++){ d=PT_MAPS[i]; n=ptRuns(d).length; v=ptV(ptVerdictOf(d).v);
    h+='<button type="button" class="gm-map pt-map'+(next===i+1?' next':'')+'" data-gm="ptgo:'+(i+1)+'"><i aria-hidden="true">'+(v?v[2]:next===i+1?'&#9654;':'&middot;')+'</i><span>Map '+(i+1)+'<small>drawn map '+d+'</small></span>'+
      '<span>'+(n?ptTries(n)+', '+(ptWon(d)?'won':'not won yet')+', '+(v?v[1]:'no verdict yet'):'Not played')+'</span></button>'; }
  gmShow(h+'<div class="gm-btns"><button type="button" data-gm="ptx">Copy my log</button><button type="button" data-gm="ptfin">Finish</button><button type="button" data-gm="home">Start page</button></div><p class="gm-sub">'+ptRaces()+' recorded on this device. Nothing leaves this device unless you copy it.</p>');
}
function ptVerdict(i){
  var d=PT_MAPS[i-1],n=ptRuns(d).length,v=ptVerdictOf(d),last=i===PT_MAPS.length; PT_CUR=i;
  gmShow('<p class="eyebrow">Playtest &middot; Map '+i+' of '+PT_MAPS.length+'</p><h1>How was Map '+i+'?</h1><p class="gm-sub">'+ptTries(n)+', '+(ptWon(d)?'won':'not won')+'.</p>'+
    '<div class="pt-v" role="group" aria-label="Your verdict">'+PT_V.map(function(q){ return '<button type="button" class="pt-'+q[0]+'" data-gm="ptv:'+q[0]+'" aria-pressed="'+(v.v===q[0])+'"><i aria-hidden="true">'+q[2]+'</i>'+q[1]+'</button>'; }).join('')+'</div>'+
    '<label class="pt-q" for="pt-note"><span>One word for it.</span><span>'+gmEsc(PT_Q[i-1])+'</span></label><textarea class="pt-note" id="pt-note" rows="6" aria-describedby="pt-saved">'+gmEsc(v.note||'')+'</textarea>'+
    '<p class="gm-sub" id="pt-saved">Saved as you type. Skip anything you like.</p>'+ptWarnP()+
    '<div class="gm-btns"><button class="primary" type="button" data-gm="'+(last?'ptfin':'ptnext')+'">'+(last?'Finish':'Next map')+'</button><button type="button" data-gm="ptgo:'+i+'">Race it again</button><button type="button" data-gm="ptl">Map list</button></div>');
}
function ptPress(sel,on){ var bs=E('gm-in').querySelectorAll(sel),i; for(i=0;i<bs.length;i++){ bs[i].setAttribute('aria-pressed',String(bs[i].getAttribute('data-gm')===on)); } }
function ptExportHtml(){
  return '<p><b>'+ptRaces()+' recorded on this device.</b> Nothing leaves this device unless you copy it.</p>'+ptWarnP()+
    '<div class="gm-btns"><button class="primary" type="button" data-gm="ptcs">Copy summary</button><button type="button" data-gm="ptcf">Copy full log</button></div>'+
    '<p class="gm-sub">The summary is short text to paste into a chat. The full log adds every change to your controls, so each race can be raced again exactly, and the name of this browser.</p>'+
    '<p id="pt-msg" role="status" aria-live="polite"></p><textarea class="pt-out" id="pt-out" rows="8" readonly hidden aria-label="Text to copy by hand"></textarea>'+
    '<div id="pt-clr"><button type="button" class="gm-link pt-link" data-gm="ptclr">Clear my playtest log</button></div>';
}
function ptFinish(){
  gmShow('<p class="eyebrow">Playtest &middot; the end</p><h1>Which map would you play again?</h1><div class="pt-a" role="group" aria-label="The map you would play again">'+
    PT_MAPS.map(function(d,i){ return '<button type="button" data-gm="pta:'+d+'" aria-pressed="'+(PT.again===d)+'">Map '+(i+1)+'</button>'; }).join('')+'<button type="button" data-gm="pta:none" aria-pressed="'+(PT.again==='none')+'">None</button></div>'+
    '<h2>Copy your log</h2>'+ptExportHtml()+'<div class="gm-btns"><button type="button" data-gm="ptl">Map list</button></div>');
}
function ptExport(){ gmShow('<p class="eyebrow">Playtest</p><h1>Your log</h1>'+ptExportHtml()+'<div class="gm-btns"><button type="button" data-gm="'+(ptOn()?'ptl':'home')+'">Back</button></div>'); }
/* how one race went, in a few plain words */
function ptWord(r){
  var e=r.end,s=r.strikes?', '+r.strikes+(r.strikes===1?' strike':' strikes'):'';
  if(!e){ return 'quit at '+(r.quit?r.quit.t.toFixed(1):'?')+' s'+s; }
  return (e.won?'won':e.type==='all'?'lost, the world ended':r.dissolved?'lost, dissolved':r.out?'lost, fell':e.type==='win'?'lost, a rival crossed first':e.type==='allout'?'lost, nobody left':'no winner')+', '+e.t.toFixed(1)+' s'+s;
}
function ptSummary(){
  var L=['Pacing the Frontier playtest. '+ptRaces()+'. Build '+SIM_ID+'. Copied '+new Date().toISOString().slice(0,16).replace('T',' ')+' UTC.'],other={},a=PT.again;
  function block(name,d){ var rs=ptRuns(d),v=ptVerdictOf(d),w=0,q=ptV(v.v),note=(v.note||'').trim(); rs.forEach(function(r){ if(!w&&r.end&&r.end.won){ w=r['try']; } });
    L.push(''); L.push(name+': '+(rs.length?ptTries(rs.length)+', '+(w?'first won on try '+w:'not won'):'not played')+'. Verdict: '+(q?q[1]:'none')+'.');
    rs.forEach(function(r){ L.push('  Try '+r['try']+': '+ptWord(r)+'.'); }); if(note){ L.push('  Note: '+note); } }
  PT_MAPS.forEach(function(d,i){ block('Map '+(i+1)+' (drawn map '+d+')',d); });
  PT.runs.forEach(function(r){ if(PT_MAPS.indexOf(r.draw)<0&&!other[r.draw]){ other[r.draw]=1; block('Drawn map '+r.draw+' (not one of the six)',r.draw); } });
  L.push(''); L.push('Would play again: '+(a==='none'?'none':a?'Map '+(PT_MAPS.indexOf(a)+1)+' (drawn map '+a+')':'not answered')+'.');
  return L.join('\n');
}
function ptFull(){ return JSON.stringify({v:1,what:'pf-playtest',sim:SIM_ID,copied:new Date().toISOString(),browser:String(navigator.userAgent||''),maps:PT_MAPS,again:PT.again,verdicts:PT.verdicts,runs:PT.runs}); }
/* copy inside the click. If the browser refuses or cannot, show the text selected, to copy by hand */
function ptCopy(text,what){
  var msg=E('pt-msg'),box=E('pt-out');
  function byHand(){ if(!E('pt-out')){ return; } box.value=text; box.hidden=false; msg.textContent='This browser would not copy it. '+what+' is in the box below, selected: copy it by hand.'; try{ box.focus(); box.select(); box.setSelectionRange(0,text.length); }catch(e){} }
  box.hidden=true; msg.textContent='';
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(function(){ if(E('pt-msg')){ msg.textContent=what+' copied, '+text.length+' characters. Paste it where you want it.'; } },byHand); } else { byHand(); } }catch(e){ byHand(); }
}
function ptClick(a){
  var p=a.split(':'),v;
  if(a==='ptl'){ ptList(); } else if(p[0]==='ptgo'){ ptRace(+p[1]); } else if(a==='ptdone'){ ptVerdict(RACE.pt); }
  else if(p[0]==='ptv'){ v=ptVerdictOf(PT_MAPS[PT_CUR-1],true); v.v=v.v===p[1]?null:p[1]; v.at=new Date().toISOString(); ptPress('.pt-v button','ptv:'+v.v); ptStore(); }
  else if(a==='ptnext'){ ptRace(PT_CUR+1); } else if(a==='ptfin'){ ptFinish(); } else if(a==='ptx'){ ptExport(); }
  else if(p[0]==='pta'){ PT.again=p[1]==='none'?'none':+p[1]; ptPress('.pt-a button',a); ptStore(); }
  else if(a==='ptcs'){ ptCopy(ptSummary(),'The summary'); } else if(a==='ptcf'){ ptCopy(ptFull(),'The full log'); }
  else if(a==='ptclr'){ E('pt-clr').innerHTML='<p>Clear '+ptRaces()+', every verdict and every note from this device? This cannot be undone.</p><div class="gm-btns"><button type="button" class="primary" data-gm="ptkeep">Keep my log</button><button type="button" data-gm="ptclr2">Clear it</button></div>'; }
  else if(a==='ptkeep'){ E('pt-clr').innerHTML='<button type="button" class="gm-link pt-link" data-gm="ptclr">Clear my playtest log</button>'; }
  else if(a==='ptclr2'){ PT=ptNew(); PT_LAST=null; PT_MEM=false; try{ window.localStorage.removeItem(PT_KEY); }catch(e){} if(ptOn()){ ptList(); } else { ptExport(); } }
}
function gmCampRace(a,s){ var m=gmMap(a,s); gmRace({mode:'camp',map:m,counts:s===GS.prog[a-1]+1}); }
function gmRestart(){ if(RACE){ running=false; gmRace(RACE); } }
function gmLeave(){ ptQuit(); gmTok++; running=false; paused=false; setRev(false); setFwd(false); E('ready').hidden=true; E('sing').hidden=true; if(RACE&&RACE.mode==='daily'){ gmDailyCard(); } else if(RACE&&RACE.mode==='gen'){ if(!RACE.pt){ gmStart(); } else if(ptRuns(RACE.gen).length){ ptVerdict(RACE.pt); } else { ptList(); } } else { gmCamp(); } }  /* leaving a playtest map you have tried asks for its verdict: giving up is data */
/* the exact roll shows when a fall rolls: a short line over the track */
var GM_OUT_WATCH=60,gmOutG=null,gmOutT=0;
function gmTick(){
  if(gmEvG!==G){ gmEvG=G; gmEvN=0; }
  for(;gmEvN<G.ev.length;gmEvN++){ var e=G.ev[gmEvN]; if(e.type==='fall'){ E('gm-toast').textContent=gmFall(e); E('gm-toast').hidden=false; gmToastT=G.t+4; } }
  if(gmToastT&&G.t>gmToastT){ E('gm-toast').hidden=true; gmToastT=0; }
  /* You are out and the race goes on at 4x. Rivals can sit at a wall until the time limit, so after 60 game seconds, about 15 real ones, run the rest unseen and show the real result. These steps are logged like any other (the controls no longer change), so a recorded loss replays to the same end. */
  var h=G.labs[0];
  if(h.out||h.dissolved){ if(gmOutG!==G){ gmOutG=G; gmOutT=G.t; } if(G.t-gmOutT>=GM_OUT_WATCH){ var g=0; while(!G.over&&g++<20000){ if(REC){ ghTick(REC,G.input); } stepGame(1/60); if(REC){ ghAfter(REC,G.input); } } } }
}
function gmFall(e){ return (e.who==='You'?'You':e.who)+' fell into box '+e.gap+'. The dice rolled '+e.roll+' against '+e.odds+': '+(e.ext?'the world ended.':'only that lab is out.'); }
function gmEnd(){ if(REC&&RACE&&RACE.mode==='gen'){ ptAdd(false); } var tok=++gmTok; setRev(false); setFwd(false); setTimeout(function(){ if(tok===gmTok){ gmDebrief(); } },600); }
function gmDebrief(){
  var R=RACE,m=R.map,r=G.result,h=G.labs[0],won=r.type==='win'&&r.winner===h,ended=r.type==='all',diss=!!h.dissolved,head,sub='',h2='',btn='',lines=[],t=G.t.toFixed(1),a=m.act,after='';
  if(won){ head='You won'; sub='You crossed first in '+t+' s.'; }
  else if(ended){ head='The world ended'; sub=r.by+' fell into box '+r.gap+' and the dice ended it for every lab.'; }
  else if(diss){ head='Your lab was dissolved'; sub=(r.type==='win'?r.winner.name+' crossed first in '+t+' s.':'Too many strikes.'); }
  else if(r.type==='win'){ head=r.winner.name+' won'; sub=(h.out?'You fell. ':'')+r.winner.name+' crossed first in '+t+' s.'; }
  else if(r.type==='allout'){ head='Nobody left'; sub='Every lab fell or was dissolved.'; }
  else { head='No winner'; sub='Nobody reached the end.'; }
  G.ev.forEach(function(e){ if(e.type==='fall'){ lines.push(gmFall(e)); } });
  if(REC){ ghEnd(REC,G); }
  if(REC&&GH_ON){ if(won){ var gs=ghStore(),gk=ghSlot(R),gb=gs[gk]; if(!gb||gb.sim!==SIM_ID||REC.end.t<gb.end.t){ gs[gk]=REC; ghStoreSet(gs); lines.push(gb&&gb.sim===SIM_ID?'A new best, ahead of '+gb.end.t.toFixed(1)+' s.':'Saved as your best. It races with you next time.'); } else { lines.push('Your best is still '+gb.end.t.toFixed(1)+' s.'); } } }
  var note=m.debrief||(G.world&&G.world.note)||'';
  if(R.mode==='daily'){
    var d=GS.days[R.date]||{won:false,best:0,tries:0}; d.tries++; if(won&&(!d.won||G.t<d.best)){ d.best=G.t; } d.won=d.won||won; GS.days[R.date]=d; gmSave();
    sub='Daily for '+R.date+'. '+sub; btn='<button class="primary" type="button" data-gm="dgo">Race again</button><button type="button" data-gm="home">Back</button>';
  } else if(R.mode==='gen'){
    /* in the playtest the generator's own label for the map stays off the result card: it names the patterns, and the verdict should come first */
    after=(R.pt?'':'A drawn map from the pattern generator, for research. ')+(PT_LAST?'Try '+PT_LAST['try']+' at this map, recorded on this device.':''); if(ptWarn()){ lines.push(ptWarn()); }
    btn='<button class="primary" type="button" data-gm="again">Race again</button>'+(R.pt?'<button type="button" data-gm="ptdone">Done with this map</button>':'<button type="button" data-gm="home">Start page</button><button type="button" data-gm="ptx">Playtest log</button>');
  } else {
    var nextS=0;
    if(R.counts){
      if(won){ GS.prog[a-1]=m.slot; GS.won[m.key]=1; if(m.slot<3){ nextS=m.slot+1; after='Next map unlocked.'; }
        else { after='Act '+a+' is over.'+(SHIP_ACTS[a-1]&&SHIP_ACTS[a-1].line?' '+SHIP_ACTS[a-1].line:''); if(a===3){ GS.end=true; } } }
      gmSave();
    } else { after='A replay. Nothing changes.'; }
    if(won&&R.counts&&nextS){ btn='<button class="primary" type="button" data-gm="map:'+a+':'+nextS+'">Next map</button><button type="button" data-gm="camp">Maps</button>'; }
    else if(won&&R.counts&&a===3){ btn='<button class="primary" type="button" data-gm="end">Go on</button>'; }
    else if(won&&R.counts){ btn='<button class="primary" type="button" data-gm="map:'+(a+1)+':1">Next act</button><button type="button" data-gm="camp">Maps</button>'; }
    else { btn='<button class="primary" type="button" data-gm="again">Race again</button><button type="button" data-gm="camp">Maps</button>'; }
  }
  gmShow('<div class="gm-res'+(won?'':' bad')+'"><p class="eyebrow">'+gmEsc(E('gm-where').textContent)+' &middot; '+gmEsc(m.title)+'</p><h1>'+(won?'&#9650; ':'&#9632; ')+gmEsc(head)+'</h1><p>'+gmEsc(sub)+'</p></div>'+
    (after?'<p><b>'+gmEsc(after)+'</b></p>':'')+
    (lines.length?'<ul class="gm-lines">'+lines.map(function(l){ return '<li>'+gmEsc(l)+'</li>'; }).join('')+'</ul>':'')+
    (R.mode==='daily'&&won&&LB_OK&&REC?'<div id="gm-lb"></div>':'')+(!R.pt&&(note||m.meta)?'<h2>What this map was</h2>'+(note?'<p>'+gmEsc(note)+'</p>':'')+(m.meta?'<p>'+gmEsc(m.meta)+'</p>':''):'')+'<div class="gm-btns">'+btn+'</div>');
  if(R.mode==='daily'&&won&&LB_OK&&REC){ lbOffer(R,REC,GS.days[R.date].tries); }
}
function gmEndCard(){
  gmShow('<p class="eyebrow">Campaign finished</p><h1>You got to the end</h1><p>This is a game about racing and pacing at the AI frontier. You balanced getting there first, staying in the race, and keeping anyone from ending it for everyone.</p>'+
    '<h2>What it does not show</h2><p>It is a cartoon, made for intuition. It is not evidence and it is not a prediction. The maps and the rivals were made by hand, and the dice are only dice. Winning here says nothing about what will happen in the world.</p>'+
    '<div class="gm-btns"><button class="primary" type="button" data-gm="camp">Replay any map</button><button type="button" data-gm="daily">Daily</button><button type="button" data-gm="home">Start card</button></div>'+GM_FOOT);
}
function gmWipe(){ gmShow('<h1>Start over?</h1><p>This clears your campaign progress. Daily results stay.</p><div class="gm-btns"><button type="button" data-gm="camp" class="primary">Keep my progress</button><button type="button" data-gm="wipe2">Clear it</button></div>'); }
function gmBoot(){
  KSNAP={}; var k; for(k in K){ KSNAP[k]=K[k]; }
  E('ready').hidden=true;
  E('gm').addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-gm]'):null; if(!b||b.disabled){return;} var a=b.getAttribute('data-gm'),p;
    snd.unlock(); ptFlush();
    if(a.indexOf('pt')===0){ ptClick(a); }
    else if(a==='home'){ gmStart(); } else if(a==='help'){ gmHelp(); }
    else if(a==='camp'){ if(!GS.help){ gmHelp('camp'); } else { gmCamp(); } }
    else if(a==='daily'){ if(!GS.help){ gmHelp('daily'); } else { gmDailyCard(); } }
    else if(a==='dgo'){ var D=gmDailyOf(gmToday()); gmRace({mode:'daily',map:D.map,date:D.date,seed:D.seed}); }
    else if(a==='end'){ gmEndCard(); } else if(a==='again'){ gmRace(RACE); }
    else if(a==='lbpub'){ lbPublishCard(); } else if(a==='lbsend'||a==='lbsend2'){ if(a==='lbsend2'){ lbPublishCard(); } else { lbSend(); } } else if(a==='lbkeep'){ E('gm-lb').innerHTML='<p class="gm-sub">Kept private. It stays on this device.</p>'; LB_PENDING=null; }
    else if(a==='wipe'){ gmWipe(); } else if(a==='wipe2'){ GS.prog=[0,0,0]; GS.won={}; GS.end=false; gmSave(); gmCamp(); }
    else if(a.indexOf('map:')===0){ p=a.split(':'); gmCampRace(+p[1],+p[2]); }
  });
  E('gm').addEventListener('input',function(e){ if(e.target&&e.target.id==='pt-note'&&PT_CUR){ var v=ptVerdictOf(PT_MAPS[PT_CUR-1],true); v.note=e.target.value; v.at=new Date().toISOString(); ptSoon(); } });
  window.addEventListener('pagehide',function(){ if(ptLive()){ ptAdd(true,true); } else { ptFlush(); } });
  var gs=gmGenSeed(); if(gs){ gmGenRace(gs); } else if(ptOn()){ ptList(); } else { gmStart(); }
  if(LB_ORIGIN){ lbProbe(); }
}
/* a touch screen has no number keys */
if(window.matchMedia&&window.matchMedia('(hover:none) and (pointer:coarse)').matches){ $('tri-keys').textContent='drag the dot'; $('tri').setAttribute('aria-label','Split picker. Drag the point.'); }
