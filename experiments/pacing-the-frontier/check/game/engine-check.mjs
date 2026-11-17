// Do Node (V8) and Safari's engine (JavaScriptCore) run the shipped simulation to the same bits? node engine-check.mjs
// The leaderboard server replays a phone's recorded input under Node, so a run from iPhone Safari only verifies if both engines compute
// identical states. macOS ships JavaScriptCore as a command-line tool (jsc), and it replays real iPhone logs bit for bit (2026-11-17), so this
// check runs one script under both: every map, three seeds, a seeded player through the page's own input object, and the fingerprint of
// every lab twice a second. Without jsc (not macOS) it says so and passes; it is a Mac-only check, not a substitute for a phone.
// Before detmath.js, Math.sin, pow and exp differed in the last bit between the two engines and 2 of 10 real iPhone races drifted under Node.
import {readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const HERE = dirname(fileURLToPath(import.meta.url)), L = readFileSync(join(HERE, 'game.html'), 'utf8').split('\n');
const a = L.findIndex(l => l.startsWith('function $(id)')), b = L.findIndex(l => l.startsWith('window.PF={'));
if (a < 0 || b < a) throw new Error('simulation section not found');
const SIM = L.slice(a, b + 1).join('\n'), GHOST = readFileSync(join(HERE, 'ghost.js'), 'utf8');
const JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc';

// plain ES5 so it runs under both engines; prints one line per race
const script = `var window={},document=null;
${GHOST}
function fresh(){ return (function(window,document){ ${SIM}\nreturn window.PF; })({},null); }
function rng(s){ return function(){ s=s+0x6D2B79F5|0; var t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
var OUT=[],keys=fresh().SEGS.map(function(m){ return m.key; });
keys.forEach(function(key,ki){ for(var s=0;s<3;s++){
  var P=fresh(),K=P.K; K.stepGaps=1; K.chill=1; P.segUse(ki+1); P.newGame(7000+s*131+ki);
  var G=P.G(),I=G.input,r=rng(91+s*7+ki),n=0,next=0,ui={pace:70,w:[25,50,25],rev:false,fwd:false},h=[];
  while(!G.over&&n<60000){
    if(n>=next){ ui.pace=5*Math.floor(8+r()*13); if(r()<0.5){ var a=Math.floor(r()*60),b=Math.floor(r()*(100-a)); ui.w=[a,b,100-a-b]; } ui.fwd=r()<0.3; ui.rev=!ui.fwd&&r()<0.1; next=n+30+Math.floor(r()*150); }
    I.pace=ui.pace/100; I.w=ui.w; I.auto=true; I.rev=ui.rev; I.fwd=ui.fwd;
    P.step(1/60); n++; if(n%30===0){ h.push(ghPrint(G)); }
  }
  OUT.push(key+' seed '+(7000+s*131+ki)+' steps '+n+' end '+ghPrint(G)+' trace '+h.join(','));
} });
var text=OUT.join('\\n');
if(typeof console==='undefined'||typeof console.log!=='function'){ print(text); } else { console.log(text); }
`;
const dir = mkdtempSync(join(tmpdir(), 'engine-check-')), file = join(dir, 'race.js');
writeFileSync(file, script);
const node = execFileSync(process.execPath, [file], {encoding: 'utf8', maxBuffer: 1 << 28}).trim().split('\n');
if (!existsSync(JSC)) { rmSync(dir, {recursive: true}); console.log(node.length + ' races under Node; no jsc here (it ships with macOS), so the engine comparison was skipped'); process.exit(0); }
const jsc = execFileSync(JSC, [file], {encoding: 'utf8', maxBuffer: 1 << 28}).trim().split('\n');
rmSync(dir, {recursive: true});
let bad = 0;
node.forEach((line, i) => { if (line !== jsc[i]) { bad++; const [x, y] = [line, jsc[i] || ''].map(s => s.split(' trace ')[1].split(',')); const at = x.findIndex((p, k) => p !== y[k]); console.log('FAIL ' + line.split(' trace ')[0] + ': Node and JavaScriptCore part at ' + (at + 1) * 0.5 + ' s'); } });
if (jsc.length !== node.length) { bad++; console.log('FAIL Node ran ' + node.length + ' races, JavaScriptCore ' + jsc.length); }
if (bad) { console.log(bad + ' of ' + node.length + ' races differ between engines'); process.exit(1); }
console.log(node.length + ' races on ' + node.length / 3 + ' maps: Node and JavaScriptCore agree on every lab, twice a second, bit for bit');
console.log('engine checks pass');
