import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRun, execute, getView, getPlan, getBeliefs, getFeed, getRivals, getRules, listActions, explain, previewQuarter, saveRun, resumeRun, getFinalReveal } from '../src/engine.js';
import { getScenario, validateScenario } from '../src/scenario.js';
import { canonical } from '../src/numeric.js';
import { detectionProbability, endingCandidates, completeParadigm, registerTraining, strategicEvidence, updateStrategicBeliefs, campaignQuarterEnd, computeCapacity, operatingCost } from '../src/campaign.js';
import { makePlan } from '../src/policy.js';
import { RunService } from '../src/service.js';
import { CliSession } from '../src/cli.js';
import type { Action, CommandPayload, RunState, WildcardRuling } from '../src/types.js';
import { commit, runStrategy } from '../scripts/campaign-witnesses.js';
const train: Action = { type: 'train', scale: 'small', method: 'pretraining', focuses: ['reasoning','coding'] };
const purchase: WildcardRuling = { effect: 'capacity', amount: 4, price: 12, delay: 0, duration: null, upkeep: 1, visibility: 'physical' };
function reject(state:RunState,payload:CommandPayload) {
 const before=canonical(state);const r=execute(state,{actorId:state.playerId,expectedRevision:state.revision,idempotencyKey:`reject:${state.revision}`,payload});
 assert.equal(r.ok,false); assert.equal(canonical(state),before);assert.equal(r.state,state);return r;
}
function wildcard(state:RunState,ruling=purchase) {
 state=commit(state,{type:'propose_wildcard',proposal:'Synthetic human test fixture: purchase compute',ruling});
 const id=state.campaign!.proposals.at(-1)!.id;
 state=commit(state,{type:'decide_wildcard',proposalId:id,decision:'accept',humanApproval:'Explicit synthetic test approval'});
 return commit(state,{type:'apply_wildcard',proposalId:id});
}
test('full campaign exposes complete regions, roster, governments and declared endings',()=>{
 const state=createRun('scope','full-28'), scenario=getScenario('full-28');
 assert.equal(scenario.horizon,28);assert.equal(scenario.campaign!.regions.length,12);assert.equal(Object.keys(state.actors).length,6);assert.equal(state.campaign!.governments.length,2);
 assert.equal(getRules(state).endingPrecedence.length,8);assert.equal(getBeliefs(state).length,21);
 const broken=structuredClone(scenario);broken.campaign!.precedence.pop();assert.throws(()=>validateScenario(broken));
 assert.deepEqual(getFinalReveal(state),{error:'Final reveal is available only after the run ends.'});
});
test('exact failed Q1 transcript reaches priced approved purchase without a fourth move and replays',()=>{
 let s=createRun('owner-first','full-28');s=commit(s,{type:'take_action',action:train});s=commit(s,{type:'take_action',action:{type:'ship',model:'own'}});
 assert.equal(s.movesUsed,2);assert.equal(getPlan(s).cashCommitted,31);assert.equal(getPlan(s).computeCommitted,4);
 reject(s,{type:'apply_wildcard',proposalId:'not-approved'});
 s=commit(s,{type:'propose_wildcard',proposal:'Too expensive compute offer',ruling:{...purchase,price:100}});
 const rejected=s.campaign!.proposals.at(-1)!.id;
 s=commit(s,{type:'decide_wildcard',proposalId:rejected,decision:'reject',humanApproval:'Human rejects price'});
 assert.equal(s.movesUsed,2);assert.equal(s.actors.deepcent.cash,85);
 reject(s,{type:'apply_wildcard',proposalId:rejected});
 s=wildcard(s);assert.equal(s.movesUsed,3);assert.equal(s.campaign!.wildcardUsed,true);
 reject(s,{type:'take_action',action:train});
 const saved=saveRun(s);s=resumeRun(saved);const preview=previewQuarter(s);
 s=commit(s,{type:'end_turn'});assert.equal(s.actors.deepcent.strategy!.assets[0].capacity,4);
 assert.equal(s.actors.deepcent.cash,preview.projectedClosingCash!-6);
 assert.equal(s.actors.deepcent.compute,12); // base + one-quarter lease + permanent purchase
 s=commit(s,{type:'end_turn'});assert.ok(s.actors.deepcent.compute>=8);
 assert.equal(canonical(resumeRun(saveRun(s))),canonical(s));
 reject(s,{type:'propose_wildcard',proposal:'second',ruling:purchase});
});
test('wildcard expiry, delayed delivery, human acceptance and once-only retries are bounded',()=>{
 let s=createRun('lease','full-28');
 reject(s,{type:'propose_wildcard',proposal:'code',ruling:{...purchase,code:'return hidden'} as WildcardRuling});
 s=commit(s,{type:'propose_wildcard',proposal:'temporary capacity',ruling:{...purchase,delay:1,duration:2}});
 const id=s.campaign!.proposals[0].id;
 reject(s,{type:'apply_wildcard',proposalId:id});
 reject(s,{type:'decide_wildcard',proposalId:id,decision:'accept',humanApproval:''});
 s=commit(s,{type:'decide_wildcard',proposalId:id,decision:'accept',humanApproval:'Human test approval'});
 const command={actorId:s.playerId,expectedRevision:s.revision,idempotencyKey:'exact-retry',payload:{type:'apply_wildcard',proposalId:id} as CommandPayload};
 let result=execute(s,command);assert.equal(result.ok,true);s=result.state;
 assert.equal(canonical(execute(s,command).state),canonical(s));
 s=commit(s,{type:'end_turn'});assert.equal(s.quarter,1);assert.equal(s.actors.deepcent.strategy!.assets.length,1);
 s=commit(s,{type:'end_turn'});assert.equal(s.actors.deepcent.strategy!.assets.length,1);
 s=commit(s,{type:'end_turn'});assert.equal(s.actors.deepcent.strategy!.assets.length,0);
});
test('construction delivery, permanent capacity, jurisdiction delay, upkeep and power allocation agree with preview',()=>{
 let s=createRun('construction','full-28');const action:Action={type:'build',regionId:'oregon',scale:'small',power:'clean',layout:'distributed',concealment:2};
 const p=listActions(s,action)[0];assert.equal(p.cashCost,36);assert.equal(p.visibility,'physical');
 const timing=p.timing as {availableQuarter:number;upkeep:number};assert.equal(timing.availableQuarter,5);
 s=commit(s,{type:'take_action',action});s=commit(s,{type:'end_turn'});
 assert.equal(s.projects.find(p=>p.actorId===s.playerId)!.remaining,4);
 while(s.quarter<timing.availableQuarter && s.phase==='planning') { if(listActions(s,train)[0].feasible) s=commit(s,{type:'take_action',action:train}); s=commit(s,{type:'end_turn'}); }
 assert.equal(s.actors.deepcent.strategy!.assets.length,1);assert.equal(s.actors.deepcent.strategy!.assets[0].upkeep,1);assert.ok(s.actors.deepcent.compute>=8);
 const current=structuredClone(s);current.actors.deepcent.strategy!.assets[0].capacity=24;
 reject(current,{type:'take_action',action});
});
test('funding reserves no imaginary cash, carries eight repayments and a finite parent budget',()=>{
 let s=createRun('funding','full-28');const cash=s.actors.deepcent.cash;
 s=commit(s,{type:'take_action',action:{type:'fund',source:'external',amount:40}});
 assert.equal(s.actors.deepcent.cash,cash);const preview=previewQuarter(s);
 s=commit(s,{type:'end_turn'});assert.equal(s.actors.deepcent.cash,preview.projectedClosingCash!-10);
 const debt=s.actors.deepcent.strategy!.obligations[0];assert.equal(debt.payment,5);assert.equal(debt.endQuarter-debt.startQuarter,8);
 assert.equal(operatingCost(s.actors.deepcent,8),5);assert.equal(operatingCost(s.actors.deepcent,9),0);
 const limited=structuredClone(s);limited.actors.deepcent.strategy!.parentBudget=0;
 reject(limited,{type:'take_action',action:{type:'fund',source:'parent',amount:20}});
});
test('concealment changes detection, not public acceptance; invalid modifiers reject atomically',()=>{
 const action:Action={type:'train',scale:'large',method:'rl',focuses:['science','agency']};
 assert.ok(detectionProbability({...action,concealment:2},0.5)<detectionProbability(action,0.5));
 assert.equal(detectionProbability({type:'announce',claim:'racing',targetId:'openbrain',value:true},0),1);
 const s=createRun('concealment','full-28');reject(s,{type:'take_action',action:{...train,concealment:99} as unknown as Action});
});
test('rival evidence has a causal path to policy; counterfactual omission changes the choice',()=>{
 const scenario=getScenario('full-28');const s=createRun('feedback','full-28');const actor=s.actors.deepcent;
 // Fixed resource boundary: product narrowly beats leasing before racing evidence.
 actor.lastRoutine='product';actor.weights.capability=0.8;actor.capability=2;
 const before=makePlan(actor,scenario,0,[]).items[0].choice;
 for(let n=0;n<12;n++) for(const target of Object.keys(s.actors).filter(id=>id!==actor.id)) {
  strategicEvidence(s,scenario,actor.id,target,target,'racing',1,`racing:${target}:${n}`,'Training signal','physical',true,0,1);
 }
 for(const e of s.evidence) e.processed=true;
 updateStrategicBeliefs(s,scenario,actor);
 const after=makePlan(actor,scenario,0,[]).items[0].choice;
 assert.notEqual(after,before);assert.equal(after,'lease');
 const mean=actor.strategy!.racingPressure;assert.ok(mean>0.7);
});
test('repeated claims deduplicate, observable contradiction adjusts credibility, absence requires monitoring',()=>{
 let s=createRun('claims','full-28');const action:Action={type:'announce',claim:'racing',targetId:'openbrain',value:false};
 s=commit(s,{type:'take_action',action});s=commit(s,{type:'end_turn'});
 const count=s.evidence.filter(e=>e.independentKey.startsWith('claim:deepcent:openbrain:racing:false')).length;assert.equal(count,5);
 s=commit(s,{type:'take_action',action});s=commit(s,{type:'end_turn'});
 assert.equal(s.evidence.filter(e=>e.independentKey.startsWith('claim:deepcent:openbrain:racing:false')).length,count);
 // Explicit observed contradictory signal, never direct access to target truth.
 strategicEvidence(s,getScenario('full-28'),'antropic','openbrain','openbrain','racing',1,'contradiction','Training observed','public',true,0,1);
 campaignQuarterEnd(s,getScenario('full-28'));assert.ok(s.campaign!.trust['antropic:deepcent']<0.5);
 const isolated=createRun('absence','full-28');isolated.campaign!.governments.forEach(g=>g.policy.weights={revenue:10,capability:0,safety:0,mission:0});
 campaignQuarterEnd(isolated,getScenario('full-28'));assert.equal(isolated.evidence.filter(e=>e.independentKey.startsWith('absence:')).length,0);
 isolated.campaign!.monitoring.push({observerId:'deepcent',targetId:'openbrain',quarter:0});campaignQuarterEnd(isolated,getScenario('full-28'));
 assert.equal(isolated.evidence.filter(e=>e.independentKey.startsWith('absence:')).length,1);
});
test('rumor opportunity is independent of hidden actions and knowledge boundaries hold in all new views',()=>{
 const s=createRun('private-campaign','full-28');const other=structuredClone(s);
 other.hidden.controlEffectiveness=0.01;other.campaign!.hidden.rumorPropensity=1;other.actors.openbrain.cash=999999;other.actors.openbrain.intelligence=0;other.actors.openbrain.strategy!.racingPressure=0.999;
 for(const selector of [getView,getPlan,getBeliefs,getFeed,getRivals,getRules,listActions,explain,previewQuarter]) assert.equal(canonical(selector(s)),canonical(selector(other)),selector.name);
 const baseline=structuredClone(other);other.interventions.push({id:'secret',actorId:'openbrain',action:train,cashCost:12,computeCost:3});
 campaignQuarterEnd(baseline,getScenario('full-28'));campaignQuarterEnd(other,getScenario('full-28'));
 const rumors=(state:RunState)=>state.evidence.filter(e=>e.sourceId==='rumor');assert.deepEqual(rumors(other),rumors(baseline));assert.equal(rumors(other).length,6);
});
test('all eight ending predicates have causal witnesses and overlap precedence is explicit',()=>{
 const scenario=getScenario('full-28');
 const fresh=()=>createRun('ending-boundary','full-28');
 let s=fresh();s.quarter=27;assert.equal(endingCandidates(s,scenario)[0],'multipolar-balance');
 s=fresh();s.quarter=27;s.actors.deepcent.capability=26;s.actors.deepcent.safety=14;s.actors.deepcent.belief.posterior=Array.from({length:20},(_,i)=>i===19?1:0);assert.equal(endingCandidates(s,scenario)[0],'safe-lead');
 s.actors.deepcent.safety=0;assert.equal(endingCandidates(s,scenario)[0],'winner-takes-all');
 s=fresh();s.quarter=27;s.actors.openbrain.capability=22;assert.equal(endingCandidates(s,scenario)[0],'left-behind');
 s=fresh();s.campaign!.hidden.breakout={actorId:'openbrain',quarter:0,discovered:false};assert.ok(!endingCandidates(s,scenario).includes('loss-of-control'));
 s.quarter=2;campaignQuarterEnd(s,scenario);assert.equal(endingCandidates(s,scenario)[0],'loss-of-control');
 s=fresh();s.campaign!.treaty={establishedQuarter:0,members:Object.keys(s.actors),quietQuarters:4,defections:[]};Object.values(s.actors).forEach(a=>a.strategy!.pledgeUntil=4);assert.equal(endingCandidates(s,scenario)[0],'coordinated-slowdown');
 registerTraining(s,scenario,s.actors.deepcent,train as Extract<Action,{type:'train'}>);assert.ok(!endingCandidates(s,scenario).includes('failed-slowdown'));
 s.actors.deepcent.capability+=4;campaignQuarterEnd(s,scenario);assert.equal(endingCandidates(s,scenario)[0],'failed-slowdown');
 s=fresh();s.actors.deepcent.capability=30;s.quarter=1;
 const paradigm:Extract<Action,{type:'train'}>={type:'train',scale:'small',method:'rl',focuses:['reasoning','agency']};
 registerTraining(s,scenario,s.actors.deepcent,paradigm);assert.equal(s.campaign!.verification.invalidatedBy,null);
 s.campaign!.verification.establishedQuarter=0;s.campaign!.verification.coverage=1;completeParadigm(s,'deepcent',0);
 assert.equal(endingCandidates(s,scenario)[0],'verification-broken');s.campaign!.hidden.breakout={actorId:'deepcent',quarter:1,discovered:true};assert.equal(endingCandidates(s,scenario)[0],'loss-of-control');
});
test('checkpoints recover accepted revision, retain prior checkpoint, and exclude concurrent writers',()=>{
 const dir=mkdtempSync(join(tmpdir(),'race-checkpoints-'));
 try {
  let service=new RunService(dir);const created=service.create('durable');assert.equal(created.ok,true);
  assert.throws(()=>new RunService(dir),/another live session/);
  const command={actorId:created.actorId!,expectedRevision:0,idempotencyKey:'durable',payload:{type:'take_action',action:train} as CommandPayload};
  assert.equal(service.command(created.runId!,command).ok,true);service.close();
  service=new RunService(dir);assert.equal(service.inspect(created.runId!,'view').revision,1);
  assert.equal(service.command(created.runId!,command).ok,true);assert.equal(service.inspect(created.runId!,'view').revision,1);
  assert.equal(resumeRun(readFileSync(join(dir,'run-1.json.previous'),'utf8')).revision,1);service.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('CLI exposes complete control surface and human wildcard review',async()=>{
 const session=new CliSession();session.start('cli-campaign');
 for(const line of ['quarter','build texas small grid distributed','fund external 20','announce slowdown deepcent true','end','investigate racing openbrain','belief-target racing openbrain 0.8','conceal 1 secure 1','end']) assert.doesNotMatch((await session.line(line)).text,/^(Rejected|Error)/,line);
 assert.doesNotMatch((await session.line('wildcard-propose "purchase" capacity 4 12 0 permanent 1 physical')).text,/^(Rejected|Error)/);
 const view=session.inspect('view').data as ReturnType<typeof getView>;const id=view.campaign!.proposals[0].id;
 assert.doesNotMatch((await session.line(`wildcard-accept ${id} "Explicit human test approval"`)).text,/^(Rejected|Error)/);
 assert.doesNotMatch((await session.line(`wildcard-apply ${id}`)).text,/^(Rejected|Error)/);
});

test('paired sensitivity changes only the declared prior or observation mechanism, with the same hidden draw',()=>{
 const base=createRun('paired-assumption','full-28');const skeptical=createRun('paired-assumption','full-28-skeptical');const lessVisible=createRun('paired-assumption','full-28-low-detection');
 assert.equal(base.hidden.controlEffectiveness,skeptical.hidden.controlEffectiveness);assert.equal(base.hidden.controlEffectiveness,lessVisible.hidden.controlEffectiveness);
 assert.notDeepEqual(base.actors.deepcent.belief.prior,skeptical.actors.deepcent.belief.prior);
 assert.deepEqual(base.actors.deepcent.strategy!.beliefs['openbrain:racing'].prior,skeptical.actors.deepcent.strategy!.beliefs['openbrain:racing'].prior);
 const baseDetection=listActions(base,train)[0].detectionEstimates[0].probability;
 assert.equal(listActions(lessVisible,train)[0].detectionEstimates[0].probability,baseDetection/2);
 assert.equal(listActions(lessVisible,{type:'ship',model:'own'})[0].detectionEstimates[0].probability,1);
});

test('rival insolvency suspends operations instead of silently forgiving unpaid upkeep',()=>{
 let s=createRun('insolvent-rival','full-28');const actor=s.actors.openbrain;
 actor.cash=0;actor.revenue=0;actor.strategy!.parentBudget=0;
 // Controlled counterfactual fixture tests the accounting boundary, not a replay artifact.
 s=commit(s,{type:'end_turn'});
 assert.equal(s.actors.openbrain.strategy!.insolvent,true);
 assert.equal(s.actors.openbrain.compute,0);assert.equal(s.actors.openbrain.revenue,0);
 assert.equal(s.plans.openbrain.items[0].choice,'hold');
});

test('a later detected frontier escape reveals loss of control despite an earlier undetected breakout',()=>{
 let exercised=false;
 for(let n=0;n<30;n++) {
  let state=createRun(`second-breakout:${n}`,'full-28');state.actors.deepcent.capability=40;state.actors.deepcent.safety=0;
  state.campaign!.hidden.breakout={actorId:'openbrain',quarter:0,discovered:false};
  state=commit(state,{type:'take_action',action:{type:'ship',model:'own'}});state=commit(state,{type:'end_turn'});
  const incident=state.traces.find(t=>t.actorId==='deepcent'&&t.kind==='private-incident')!.details;
  if(incident.success&&incident.detected) {assert.equal(state.report?.kind,'loss-of-control');assert.equal(state.campaign!.hidden.breakout!.discovered,true);exercised=true;break;}
 }
 assert.ok(exercised,'bounded seeded fixture did not exercise the detected escape');
});

test('Respond can force a feasible expansion response while replacing evidence exactly once',()=>{
 let s=createRun('respond-build','full-28');const evidenceId=getFeed(s).find(e=>e.canRespond)!.id;
 s=commit(s,{type:'respond_to_evidence',evidenceId,response:{type:'build',regionId:'texas',scale:'small',power:'grid',layout:'distributed'}});
 assert.equal(s.movesUsed,1);assert.equal(s.interventions[0].action.type,'build');assert.equal(s.interventions[0].forcedByEvidence,evidenceId);
 assert.equal(s.evidence.find(e=>e.id===evidenceId)!.receptivity,1);
 assert.equal(s.actors.deepcent.belief.evidenceIds.filter(id=>id===evidenceId).length,1);
 s=commit(s,{type:'end_turn'});assert.ok(s.projects.some(p=>p.actorId===s.playerId&&p.kind==='build'));
});
