// Page-side patches for page-hidden.html (everything below the sim section, so the node harness sees the same sim):
//   1. a box whose far edge the watched lab cannot see is drawn as a face with its top fading out, labelled "width unknown",
//      and the jump bar says "unknown" (with the jump's own reach) until the far edge is in view
//   2. the draw code no longer assumes a singularity gap exists
//   3. ?hidden=1: the track from hidden.mjs, ?boxes=N for several with beacons mixed in (width drawn from the seed, 0.6 to 2.6 x the fit, or ?wf=), steps on, chill off
//      unless ?chill=1, and the three rivals play the three postures: Sprinter = Rush, Steward = Build, Gambler = Wait
// Idempotent: refuses to run twice. Every replacement must match exactly once.
import {readFileSync, writeFileSync} from 'node:fs';
const [file] = process.argv.slice(2);
let S = readFileSync(file, 'utf8');
if (S.includes('HIDDEN_WIDTH_UI')) throw new Error('already patched');
function rep(a, b) { const n = S.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ' for: ' + a.slice(0, 80)); S = S.replace(a, b); }

// 2. singularity guard
rep("var sgp=G.gaps[G.sing],singKnown=knowsGap(tgt,G.sing),sx0=sgp.x+gapWidth(tgt,sgp)-cam;",
    "var sgp=G.gaps[G.sing],singKnown=!!sgp&&knowsGap(tgt,G.sing),sx0=sgp?sgp.x+gapWidth(tgt,sgp)-cam:Infinity;");

// 1. box drawing and bar
rep("      if(stepOn(g)){ gtop=g.rise; ctx.fillStyle=hatch; ctx.fillRect(gx,GY-gtop,pw,gtop); ctx.strokeStyle=COL.danger; ctx.lineWidth=(1/Z)*2; ctx.strokeRect(gx,GY-gtop,pw,gtop); }  /* step gaps: the box stands on the ground */",
    "      var wk=!stepOn(g)||knowsWidth(tgt,k),fade=60;  /* HIDDEN_WIDTH_UI: the far edge is drawn only once the watched lab can see it */\n" +
    "      var sw=stepOn(g)&&!wk?seenW(tgt,g,shadows(tgt)):0;  /* how much of the top is in view */\n" +
    "      if(stepOn(g)&&!wk){\n" +
    "        gtop=g.rise; ctx.fillStyle=hatch; ctx.fillRect(gx,GY-gtop,sw+fade,gtop);\n" +
    "        var fg=ctx.createLinearGradient(gx+sw,0,gx+sw+fade,0); fg.addColorStop(0,'rgba(0,0,0,0)'); fg.addColorStop(1,COL.surface); ctx.fillStyle=fg; ctx.fillRect(gx+sw,GY-gtop-1,fade+1,gtop+1);\n" +
    "        ctx.strokeStyle=COL.danger; ctx.lineWidth=(1/Z)*2; ctx.beginPath(); ctx.moveTo(gx,GY); ctx.lineTo(gx,GY-gtop); ctx.lineTo(gx+sw+fade*0.3,GY-gtop); ctx.stroke();\n" +
    "        if(sw>0){ ctx.beginPath(); ctx.moveTo(gx+sw,GY-gtop); ctx.lineTo(gx+sw,GY-gtop+Math.min(10,gtop)); ctx.stroke(); }\n" +
    "        ctx.fillStyle=COL.danger; ctx.font=FW; ctx.fillText('?',gx+sw+fade*0.4,GY-gtop*0.5+4*U);\n" +
    "      }\n" +
    "      else if(stepOn(g)){ gtop=g.rise; ctx.fillStyle=hatch; ctx.fillRect(gx,GY-gtop,pw,gtop); ctx.strokeStyle=COL.danger; ctx.lineWidth=(1/Z)*2; ctx.strokeRect(gx,GY-gtop,pw,gtop); }  /* step gaps: the box stands on the ground */");
rep("      ctx.fillText((g.sing?'Singularity \\u00b7 ':'')+'gap '+Math.round(pw)+' wide'+(g.pub?' \\u00b7 public':''),gx+4*U,GY-gtop-8*U);",
    "      ctx.fillText(wk?((g.beacon?'tall \\u00b7 ':'')+(g.sing?'Singularity \\u00b7 ':'')+'gap '+Math.round(pw)+' wide'+(g.pub?' \\u00b7 public':'')):((g.beacon?'tall box':'box')+(sw>0?' \\u00b7 at least '+Math.round(sw)+' wide':' \\u00b7 width unknown')),gx+4*U,GY-gtop-8*U);");
rep("      if(stepOn(g)){\n        /* step gaps: the bar predicts the sim's own rule (boxOutcome).",
    "      if(stepOn(g)&&!wk){\n" +
    "        /* HIDDEN_WIDTH_UI: the width is unknown, so the bar shows the widest box this jump clears clean (blue) and with a scrape (orange), next to how much of the box is in view */\n" +
    "        var v0=Math.max(tgt.v,1),h0=heightOf(tgt),jd0,u0,a0;\n" +
    "        if(tgt.jt>=0){ jd0=tgt.jd; u0=tgt.jt/jd0; a0=h0+tgt.jy; } else { jd0=jumpDur(v0); u0=K.chill?Math.min(1,Math.max(0.3,6/v0)/jd0):C.BOXU; a0=h0+arcY(u0); }\n" +
    "        var altW=function(w){ return a0>=g.rise?flightAltJ(v0,h0,w,u0,jd0):a0-sinkRate(jd0)*w/v0; };\n" +
    "        var lim=function(th){ var lo=0,hi=600,q,m; if(altW(0)<th){return 0;} for(q=0;q<18;q++){ m=(lo+hi)/2; if(altW(m)>=th){lo=m;} else {hi=m;} } return lo; };\n" +
    "        var wcl=lim(g.rise),wsc=lim(1e-9),ry=GY+(CM?20*U:70);\n" +
    "        ctx.lineWidth=(1/Z)*4; ctx.strokeStyle=COL.a; ctx.beginPath(); ctx.moveTo(gx,ry); ctx.lineTo(gx+Math.max(2,wcl),ry); ctx.stroke();\n" +
    "        ctx.strokeStyle=COL.b; ctx.beginPath(); ctx.moveTo(gx+wcl,ry); ctx.lineTo(gx+Math.max(wcl+2,wsc),ry); ctx.stroke();\n" +
    "        ctx.fillStyle=sw>wcl?COL.b:COL.a; ctx.font=FW; ctx.fillText('your jump now: clean to '+Math.round(wcl)+', scrape to '+Math.round(wsc)+(sw>0?' \\u00b7 box at least '+Math.round(sw):''),gx+(CM?4*U:0),CM?GY-21*U:GY+86);\n" +
    "      } else if(stepOn(g)){\n        /* step gaps: the bar predicts the sim's own rule (boxOutcome).");

// 1b. the hint line under the meters must not name a width the lab cannot see
rep("      if(knowsGap(l,l.gi)){\n        var gw=Math.round(gapWidth(l,ng)),ns=Math.round(needSpeed(l,ng)),rv=Math.round(Math.sqrt(l.v*l.v+2*accOf(l)*Math.max(gd-8,0)));",
    "      if(knowsGap(l,l.gi)&&stepOn(ng)&&!knowsWidth(l,l.gi)){  /* HIDDEN_WIDTH_UI */\n" +
    "        var swh=Math.round(seenW(l,ng,shadows(l))); parts.push('Gap '+(l.gi+1)+' in '+gd+', '+(swh>0?'at least '+swh+' wide so far':'width unknown')+': you cannot see its far edge yet. Height and sight show more of the top as you close in, or let a rival go first. Brake distance '+Math.round(l.v*l.v/(2*C.DEC))+'. Room to back up: '+Math.max(0,Math.round(l.x-backLimit(l)))+'.');\n" +
    "      } else if(knowsGap(l,l.gi)){\n        var gw=Math.round(gapWidth(l,ng)),ns=Math.round(needSpeed(l,ng)),rv=Math.round(Math.sqrt(l.v*l.v+2*accOf(l)*Math.max(gd-8,0)));");

// 3. keep hidden=1 in the address the page writes
rep("+(K.stepGaps?'&steps=1'+(C.RISEFLOOR>0?'&floor='+C.RISEFLOOR:''):'')); }catch(e){}",
    "+(K.stepGaps?'&steps=1'+(C.RISEFLOOR>0?'&floor='+C.RISEFLOOR:''):'')+(window.HIDDEN?'&hidden=1'+(window.WF0?'&wf='+window.WF0:'')+(window.NBOX>1?'&boxes='+window.NBOX:''):'')); }catch(e){}");

// 3b. ghost links keep hidden mode (the mode, box count and width override live in the query, which siteBase() drops)
rep("function ghLink(b64){ return utm(siteBase(),'ghost')+'#g='+b64; }",
    "function ghLink(b64){ return utm(siteBase(),'ghost')+(window.HIDDEN?'&hidden=1'+(window.NBOX>1?'&boxes='+window.NBOX:'')+(window.WF0?'&wf='+window.WF0:''):'')+'#g='+b64; }  /* HIDDEN_WIDTH_UI */");

// 3. the mode itself, after the ?floor= query line
const HOOK = "if(qfl){ C.RISEFLOOR=clamp(+qfl[1],0,2); }";
rep(HOOK, HOOK + `
/* ---- HIDDEN_WIDTH_UI: ?hidden=1 is the one-box hidden-width track of check/hidden-width/hidden.mjs, playable by hand ---- */
var qh=/[?&]hidden=(0|1)/.exec(location.search); window.HIDDEN=!!(qh&&qh[1]==='1');
var qwf=/[?&]wf=(\\d+(?:\\.\\d+)?)/.exec(location.search); window.WF0=qwf?+qwf[1]:null;
var qbx=/[?&]boxes=(\\d+)/.exec(location.search); window.NBOX=qbx?Math.max(1,Math.min(6,+qbx[1])):1;
if(window.HIDDEN){
  K.stepGaps=1; var hsgi=$('k-stepGaps'); if(hsgi){ hsgi.checked=true; $('o-k-stepGaps').textContent='on'; }
  if(!qc){ K.chill=0; ui.auto=false; $('auto').checked=false; showChill(); }
  var HCRUISE={pace:0.7,jit:0,pit:1,pitPub:1,bar:1,safe:false,w:[20,50,30]},HPOST={sprinter:'rush',steward:'build',gambler:'wait'},HNAME={rush:'Rush',build:'Build',wait:'Wait'};
  POL.sprinter=Object.assign({},HCRUISE,{w:HCRUISE.w.slice()}); POL.steward=Object.assign({},HCRUISE,{w:HCRUISE.w.slice()}); POL.gambler=Object.assign({},HCRUISE,{w:HCRUISE.w.slice()});
  KINDS.sprinter.name='Rush'; KINDS.steward.name='Build'; KINDS.gambler.name='Wait';
  var HSEED=0,newGame0=newGame;
  newGame=function(s,k,r){ HSEED=s>>>0; return newGame0(s,k,r); };
  /* the track: gate, two low barriers, 60 of ground, run-up, one box (rise 0.7 of the ceiling, width wf x the stop-and-build fit), 150 to the finish */
  /* the track: gate, then per box 60 of ground with two low barriers, a 170 run-up and the box (rise 0.7 of that level's ceiling,
     width wf x the stop-and-build fit, wf 0.6 to 2.6 from the seed or ?wf=), 40 after; 150 to the finish. ?boxes=N (1 to 6).
     With more than one box, each box is a beacon with probability one half: tall (cap + 0.6 jump) and thin, so it shows over rivals' heads from afar
     but cannot be seen over; a lone box is always devious (low, any width) */
  globalThis.SCEN=function(T,X){
    var r=rngMaker((HSEED^0x51ED270B)>>>0),n=window.NBOX||1,gate=175,bars=[{x:gate,h:C.JUMP+18,pub:true,gate:true,seg:0}],gaps=[],x=gate+C.BW+60,i,j;
    for(i=0;i<n;i++){
      /* the width draw is always made, so ?wf= never moves the beacon draw; a beacon is thin (0.6 to 1.1 x fit) */
      var wfr=0.6+2.0*r(),beacon=n>1&&r()<0.5,wf=window.WF0||(beacon?0.6+(wfr-0.6)/4:wfr),cap=C.CAPS[i],hcap=cap+C.JUMP-6,ref=(C.JUMP+C.HREF0+C.HREF1*i)*K.barScale/100,L=60,bl=[0.4,0.5];
      for(j=0;j<bl.length;j++){ bars.push({x:Math.round(x+(j+0.5)/bl.length*L),h:Math.round(Math.min(bl[j]*ref,hcap)*10)/10,pub:false,seg:i}); }
      var gx=Math.round(x+L+170),rise=beacon?Math.round(cap+0.6*C.JUMP):Math.round(Math.min(0.7*cap,Math.min(C.RISEMAX*cap,cap+0.5*C.JUMP))),lim=-60;  /* a beacon is tall: its top stands above a lab at the ceiling, so it shows over rivals' heads */
      for(j=0;j<bars.length;j++){ if(bars[j].x<gx){ lim=Math.max(lim,bars[j].x+C.BW+2); } }
      if(i>0){ lim=Math.max(lim,gaps[i-1].x+gaps[i-1].W+10); }
      var vrun=Math.min(C.TOP0+0.85*cap*K.stepV/100,Math.sqrt(2*C.ACC*Math.max(gx-lim-8,0))),fit=X.boxFit(cap,rise,vrun),W=Math.max(30,Math.round(wf*fit));
      gaps.push({x:gx,W:W,crossedBy:-1,stepH:0,pub:false,beacon:beacon,sing:false,rise:rise,t:0.7,wd:0.5,nowarn:false,fit:Math.round(fit),vrun:Math.round(vrun)});
      x=gx+W+40;
    }
    T.gaps=gaps; T.bars=bars; T.finish=x+150; T.n=n; T.sing=-1; T.x0=x; T.ni=0; T.A=0.1; T.sig='hidden'; T.label=(n===1?'one hidden box':n+' boxes, devious and beacons'); T.lean=0;
  };
  /* the three postures, as in hidden.mjs: rivals only (the human is never driven) */
  var hTop=function(l){ return topSpeed(l); };  /* the page's own top speed, crash and scrape cap included */
  var hClearAt=function(l,g,v){ var h=l.pts[1],w=gapWidth(l,g),jd=jumpDur(v),u0=C.BOXU,a0=h+arcY(u0),alt=a0>=g.rise?flightAlt(v,h,w,u0):a0-sinkRate(jd)*w/v; return alt>=g.rise?0:(alt>0?1:2); };
  var hCleanSpeed=function(l,g,T0){ var T=Math.max(T0||hTop(l),1),lo=1,hi=T,i,m; if(hClearAt(l,g,T)!==0){return Infinity;} for(i=0;i<20;i++){ m=(lo+hi)/2; if(hClearAt(l,g,m)===0){hi=m;} else {lo=m;} } return hi*1.04; };
  var hInp=function(pace,w,x){ return Object.assign({pace:pace,w:w,jump:false,auto:true,rev:false,fwd:false},x||{}); };
  var hACC=function(){ return C.ACC*0.9; },hStand=function(){ return C.STEPD+120; };
  var hBoxNext=function(l){ var g=G.gaps[l.gi]; if(!g||!stepOn(g)||l.gx||l.out||l.done){return null;} var b=G.barriers[l.bi]; if(b&&b.x<g.x){return null;} if(towerOf(l,g)&&l.pts[1]+C.JUMP<g.stepH+2){return null;} if(!(g.pub||l.seenG[l.gi])){return null;} return g; };
  var hPlanKnown=function(l,g,st){
    /* judged against what the ceiling allows (full height, full speed meter): the clean speed if there is one, else top speed for a scrape, else nothing */
    var d=g.x-l.x,T=Math.max(hTop(l),1),TM=Math.max(C.TOP0+0.85*l.cap,1),atCap=l.pts[1]>=l.cap-0.5,reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*hACC()*Math.max(d-8,0));
    var vcl=hCleanSpeed(l,g,TM),target=vcl<=TM?vcl:(hClearAt(l,g,TM)===1?TM:Infinity);
    if(target===Infinity){ if(!atCap){ return hInp(0,[0,100,0]); } st.refused=true; return hInp(0,[0,0,100]); }
    if(st.go){ return hInp(1,HCRUISE.w,{fwd:true}); }
    if(target>T){ if(capped(l)){ var vmx=Math.sqrt(2*C.DEC*Math.max(d-6,1)); return hInp(Math.min(0.3,vmx/T),[0,0,100]); } return hInp(0,[0,0,100]); }
    if(reach>=target){ st.go=true; return hInp(1,HCRUISE.w,{fwd:true}); }
    var need=target*target/(2*hACC())+15;
    if(d<need&&l.x>backLimit(l)+2){ return hInp(0,[0,0,100],{rev:true}); }
    if(d<need&&hClearAt(l,g,Math.min(T,reach))===2){ st.refused=true; return hInp(0,[0,0,100]); }
    st.go=true; return hInp(1,HCRUISE.w,{fwd:true});
  };
  var hHold=function(l,g,w,standoff){ var d=g.x-l.x,brake=l.v*l.v/(2*C.DEC); if(d-brake>standoff+10){ return hInp(HCRUISE.pace,w); } return hInp(0,w); };
  var HP={
    rush:function(l,g,st){ return hInp(1,HCRUISE.w,{fwd:true}); },
    build:function(l,g,st){
      if(st.go||knowsWidth(l,l.gi)){ return hPlanKnown(l,g,st); }
      var atCap=l.pts[1]>=l.cap-0.5,d=g.x-l.x;
      if(!atCap){ return hHold(l,g,[0,100,0],hStand()); }
      if(d<=8){ return hInp(0,[0,100,0]); }
      var vmax=Math.sqrt(2*C.DEC*Math.max(d-6,1)); return hInp(Math.min(0.25,vmax/Math.max(hTop(l),1)),[0,100,0]);
    },
    wait:function(l,g,st){
      if(st.go||knowsWidth(l,l.gi)){ return hPlanKnown(l,g,st); }
      st.t=(st.t||0)+1/60; if(st.t>15){ return HP.build(l,g,st); }
      return hHold(l,g,[0,0,100],hStand());
    }
  };
  globalThis.CTRL=function(l,GG){
    if(l.human){ return null; }
    var p=HPOST[l.kind]; if(!p){ return null; }
    if(!l.hst||l.hst.g!==GG){ l.hst={g:GG,s:{}}; l.name=HNAME[p]; }
    var g=hBoxNext(l); if(!g){ return null; }
    var st=l.hst.s[l.gi]||(l.hst.s[l.gi]={}); return HP[p](l,g,st);
  };
}
`);

writeFileSync(file, S);
console.log('patched', file);
