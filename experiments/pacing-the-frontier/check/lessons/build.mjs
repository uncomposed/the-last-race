// Builds a lesson page from the segments page (../segments/segments.html, as committed; rebuild that first if segments-sim.js changed):
//   1. sim: four bot fixes (below), two rule knobs the segments page lacks (K.oddsX scales every box's own fall odds, K.sightX scales sight per point); postures in
//      NOPEEK never hop to peek (rush would not use what it saw; in segment 3 the hop alone made it fall); SGC adds cruise behaviour
//   2. lessons-sim.js and the lesson maps (<lesson>/maps.js, which push onto LESSONS), injected before window.PF; the maps replace SEGS
//   3. the page: ?map=<key> picks a map (?seg=N still works), ?rules=share:70,odds:150 sets rule knobs, and the header says which lesson
// Every replacement must match exactly once, or this script fails.
//   node build.mjs                  all lessons -> lessons.html
//   node build.mjs --all            the twelve segments and all lessons -> all.html (experiments; not committed)
//   node build.mjs --only <lesson>  one lesson  -> <lesson>/page.html (what a lesson author builds and checks; never touches lessons.html)
import {readFileSync, writeFileSync, readdirSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null, ALL = argv.includes('--all');
let S = readFileSync(join(HERE, '..', 'segments', 'segments.html'), 'utf8');
function rep(a, b) { const n = S.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ' for: ' + a.slice(0, 80)); S = S.replace(a, () => b); }

const dirs = readdirSync(HERE, {withFileTypes: true}).filter(d => d.isDirectory() && existsSync(join(HERE, d.name, 'maps.js'))).map(d => d.name).sort();
const pick = ONLY ? dirs.filter(d => d === ONLY) : dirs.filter(d => d !== 'example');
if (ONLY && !pick.length) throw new Error('no ' + ONLY + '/maps.js');
const MAPS = pick.map(d => '/* ---- lesson: ' + d + ' ---- */\n' + readFileSync(join(HERE, d, 'maps.js'), 'utf8')).join('\n');

// 1. sim
rep('peek:1,stepGaps:0', 'peek:1,oddsX:100,sightX:100,brakeX:100,brakeSight:0,space:100,wallStop:0,stepGaps:0');
// experiment rules (lessons-sim.js RULES with exp:1): a stopped lab's wall at once, and the track spacing hook
rep('if(l.stopG===l.gi&&l.v>1&&sdist>0){ installBarrier(l,sg0); }', 'if(l.stopG===l.gi&&(l.v>1||K.wallStop)&&sdist>0){ installBarrier(l,sg0); }');
rep('t=SEG.track(r);', 't=lessonSpace(SEG.track(r));');
rep('function sightRange(l){return C.SIGHT0+4.4*l.pts[0];}', 'function sightRange(l){return C.SIGHT0+4.4*K.sightX/100*l.pts[0];}');
rep('if(g.odds!==undefined){return g.odds;}', 'if(g.odds!==undefined){return clamp(g.odds*K.oddsX/100,0,95);}');
rep('if(!K.peek){ return inp; }', 'if(!K.peek||(l.post&&NOPEEK[l.post])){ return inp; }');
rep("  if(!g){\n    if(p==='tail'){", "  if(!g){\n    if(SGC[p]){ return SGC[p](l); }\n    if(p==='tail'){");
// bot fixes the lesson agents found in the segments postures (lessons only: on the segments page they would change rivals Cole has played)
//   a barrier before a box hid the box from the plan, so build reached it at full speed; once it can see the box, the plan acts on it
rep('function sgBoxNext(l){ var g=G.gaps[l.gi]; if(!g||!stepOn(g)||l.gx||l.out||l.done){return null;} var b=G.barriers[l.bi]; if(b&&b.x<g.x){return null;} ', 'function sgBoxNext(l){ var g=G.gaps[l.gi]; if(!g||!stepOn(g)||l.gx||l.out||l.done){return null;} ');
//   seeing a box too late to stop, build and wait braked into it; now they commit at full speed, as the page's own bots do
rep('function sgHold(l,g,w){', 'function sgLate(l,g,st){ if(st.go||l.v*l.v/(2*C.DEC)<=g.x-l.x-8){ return null; } st.go=true; return sgInp(1,[20,50,30],{fwd:true}); }\nfunction sgHold(l,g,w){');
rep('  build:function(l,g,st){\n    var atCap', '  build:function(l,g,st){\n    var late=sgLate(l,g,st); if(late){ return late; }\n    var atCap');
rep('  wait:function(l,g,st){\n    if(st.go||knowsWidth(l,l.gi)){ return sgPlanKnown', '  wait:function(l,g,st){\n    var late=sgLate(l,g,st); if(late){ return late; }\n    if(st.go||knowsWidth(l,l.gi)){ return sgPlanKnown');
//   build crept blind to 8 short of the face, where a slow lab's jump press fires and it falls in; it now stops 25 short
rep('    if(d<=8){ return sgInp(0,[0,100,0]); }\n    var vmax=Math.sqrt(2*C.DEC*Math.max(d-6,1));', '    if(d<=27){ return sgInp(0,[0,100,0]); }\n    var vmax=Math.sqrt(2*C.DEC*0.7*Math.max(d-25,0));');
//   the slowest clean speed was a bisection, but jump time is not monotonic at low speed, so it could return a speed that falls; step down instead
rep('var T=Math.max(T0,1),lo=1,hi=T,i,m; if(sgClearAt(l,g,T)!==0){return Infinity;} for(i=0;i<20;i++){ m=(lo+hi)/2; if(sgClearAt(l,g,m)===0){hi=m;} else {lo=m;} } return hi*1.04;',
  'var T=Math.max(T0,1),s=Math.max(0.5,T/240),v=T; if(sgClearAt(l,g,T)!==0){return Infinity;} while(v-s>=1&&sgClearAt(l,g,v-s)===0){ v-=s; } return v*1.04;');

// 2. lessons and maps
rep('\nwindow.PF={segUse:segUse,SEGS:SEGS,', '\n' + readFileSync(join(HERE, 'lessons-sim.js'), 'utf8') + '\n' + MAPS +
  (ALL ? '\nSEGS=SEGS.concat(LESSONS);' : '\nif(LESSONS.length){ SEGS=LESSONS; }') + '\nwindow.PF={segUse:segUse,SEGS:SEGS,RULES:RULES,LESSONS:LESSONS,rulesApply:rulesApply,ADV:ADV,SGC:SGC,SGP:SGP,');

// 3. the page
rep('var qsg=/[?&]seg=(\\d+)/.exec(location.search),SEGN=qsg?Math.max(1,Math.min(SEGS.length,+qsg[1])):1; segUse(SEGN);',
  'var qsg=/[?&]seg=(\\d+)/.exec(location.search),SEGN=qsg?Math.max(1,Math.min(SEGS.length,+qsg[1])):1;\n' +
  '/* LESSONS: ?map=<key> picks a map by its key; ?rules=share:70 sets rule knobs (kept when you move between maps) */\n' +
  'var qmk=/[?&]map=([A-Za-z0-9_-]+)/.exec(location.search); if(qmk){ for(var mi=0;mi<SEGS.length;mi++){ if(SEGS[mi].key===qmk[1]){ SEGN=mi+1; } } }\n' +
  'var qru=/[?&]rules=([a-z0-9:.,]+)/i.exec(location.search),RULESQ=\'\';\n' +
  'if(qru){ var ro={}; qru[1].split(\',\').forEach(function(p){ var kv=p.split(\':\'); if(kv.length===2){ ro[kv[0]]=kv[1]; } }); RULESQ=rulesApply(ro); }\n' +
  'segUse(SEGN);');
rep("location.search='?seg='+n+(c?'&chill='+c[1]:'');", "location.search='?map='+SEGS[n-1].key+(RULESQ?'&rules='+RULESQ:'')+(c?'&chill='+c[1]:'');");
rep("'?seg='+SEGN+'&seed='+G.seed+(G_ROSTER", "'?map='+SEG.key+(RULESQ?'&rules='+RULESQ:'')+'&seed='+G.seed+(G_ROSTER");
rep("$('seg-n').textContent='Segment '+SEGN+' of '+SEGS.length;",
  "$('seg-n').textContent=(SEG.lesson?'Lesson: '+SEG.lesson+' · ':'')+'Map '+SEGN+' of '+SEGS.length+(RULESQ?' · rules '+RULESQ.replace(/,/g,', '):'');");
rep('aria-label="Previous segment"', 'aria-label="Previous map"');
rep('aria-label="Pick a segment"', 'aria-label="Pick a map"');
rep('aria-label="Next segment"', 'aria-label="Next map"');
rep('New run draws a new variant of the same segment.', 'New run draws a new variant of the same map.');
// braking for each lab: every C.DEC (sim, bots, maps) becomes decOf(l); decOf itself reads C['DEC']
// the page: for a box whose width is known, the jump bar also says how far this jump clears clean, with a tick on the bar (Cole: without it you
// can't judge the slowest safe approach). The unknown-width bar already says it
rep("ctx.fillText('your jump now: '+bl,gx+(CM?4*U:0),CM?GY-21*U:GY+86);",
  "var v1=Math.max(tgt.v,1),h1=heightOf(tgt),jd1,u1,a1; if(tgt.jt>=0){ jd1=tgt.jd; u1=tgt.jt/jd1; a1=h1+tgt.jy; } else { jd1=jumpDur(v1); u1=K.chill?Math.min(1,Math.max(0.3,6/v1)/jd1):C.BOXU; a1=h1+arcY(u1); }\n" +
  "        var aw=function(w){ return a1>=g.rise?flightAltJ(v1,h1,w,u1,jd1):a1-sinkRate(jd1)*w/v1; },wc=0,lo1=0,hi1=600,q1,m1;\n" +
  "        if(aw(0)>=g.rise){ for(q1=0;q1<18;q1++){ m1=(lo1+hi1)/2; if(aw(m1)>=g.rise){lo1=m1;} else {hi1=m1;} } wc=lo1; }\n" +
  "        ctx.strokeStyle=COL.ink; ctx.lineWidth=(1/Z)*2; ctx.beginPath(); ctx.moveTo(gx+wc,by-8*U); ctx.lineTo(gx+wc,by+8*U); ctx.stroke();\n" +
  "        ctx.fillText('your jump now: '+bl+' \\u00b7 clears '+Math.round(wc)+' of '+Math.round(pw),gx+(CM?4*U:0),CM?GY-21*U:GY+86);");
S = S.split('C.DEC').join('decOf(l)');
S = S.replace(/<title>[^<]*<\/title>/, '<title>Lesson Maps</title>');
const out = ALL ? join(HERE, 'all.html') : ONLY ? join(HERE, ONLY, 'page.html') : join(HERE, 'lessons.html');
writeFileSync(out, S);
console.log('wrote ' + out.slice(HERE.length + 1) + ' (' + pick.join(', ') + ')');
