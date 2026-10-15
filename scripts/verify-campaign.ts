import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { runStrategy, type Strategy } from './campaign-witnesses.js';
import { endingWitnesses } from './ending-witnesses.js';
import { createRun, saveRun, resumeRun } from '../src/engine.js';
import { canonical, hash } from '../src/numeric.js';
await mkdir('artifacts',{recursive:true});
const witnesses=[];
for(const fixture of endingWitnesses) {
 const state=runStrategy(fixture.seed,fixture.strategy);assert.equal(state.report?.kind,fixture.ending);
 const serialized=saveRun(state);assert.equal(canonical(resumeRun(serialized)),canonical(state));
 const artifact=`artifacts/ending-${fixture.ending}.json`;await writeFile(artifact,serialized+'\n',{mode:0o600});
 witnesses.push({...fixture,identity:state.identity,quarters:state.quarter+1,commands:state.log.length,checksum:hash(state),artifact,report:state.report});
}
const rows: Array<{seed:string;scenarioId:string;strategy:Strategy;ending:string;quarters:number;cash:number;capability:number;safety:number;influence:number;revenue:number;incidents:number;checksum:string}>=[];
for(const seed of ['campaign:0','campaign:3','campaign:39']) {
 for(const scenarioId of ['full-28','full-28-skeptical','full-28-low-detection']) {
  for(const strategy of ['balance','safe','race','repeat-ship'] as Strategy[]) {
   const state=runStrategy(seed,strategy,scenarioId);const actor=state.actors[state.playerId];
   assert.equal(canonical(resumeRun(saveRun(state))),canonical(state));
   assert.ok(Object.values(state.actors).every(a=>a.cash>=0&&a.compute>=0));
   rows.push({seed,scenarioId,strategy,ending:state.report!.kind,quarters:state.quarter+1,cash:actor.cash,capability:actor.capability,safety:actor.safety,influence:actor.influence,revenue:actor.revenue,incidents:state.hidden.incidents,checksum:hash(state)});
  }
 }
}
const sensitivity=rows.filter(r=>r.scenarioId!=='full-28').map(row=>{
 const base=rows.find(b=>b.seed===row.seed&&b.strategy===row.strategy&&b.scenarioId==='full-28')!;
 return {seed:row.seed,strategy:row.strategy,scenarioId:row.scenarioId,changedEnding:row.ending!==base.ending,cashDifference:row.cash-base.cash,capabilityDifference:row.capability-base.capability,incidentDifference:row.incidents-base.incidents};
});
const report={
 reportVersion:'campaign-acceptance-v2b', identities:['full-28','full-28-skeptical','full-28-low-detection'].map(id=>createRun('identity',id).identity),
 technicalGate:'All eight endings reached with ordinary full-campaign commands and exact save/resume. This does not pass human acceptance.',
 humanGate:{owner:'pending',nonSpecialistsCompleted:0,requiredNonSpecialists:2},
 comparisons:'Identical seeds crossed with four public-view strategies, a pessimistic control prior, and a half-detection mechanism. The hidden control draw is held constant across scenario variants.',
 limitations:['Three retained sensitivity seeds are diagnostic examples, not a representative statistical sample.','All parameters are synthetic; no real-world strategic recommendation follows.','The repeat-ship policy intentionally tries exhausted launches to falsify an infinite revenue/influence exploit.','No aggregate victory score or target win rate is used. Full research provenance and calibrated distributions remain Stage 3.'],
 falsification:'Inspect per-seed outcomes and command logs. Fail on replay mismatch, negative resources, missing ending paths, leaked private state, or unbounded repeat launches. Treat assumption-sensitive rankings as contingent.',
 priorFailure:'A successful demo and registered tool list previously concealed unsupported ordinary player choices. Verify the failed owner transcript and every advertised control through real interfaces.',
 witnesses,sensitivity,runs:rows,
};
await writeFile('artifacts/campaign-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({endings:witnesses.map(w=>({ending:w.ending,seed:w.seed,strategy:w.strategy,quarters:w.quarters})),pairedRuns:rows.length,sensitivityChanges:sensitivity.filter(s=>s.changedEnding).length,artifact:'artifacts/campaign-validation.json'},null,2));
