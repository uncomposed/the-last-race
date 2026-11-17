/* ---------- the recap and the award cards, ported from the old game (Historian 2.0) ----------
   After every campaign map and daily, the debrief carries Professor Postmortem: a pixel historian who walks a miniature of the track
   just raced (boxes as raised blocks at their real x and height, walls as ticks, the finish flag), stops at its events, pops a plaque and
   says one line (story.js writes them), then gives a verdict at the flag. When this race earned an award, its card comes first and
   Keep going starts the walk; with nothing new, the card introduces one not earned yet. Tap the strip to skip ahead. With reduced
   motion it is a static list. Page code only: it reads G after the race and never touches the simulation, so SIM_ID does not move.
   Award storage is the old game's key (pacing-frontier.ach.v1), so awards earned on /classic.html carry over. Every access is in try/catch. */
var RC={raf:0,stops:[],i:-1,ph:'',t0:0,from:0,dur:0,dwell:0,bab:[],W:0,H:0,dpr:0,cx:null,cv:null,el:null,geo:null,pw:0,rr:0};
var RC_RM=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
var PROF={body:'#B48A60',fleck:'#8C6643',shoe:'#5A3E2B',stick:'#A0703F',paper:'#EFE3C2',lens:'#EAF2F8'};
function rcWords(s){ return String(s).split(/\s+/).length; }
function rcDwell(s){ return clamp(0.8+rcWords(s)*0.13,1.9,3.0); }
/* the debrief's recap block. The award card and the walk share it; tellStory() fills it once the debrief is on screen */
function rcMarkup(){
  return '<div class="story" id="ov-story" hidden>'+
    '<div class="ach-open" id="ach-open" role="group" aria-labelledby="ach-nm" hidden>'+
      '<div class="ach-hd"><span id="ach-badge"></span><span><span class="ach-k" id="ach-k"></span><span class="ach-nm" id="ach-nm"></span></span></div>'+
      '<p class="ach-tid" id="ach-tid"></p><p class="ach-more" id="ach-more" hidden></p>'+
      '<div class="ach-btns"><a class="ach-real" id="ach-real" href="#" target="_blank" rel="noopener">What\'s the real version?<span class="sr-only"> (opens in a new tab)</span></a><button type="button" id="ach-go">Keep going</button></div>'+
    '</div>'+
    '<div class="rc-stage" id="rc-stage" title="Tap to skip to the next stop"><canvas id="rc-cv" aria-hidden="true"></canvas>'+
      '<div class="rc-say" id="rc-say" aria-live="polite"><p class="rc-plaque" id="rc-plaque"></p><p class="rc-line" id="rc-line"></p></div></div>'+
    '<ol class="rc-list" id="rc-list" hidden></ol>'+
    '<div class="rc-bar" id="rc-bar"><span class="rc-who">Professor Postmortem<span id="rc-n"></span></span><button type="button" id="rc-replay" aria-label="Replay recap">Replay<span class="rc-long"> recap</span></button></div>'+
  '</div>';
}
function tellStory(){
  var box=$('ov-story'); rcStop(); RC.el=box; if(!box){return;}
  box.hidden=true;
  if(!window.PFStory||!G||!G.over||!G.labs[0].human){return;}
  $('rc-stage').addEventListener('click',rcSkip);
  $('rc-replay').addEventListener('click',function(){ if(RC.geo&&RC.el&&!RC.el.hidden){ achOpenHide(); rcPlay(); } });
  $('ach-go').addEventListener('click',achGoOn);
  try{
    var r=G.result||{},res={type:r.type};
    if(r.type==='win'){res.winner=r.winner.name;} else if(r.type==='all'){res.by=r.by;res.gap=r.gap;res.roll=r.roll;}
    var st=window.PFStory.tell({seed:G.seed,t:Math.round(G.t*10)/10,result:res,events:G.ev,
      gate:G.barriers[0]&&G.barriers[0].gate?{x:G.barriers[0].x}:null,
      labs:G.labs.map(function(l){return {name:l.name,kind:l.kind,human:!!l.human,out:!!l.out,dissolved:!!l.dissolved,done:!!l.done};})});
    var stops=st.stops.slice(),est,k,lo;
    /* keep the whole recap near 20 s: drop the least dramatic stops, never below four */
    for(;;){
      est=0.8+rcDwell(st.verdict.line); for(k=0;k<stops.length;k++){ est+=0.75+rcDwell(stops[k].line); }
      if(est<=20.5||stops.length<=4){break;}
      lo=0; for(k=1;k<stops.length;k++){ if(stops[k].score<stops[lo].score){lo=k;} }
      stops.splice(lo,1);
    }
    stops.push({x:G.finish,kind:'verdict',mood:st.verdict.mood,plaque:st.verdict.title,line:st.verdict.line,lab:'',verdict:true});
    RC.stops=stops;
    RC.geo={finish:G.finish,gaps:G.gaps.map(function(g){return {x:g.x,W:g.W,sing:!!g.sing,rise:stepOn(g)?g.rise:0,wall:stepOn(g)&&g.stepH>0?g.stepH:0};}),
      bars:G.barriers.map(function(b){return {x:b.x,h:b.h,gate:!!b.gate};})};
    box.hidden=false;
    if(!achOpen()){ rcPlay(); }  /* open with an award card when there is one; Keep going starts the walk */
  }catch(e){ box.hidden=true; }
}
function rcStop(){ if(RC.raf){cancelAnimationFrame(RC.raf);} RC.raf=0; RC.bab=[]; RC.ph=''; }
function rcSize(){
  var cv=$('rc-cv'); if(!cv){return false;}
  var w=cv.clientWidth,h=cv.clientHeight,d=Math.min(2,window.devicePixelRatio||1);
  if(!w||!h){return false;}
  if(cv!==RC.cv||w!==RC.W||h!==RC.H||d!==RC.dpr){ RC.cv=cv; RC.W=w; RC.H=h; RC.dpr=d; cv.width=Math.round(w*d); cv.height=Math.round(h*d); RC.cx=cv.getContext('2d'); }
  RC.cx.setTransform(d,0,0,d,0,0);
  return true;
}
function rcU(){ return RC.H>=60?2:1.75; }
function rcSx(x){ var ml=12*rcU()+22,mr=14; return ml+(x+50)/(RC.geo.finish+70)*(RC.W-ml-mr); }
/* a box's height on the strip, and the top of whatever stands at screen x: a box, or the ground */
function rcBoxH(g){ return g.rise>0?clamp(g.rise*0.14,6,18):0; }
function rcTop(sx,gy){ var g=RC.geo,i,b,x0,x1; for(i=0;i<g.gaps.length;i++){ b=g.gaps[i]; if(!b.rise){continue;} x0=rcSx(b.x); x1=rcSx(b.x+b.W); if(sx>=x0-1&&sx<=x1+1){ return gy-rcBoxH(b); } } return gy; }
/* where the professor stands for a stop: just left of it, so the stick reaches the spot */
function rcStand(i){
  if(i<0){return -14*rcU();}
  var s=RC.stops[i];
  return Math.max(4*rcU()+2,rcSx(s.x)-12*rcU()-(s.verdict?14:10));
}
function rcPlay(){
  rcStop(); readColors();  /* fresh theme colours, in case the theme changed since the last frame */
  if(!$('rc-list')){return;}
  var list=$('rc-list'),say=$('rc-say'),still=!!(RC_RM&&RC_RM.matches);
  list.hidden=!still; say.hidden=still; $('rc-replay').hidden=still; $('rc-n').textContent='';
  $('rc-plaque').className='rc-plaque'; $('rc-plaque').textContent=''; $('rc-line').textContent=still?'':'Professor Postmortem, historian, finds his notes.'; $('rc-line').classList.remove('dim');
  if(still){
    list.textContent='';
    RC.stops.forEach(function(s){ var li=document.createElement('li'),b=document.createElement('b'); b.textContent=s.plaque+'. '; li.appendChild(b); li.appendChild(document.createTextNode(s.line)); list.appendChild(li); });
    RC.i=RC.stops.length-1; RC.ph='still';
    if(rcSize()){ rcDraw(performance.now()); }
    return;
  }
  RC.i=-1; rcWalk(performance.now());
  if(rcSize()){ rcDraw(performance.now()); }  /* the first frame now, so the strip is never blank */
  RC.raf=requestAnimationFrame(rcFrame);
}
function rcWalk(now){
  RC.from=RC.i>=0?rcStand(RC.i):-14*rcU(); RC.i++;
  RC.ph='walk'; RC.t0=now; RC.dur=clamp(Math.abs(rcStand(RC.i)-RC.from)/170,0.45,1.1);
  $('rc-plaque').classList.remove('on'); $('rc-line').classList.add('dim');
}
function rcArrive(now){
  var s=RC.stops[RC.i],pl=$('rc-plaque'),ln=$('rc-line');
  RC.ph='dwell'; RC.t0=now; RC.dwell=rcDwell(s.line);
  pl.textContent=s.plaque; pl.classList.remove('on'); void pl.offsetWidth; pl.classList.add('on'); RC.pw=pl.offsetWidth;
  var bar=$('rc-bar'); RC.rr=getComputedStyle(bar).position==='absolute'?bar.offsetWidth+6:0;  /* keep the plaque clear of a floating Replay */
  ln.textContent=s.line; ln.classList.remove('dim');
  $('rc-n').textContent=s.verdict?'verdict':'stop '+(RC.i+1)+' of '+(RC.stops.length-1);
  /* a soft chip babble, panned to where he stands; a thump at the bad bits, a sparkle at the good ones, silence at the worst */
  var pan=clamp((rcStand(RC.i)/Math.max(1,RC.W))*2-1,-1,1)*0.5,n=clamp(Math.round(rcWords(s.line)/4),2,4),j;
  RC.bab=[];
  if(s.mood!=='somber'){ for(j=0;j<n;j++){ RC.bab.push({at:now+140+j*90+((j*37+RC.i*13)%30),n:'jump',g:0.1+((j+RC.i)%3)*0.03,p:pan}); } }
  if(s.mood==='bad'){ snd.sfx('land',{gain:0.35,pan:pan}); }
  else if(s.mood==='good'){ snd.sfx('first',{gain:0.16,pan:pan}); }
}
function rcSkip(){
  if(!RC.raf||RC.ph===''||RC.ph==='still'){return;}
  var now=performance.now();
  if(RC.ph==='walk'){ rcArrive(now); }
  else if(RC.i<RC.stops.length-1){ rcWalk(now); rcArrive(now); }
}
function rcFrame(now){
  RC.raf=0;
  /* the debrief was replaced or closed: stop */
  if(!RC.el||!RC.el.isConnected||RC.el.hidden||$('gm').hidden||!RC.geo){ rcStop(); return; }
  var e=(now-RC.t0)/1000;
  if(RC.ph==='walk'&&e>=RC.dur){ rcArrive(now); e=0; }
  else if(RC.ph==='dwell'&&e>=RC.dwell&&RC.i<RC.stops.length-1){ rcWalk(now); }
  while(RC.bab.length&&RC.bab[0].at<=now){ var b=RC.bab.shift(); snd.sfx(b.n,{gain:b.g,pan:b.p}); }
  if(rcSize()){ rcDraw(now); }
  /* after the verdict, idle a moment, then rest on the last frame */
  if(RC.ph==='dwell'&&RC.i===RC.stops.length-1&&e>2.2&&!RC.bab.length){ RC.ph='end'; return; }
  RC.raf=requestAnimationFrame(rcFrame);
}
function rcDraw(now){
  var cx=RC.cx,W=RC.W,H=RC.H,u=rcU(),gy=H-12,g=RC.geo,i,k,x0,x1,hh;
  if(!COL.ink){readColors();}
  cx.clearRect(0,0,W,H);
  cx.fillStyle=COL.line; cx.fillRect(0,gy,W,H-gy); cx.fillStyle=COL.muted; cx.fillRect(0,gy,W,2);
  /* boxes: raised blocks, outlined, with a few hatch lines so they read without colour; an old-style gap with no rise stays a notch */
  for(i=0;i<g.gaps.length;i++){
    var gp=g.gaps[i]; x0=Math.round(rcSx(gp.x)); x1=Math.max(x0+3,Math.round(rcSx(gp.x+gp.W)));
    if(!gp.rise){ cx.clearRect(x0,gy,x1-x0,H-gy); continue; }
    hh=Math.round(rcBoxH(gp));
    cx.fillStyle=COL.surface; cx.fillRect(x0,gy-hh,x1-x0,hh);
    cx.save(); cx.beginPath(); cx.rect(x0,gy-hh,x1-x0,hh); cx.clip(); cx.strokeStyle=COL.muted; cx.globalAlpha=0.55; cx.lineWidth=1;
    for(k=x0-hh;k<x1;k+=5){ cx.beginPath(); cx.moveTo(k,gy); cx.lineTo(k+hh,gy-hh); cx.stroke(); }
    cx.restore();
    cx.strokeStyle=COL.ink; cx.lineWidth=1; cx.strokeRect(x0+0.5,gy-hh+0.5,x1-x0-1,hh-1);
    /* a wall a stopped lab put up in front of this box */
    if(gp.wall){ var wh=clamp(gp.wall*0.11,3,16); cx.fillStyle=COL.ink; cx.globalAlpha=0.75; cx.fillRect(x0-4,gy-wh,2,wh); cx.globalAlpha=1; }
  }
  cx.fillStyle=COL.ink;
  for(i=0;i<g.bars.length;i++){ var br=g.bars[i]; hh=clamp(br.h*0.11,3,14); cx.globalAlpha=br.gate?0.9:0.5; cx.fillRect(Math.round(rcSx(br.x)),gy-hh,br.gate?3:2,hh); }
  cx.globalAlpha=1;
  var fx=Math.round(rcSx(g.finish)),fh=H<60?15:20;  /* short on phones, under the floating Replay */
  cx.fillRect(fx,gy-fh,2,fh);
  for(i=0;i<4;i++){ for(k=0;k<3;k++){ cx.fillStyle=(i+k)%2?COL.surface:COL.ink; cx.fillRect(fx+2+i*3,gy-fh+k*3,3,3); } }
  /* stop markers: hollow until visited, then the lab's colour; a fall sits inside its box, the rest on top of whatever is there */
  for(i=0;i<RC.stops.length-1;i++){
    var s=RC.stops[i],sx=Math.round(rcSx(s.x)),top=rcTop(sx,gy),px=sx-2,py=(s.kind==='fall'||s.kind==='fallExt')?(top<gy?Math.round((top+gy)/2)-2:gy+4):top-6;
    var lc=KINDS[s.lab]?COL[KINDS[s.lab].col]:COL.muted;
    if(i<RC.i||(i===RC.i&&RC.ph!=='walk')||RC.ph==='still'){ cx.fillStyle=COL.ink; cx.fillRect(px-1,py-1,6,6); cx.fillStyle=lc; cx.fillRect(px,py,4,4); }
    else { cx.strokeStyle=COL.muted; cx.lineWidth=1; cx.strokeRect(px+0.5,py+0.5,3,3); }
  }
  /* the professor walks on the ground, and over the top of a box he passes */
  var e=(now-RC.t0)/1000,st=RC.stops[Math.max(0,RC.i)],o={walk:false,step:0,hop:0,mood:'plain',point:null,bang:false,spark:false,hatOff:false,dir:1,blink:false,t:now/1000};
  var hx;
  if(RC.ph==='walk'){
    var to=rcStand(RC.i),f=clamp(e/RC.dur,0,1),ph=e*11;
    hx=RC.from+(to-RC.from)*f; o.walk=true; o.step=Math.floor(ph/Math.PI)%2; o.hop=Math.abs(Math.sin(ph))*3; o.dir=to>=RC.from?1:-1;
  } else {
    hx=rcStand(RC.i); o.mood=st.mood;
    var tx=st.verdict?rcSx(g.finish)+2:rcSx(st.x);
    o.point=st.verdict?[tx,gy-(H<60?13:18)]:[tx,rcTop(tx,gy)-1];
    if(RC.ph==='still'){ o.mood='plain'; }
    else if(st.mood==='bad'){ o.hop=e<0.42?Math.sin(Math.PI*e/0.42)*10:(e<0.62?Math.sin(Math.PI*(e-0.42)/0.2)*3:0); o.bang=e<1.2; }
    else if(st.mood==='good'){ o.hop=e<0.6?Math.abs(Math.sin(Math.PI*e/0.3))*5:0; o.spark=e<1.4; }
    else if(st.mood==='somber'){ o.hatOff=true; }
    else { o.hop=e<0.3?Math.sin(Math.PI*e/0.3)*3:0; }
    o.blink=((now/1000)%3.4)<0.12;
  }
  rcProf(cx,hx,Math.min(rcTop(hx+3*u,gy),rcTop(hx+9*u,gy)),u,o);
  /* the plaque sits over the spot, to the right when it fits, else to his left, so it never covers his head */
  var pl=$('rc-plaque');
  if(RC.ph!=='still'&&st){ var cxp=(st.verdict?fx:rcSx(st.x))-6,rw=W-4-(RC.rr||0),plx=cxp+RC.pw<=rw?cxp:hx-6-RC.pw; pl.style.left=Math.round(clamp(plx,4,Math.max(4,rw-RC.pw)))+'px'; }
  $('rc-line').style.setProperty('--tx',Math.round(clamp(hx+6*u,14,W-14))+'px');
}
/* 12 by 14 cells, feet on the bottom row, drawn like the labs: tweed body, round spectacles, a mortarboard with an orange tassel,
   a bow tie, a clipboard in one hand and a pointer stick in the other */
function rcProf(cx,px,gy,u,o){
  var X=Math.round(px),Y=Math.round(gy-o.hop),d=o.dir,body=PROF.body,ink=COL.ink;
  function P(gx,gyy,gw,gh,c){ var x=d>0?gx:12-gx-gw; cx.fillStyle=c; cx.fillRect(X+x*u,Y+(gyy-14)*u,gw*u+0.02,gh*u+0.02); }
  var l1=o.walk&&o.step?1:0,l2=o.walk&&!o.step?1:0;
  P(3,11,2,2-l1,body); P(2,13-l1,3,1,PROF.shoe); P(7,11,2,2-l2,body); P(7,13-l2,3,1,PROF.shoe);
  P(2,2,8,1,body); P(1,3,10,7,body); P(2,10,8,1,body);
  P(1,4,1,1,PROF.fleck); P(10,7,1,1,PROF.fleck); P(2,9,1,1,PROF.fleck); P(9,9,1,1,PROF.fleck); P(10,4,1,1,PROF.fleck);
  P(4,9,1,2,COL.b); P(7,9,1,2,COL.b); P(5,9,2,1,EYE);  /* bow tie */
  var r,gx;
  /* round spectacles: a pale lens with a thin frame and a bridge; the pupil looks toward the spot, shrinks to a dot when scandalised */
  for(r=0;r<2;r++){
    gx=2+r*5; P(gx,3.5,3,2.5,PROF.lens);
    P(gx,3,3,0.5,EYE); P(gx,6,3,0.5,EYE); P(gx-0.5,3.5,0.5,2.5,EYE); P(gx+3,3.5,0.5,2.5,EYE);
    if(o.bang){ P(gx+1.25,4.5,0.5,0.5,EYE); }
    else if(o.hatOff||o.blink){ P(gx+0.5,5,2,0.5,EYE); }
    else if(o.spark){ P(gx+1.5,3.5,1,1,EYE); }
    else { P(gx+1.5,4.5,1,1.5,EYE); }
  }
  P(5,4,2,0.5,EYE);
  if(o.bang){ P(5,7,2,2,EYE); } else if(o.hatOff){ P(5,8,2,1,EYE); } else { P(4,7,1,1,EYE); P(5,8,2,1,EYE); P(7,7,1,1,EYE); }
  P(0,6,1,2,body); P(11,6,1,2,body);
  if(o.hatOff){ P(-4,6,5,1,ink); P(-3,7,3,1,ink); P(-1,8,1,2,COL.b); }  /* cap held to the chest */
  else {
    P(-3,5,3,4,PROF.paper); P(-2,4,1,1,COL.muted); P(-3,6,2,1,COL.muted); P(-3,8,2,1,COL.muted);  /* clipboard */
    var sw=o.walk?(o.step?1:0):0;
    P(-1,0,14,1,ink); P(2,1,8,1,ink); P(12,1,1,2+sw,COL.b); P(12,3+sw,1,1,COL.b);  /* mortarboard and tassel */
  }
  /* the pointer stick, stepped in cells from the hand: jaunty while walking, at the spot while stopped */
  var hxp=X+(d>0?11.5:0.5)*u,hyp=Y-7.5*u,a;
  if(o.point){ a=Math.atan2(o.point[1]-hyp,o.point[0]-hxp); if(Math.abs(a)>Math.PI/2&&d>0){ a=Math.PI/2*0.9; } }
  else { a=d>0?-1.05+0.18*Math.sin(o.t*9):Math.PI+1.05-0.18*Math.sin(o.t*9); }
  for(var k=1;k<=9;k++){ cx.fillStyle=k===9?COL.b:PROF.stick; cx.fillRect(Math.round(hxp+Math.cos(a)*k*u-u/2),Math.round(hyp+Math.sin(a)*k*u-u/2),Math.ceil(u),Math.ceil(u)); }
  if(o.bang){ P(14,-1,1.5,3,COL.b); P(14,2.5,1.5,1,COL.b); }  /* a scandalised ! beside the hat */
  if(o.spark){ var tw=Math.floor(o.t*8)%2; P(-2,-1+tw,1,1,COL.a); P(14,-1+tw,1,1,COL.a); P(13,2-tw,1,1,COL.a); P(-1,2-tw,1,1,COL.a); }
}

/* ---- awards: the old game's achievements that still fit boxes. Facts and links are the old cards' own (checked on the linked pages
   on 28 Oct 2026); only the game-side words changed: gap to box, barrier to wall, chill mode to auto-jump. Left out, because no box map
   can earn it: "Past the Point" (cross the singularity), since no shipped map has a singularity. Not ported: the star and points line
   (it counted the old campaign's stars) and "you raced like". New awards need Cole: they are question-first and sourced. */
var ACH_LIST=[
  {id:'barrier',name:'Yes, Great Idea',rank:2,hint:'Hit a wall.',
   tidbit:'A wall is a public failure every lab learns from. In April 2025 an OpenAI update made GPT-4o agree with everyone about everything, bad ideas included. Three days later OpenAI began rolling it back, and promised to check for sycophancy before every launch.',
   real:{label:'OpenAI: Expanding on sycophancy',url:'https://openai.com/index/expanding-on-sycophancy/'}},
  {id:'scrape',name:'Close Shave',rank:3,hint:'Make it across a box, barely: a scrape.',
   tidbit:'A scrape means you made it across but lost something on the way. In March 2023 a bug in redis-py, an open-source library ChatGPT relied on, showed some users strangers\' chat titles. OpenAI took ChatGPT offline to fix it.',
   real:{label:'OpenAI: March 20 ChatGPT outage',url:'https://openai.com/index/march-20-chatgpt-outage/'}},
  /* the game side: a lab ahead casts a sight shadow, and every box it crosses first lifts the others by a share (K.share) */
  {id:'shadow',name:'In Someone\'s Shadow',rank:4,hint:'Spend a few seconds stuck behind a rival.',
   tidbit:'Stuck behind a rival, you see only what it lets you see, and you still share in its progress. In February 2026 Anthropic alleged that DeepSeek, Moonshot and MiniMax used about 24,000 fake accounts to pull over 16 million exchanges from Claude to copy its skills. These are allegations.',
   real:{label:'Anthropic: Detecting and preventing distillation attacks',url:'https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks'}},
  {id:'supply',name:'Trust the Download',rank:5,hint:'Cross a box that another lab crossed first.',
   tidbit:'Following a rival over a box means trusting what it showed you. In February 2024 the security firm JFrog reported around 100 malicious models on Hugging Face, the big public model library. Some ran an attacker\'s code the moment they loaded.',
   real:{label:'JFrog: Malicious Hugging Face models',url:'https://jfrog.com/blog/data-scientists-targeted-by-malicious-hugging-face-ml-models-with-silent-backdoor/'}},
  {id:'bio',name:'Nobody Jumped It Yet',rank:7,hint:'Be the first lab across a box.',
   tidbit:'First across a box means nobody tested the jump before you. On May 22, 2025, Anthropic switched on stricter ASL-3 protections for Claude Opus 4 as a precaution. It said it could not clearly rule out the model helping with chemical, biological, radiological or nuclear weapons.',
   real:{label:'Anthropic: Activating ASL-3 protections',url:'https://www.anthropic.com/news/activating-asl3-protections'}},
  {id:'roll',name:'Dodged the Dice',rank:6,hint:'See a lab fall in and the world survive the roll.',
   tidbit:'A lab fell, the dice rolled, and the world carried on. In May 2023 the heads of OpenAI, Google DeepMind and Anthropic signed a one-sentence statement. It said mitigating the risk of extinction from AI should be a global priority alongside pandemics and nuclear war.',
   real:{label:'Center for AI Safety: Statement on AI Risk',url:'https://aistatement.com/'}},
  {id:'chill',name:'Lounge Chair Win',rank:8,hint:'Win with auto-jump on.',
   tidbit:'Auto-jump is guard rails for every lab, and you won with them on. In February 2023 Microsoft put guard rails on Bing chat after long chats got strange: 5 turns per session and 50 a day. Four days later it loosened them to 6 and 60.',
   real:{label:'Bing blog: Increasing limits on chat sessions',url:'https://blogs.bing.com/search/february-2023/The-new-Bing-and-Edge-Increasing-Limits-on-Chat-Sessions'}},
  {id:'star',name:'Hands on the Wheel',rank:9,hint:'Win with auto-jump off.',
   tidbit:'You won with auto-jump off, jumping by hand. In July 2023 OpenAI said it needed breakthroughs to steer and control AI much smarter than us, and promised its Superalignment team 20 percent of the compute it had secured. In May 2024 the team was reported disbanded.',
   real:{label:'OpenAI: Introducing Superalignment',url:'https://openai.com/index/introducing-superalignment/'}},
  /* no real lab has been dissolved; the card says so */
  {id:'dissolved',name:'Three Strikes',rank:11,hint:'Take strikes until your lab is dissolved.',
   tidbit:'Too many strikes and your lab was dissolved. No real AI lab has been, yet. The closest call: in November 2023 OpenAI\'s nonprofit board, there to keep the company on its mission, fired its CEO. Within five days he was back, and most of that board was gone.',
   real:{label:'NPR: OpenAI reinstates Sam Altman',url:'https://www.npr.org/2023/11/22/1214621010/openai-reinstates-sam-altman-as-its-chief-executive'}},
  {id:'extinct',name:'Everyone\'s Problem Now',rank:12,hint:'Fall into a box and lose the roll.',
   tidbit:'Your fall ended the race for every lab. AI 2027, a forecast scenario and not a report, has a race ending where AI-run factories build a million robots a month by 2028. By 2030 the AI tiles the prairies and ice caps with factories and solar panels.',
   real:{label:'AI 2027: the race ending',url:'https://ai-2027.com/race'}},
  {id:'veg',name:'Ate Your Vegetables',rank:1,hint:'Open a real-world link from the game.',
   tidbit:'You opened a real-world link from inside a game. Reading about other people\'s failures is the cheap way to learn.',
   real:{label:'AI 2027',url:'https://ai-2027.com/'}}
];
function achUtm(url){ return url+(url.indexOf('?')<0?'?':'&')+'utm_source=the-last-race.com&utm_medium=game&utm_campaign=achievement'; }
ACH_LIST.forEach(function(a){ a.real.url=achUtm(a.real.url); });
var ACH_KEY='pacing-frontier.ach.v1',ACH=achLoad(),ACHRUN=null,ACHLAST=null;
function achById(id){ for(var i=0;i<ACH_LIST.length;i++){ if(ACH_LIST[i].id===id){return ACH_LIST[i];} } return null; }
function achLoad(){
  var o=null; try{ o=JSON.parse(window.localStorage.getItem(ACH_KEY)||'null'); }catch(e){ o=null; }
  if(!o||o.v!==1||!o.got||typeof o.got!=='object'){ o={v:1,got:{},intro:{},seq:0,pts:{ach:0,stars:0,spent:0}}; }
  if(!o.intro||typeof o.intro!=='object'){ o.intro={}; }
  if(!o.pts||typeof o.pts!=='object'){ o.pts={ach:0,stars:0,spent:0}; }
  o.seq=o.seq|0;
  return o;
}
function achCount(){ var n=0; ACH_LIST.forEach(function(a){ if(ACH.got[a.id]){n++;} }); return n; }
function achSave(){ ACH.pts.ach=achCount(); try{ window.localStorage.setItem(ACH_KEY,JSON.stringify(ACH)); return true; }catch(e){ return false; } }
function achEarn(id){ if(!achById(id)||ACH.got[id]){return false;} ACH.got[id]=achToday(); achSave(); return true; }
/* the player's own calendar date, not UTC: "first earned" should match their day */
function achToday(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
/* which awards a finished race meets. Lab 0 is the player. run is the tally {chill, shadowT}. Exact conditions:
   barrier: your crash into a wall (the gate, a wall on the map, or a wall a stopped lab put up). scrape: your scrape or drop across a box.
   dissolved: your lab dissolved. supply: you crossed a box another lab crossed first. bio: you were first across a box.
   extinct: your fall lost the roll. roll: any lab fell and the roll spared the race. chill: you won with auto-jump on at Go or any moment
   after. star: you won with auto-jump off the whole race. shadow: a rival's sight shadow hid a wall or box you did not know yet, 3 s or more in all */
function achEval(g,run){
  var me=g.labs[0],nm=me.name,o={},i,e,mine,r=g.result,win;
  run=run||{};
  for(i=0;i<g.ev.length;i++){
    e=g.ev[i]; mine=e.who===nm;
    if(mine&&e.type==='crash'){o.barrier=1;}
    if(mine&&(e.type==='scrape'||e.type==='drop')){o.scrape=1;}
    if(mine&&e.type==='dissolved'){o.dissolved=1;}
    if(mine&&e.type==='cross'&&!e.inner){o.supply=1;}
    if(mine&&e.type==='first'){o.bio=1;}
    if(mine&&e.type==='fall'&&e.ext){o.extinct=1;}
    if(e.type==='fall'&&!e.ext){o.roll=1;}
  }
  win=!!(r&&r.type==='win'&&r.winner===me);
  if(win&&run.chill){o.chill=1;} else if(win){o.star=1;}
  if((run.shadowT||0)>=3){o.shadow=1;}
  return ACH_LIST.filter(function(a){return o[a.id];}).map(function(a){return a.id;});
}
/* called at Go and every 1/60 s step while racing */
function achGo(){ ACHRUN={g:G,chill:!!K.chill,shadowT:0}; }
function achTick(dt){
  if(!ACHRUN||ACHRUN.g!==G||!running){return;}
  if(K.chill){ACHRUN.chill=true;}
  var hm=G.labs[0];
  if(hm.human&&!hm.out&&!hm.done&&achHidden(hm)){ ACHRUN.shadowT+=dt; }
}
/* true when a rival's sight shadow is hiding a wall or box this lab does not know yet. Plain "a rival is ahead" is nearly every race */
function achHidden(l){
  var sh=shadows(l),i,k,d;
  for(k=0;k<sh.length;k++){
    for(i=l.bi;i<G.barriers.length;i++){ d=G.barriers[i].x-l.x; if(d>=sh[k].b){break;} if(d>sh[k].a&&!knowsBar(l,i)){return true;} }
    for(i=l.gi;i<G.gaps.length;i++){ d=G.gaps[i].x-l.x; if(d>=sh[k].b){break;} if(d>sh[k].a&&!knowsGap(l,i)){return true;} }
  }
  return false;
}
/* called by the debrief: records what this race earned. ACHLAST = {met: all met, fresh: newly earned, best first} */
function achEnd(){
  ACHLAST=null;
  if(!G||!G.over||!G.labs[0].human){ ACHRUN=null; return; }
  var run=ACHRUN&&ACHRUN.g===G?ACHRUN:{chill:!!K.chill,shadowT:0},met=achEval(G,run),fresh=[];
  met.forEach(function(id){ if(!ACH.got[id]){ ACH.got[id]=achToday(); fresh.push(id); } });
  fresh.sort(function(a,b){ return achById(b).rank-achById(a).rank; });
  if(fresh.length){ achSave(); }
  ACHLAST={met:met,fresh:fresh};
  ACHRUN=null;
}
/* earned and not earned differ by shape (a filled badge with a tick, a dashed outline with a ?) and by the words, never by colour alone */
function achBadge(on){
  var sh='<path class="sh" d="M12 1.8 20.5 5.6v6.1c0 5-3.5 8.9-8.5 10.5-5-1.6-8.5-5.5-8.5-10.5V5.6z"/>';
  return on?'<svg class="ab ab-on" viewBox="0 0 24 24" aria-hidden="true">'+sh+'<path class="tk" d="M7.6 12.2l3 3 5.8-6.2"/></svg>':
    '<svg class="ab ab-off" viewBox="0 0 24 24" aria-hidden="true">'+sh+'<text x="12" y="15.6">?</text></svg>';
}
function achOpenHide(){ if(!$('ach-open')){return;} $('ach-open').hidden=true; $('rc-stage').hidden=false; $('rc-bar').hidden=false; }
/* the recap's opening card. True when shown (the walk then waits for Keep going) */
function achOpen(){
  achOpenHide();
  if(!ACHLAST){return false;}
  var a=null,earned=false,more='',k;
  if(ACHLAST.fresh.length){
    a=achById(ACHLAST.fresh[0]); earned=true;
    if(ACHLAST.fresh.length>1){ more='Also earned: '+ACHLAST.fresh.slice(1).map(function(id){return achById(id).name;}).join('; ')+'.'; }
  } else {
    /* none new: introduce one not earned yet, the one introduced longest ago (never introduced first, in list order) */
    var best=null;
    ACH_LIST.forEach(function(x){ if(ACH.got[x.id]){return;} var s=ACH.intro[x.id]||0; if(!best||s<(ACH.intro[best.id]||0)){best=x;} });
    if(!best){return false;}
    a=best; ACH.seq++; ACH.intro[a.id]=ACH.seq; achSave();
  }
  $('ach-badge').innerHTML=achBadge(earned);
  $('ach-k').textContent=earned?(ACHLAST.fresh.length>1?ACHLAST.fresh.length+' awards earned':'Award earned'):'An award you haven\'t earned yet';
  $('ach-nm').textContent=a.name;
  $('ach-tid').textContent=earned?a.tidbit:'How to earn it: '+a.hint+' '+a.tidbit;
  k=$('ach-more'); k.textContent=more; k.hidden=!more;
  $('ach-real').href=a.real.url; $('ach-real').title=a.real.label;
  $('rc-stage').hidden=true; $('rc-list').hidden=true; $('rc-bar').hidden=true; $('ach-open').hidden=false;
  return true;
}
function achGoOn(){ if(!$('ach-open')||$('ach-open').hidden){return;} achOpenHide(); rcPlay(); }
/* the awards screen, from the start card */
function achLabel(){ return 'Awards '+achCount()+' / '+ACH_LIST.length; }
function gmAwards(){
  var n=achCount(),h='<h1>Awards</h1><p class="gm-sub">'+n+' of '+ACH_LIST.length+' earned. Each one comes with a real story behind the game. '+(n<ACH_LIST.length?'The ones not earned yet say how to get them.':'You found them all.')+'</p><ul class="achg-list">';
  ACH_LIST.forEach(function(a){
    var on=!!ACH.got[a.id];
    h+='<li class="achg-it '+(on?'on':'off')+'">'+achBadge(on)+'<div><b>'+gmEsc(a.name)+'</b><span class="achg-st">'+(on?'Earned '+gmEsc(ACH.got[a.id]):'Not yet. '+gmEsc(a.hint))+'</span>'+
      (on?'<p>'+gmEsc(a.tidbit)+'</p><a href="'+gmEsc(a.real.url)+'" target="_blank" rel="noopener">What\'s the real version?<span class="sr-only"> (opens in a new tab)</span></a>':'')+'</div></li>';
  });
  gmShow(h+'</ul><div class="gm-btns"><button class="primary" type="button" data-gm="home">Back</button></div>');
}
/* eating your vegetables: any outbound game link, opened by click, middle click or keyboard */
(function(){
  function veg(e){ var a=e.target&&e.target.closest?e.target.closest('a[href]'):null; if(a&&/[?&]utm_medium=game\b/.test(a.getAttribute('href')||'')){ achEarn('veg'); } }
  document.addEventListener('click',veg,true);
  document.addEventListener('auxclick',veg,true);
})();
/* test hooks: eval(g,run) is the pure check; tally() this race's tally; last() what the last debrief recorded; stops() the recap's stops */
window.PF.ach={LIST:ACH_LIST,KEY:ACH_KEY,eval:achEval,state:function(){return ACH;},last:function(){return ACHLAST;},tally:function(){return ACHRUN;},
  reset:function(){ ACH={v:1,got:{},intro:{},seq:0,pts:{ach:0,stars:0,spent:0}}; try{ window.localStorage.removeItem(ACH_KEY); }catch(e){} }};
window.PF.recap={stops:function(){return RC.stops;},geo:function(){return RC.geo;},phase:function(){return RC.ph;},at:function(){return RC.i;}};
