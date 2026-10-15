import { createRun, execute, listActions } from '../src/engine.js';
import type { Action, CommandPayload, RunState } from '../src/types.js';
export function commit(state: RunState, payload: CommandPayload): RunState {
 const result=execute(state,{actorId:state.playerId,expectedRevision:state.revision,idempotencyKey:`witness:${state.revision}`,payload});
 if (!result.ok) throw new Error(result.error?.message); return result.state;
}
export type Strategy = 'idle'|'repeat-ship'|'balance'|'safe'|'race'|'paradigm'|'slowdown'|'defect'|'overbuild';
export function runStrategy(seed:string, strategy:Strategy, scenarioId='full-28'):RunState {
 let s=createRun(seed,scenarioId);
 while(s.phase==='planning') {
  const a=s.actors[s.playerId];
  const desired:Action[]=[];
  if (strategy==='overbuild') { if(s.quarter===0) desired.push(...Array.from({length:3},()=>({type:'build' as const,regionId:'texas',scale:'large' as const,power:'grid' as const,layout:'concentrated' as const}))); }
  else if (strategy==='repeat-ship') desired.push({type:'ship',model:'own'},{type:'ship',model:'own'},{type:'ship',model:'own'});
  else if(strategy!=='idle') {
   if (a.cash<35) desired.push({type:'fund',source:'parent',amount:20});
   if (strategy==='slowdown' || strategy==='defect') {
    if (s.quarter%3===0) desired.push({type:'announce',claim:'slowdown',targetId:a.id,value:true});
    if (strategy==='defect' && s.campaign!.treaty.establishedQuarter!==null) desired.push({type:'train',scale:'small',method:'pretraining',focuses:['reasoning','coding']});
    else desired.push({type:'announce',claim:'racing',targetId:'xspace',value:false});
   } else {
    const target = strategy==='balance'?18:strategy==='safe'?26:strategy==='paradigm'?38:38;
    if (a.capability<target && a.cash>22) desired.push({type:'train',scale:'small',method:strategy==='paradigm' && a.capability>=30?'rl':'pretraining',focuses:strategy==='paradigm' && a.capability>=30?['reasoning','agency']:['reasoning','coding']});
    if ((s.quarter<2 || a.capability>a.strategy!.lastLaunchCapability+4) && a.capability<24 && a.revenue<25 && a.cash>30) desired.push({type:'ship',model:'own'});
   }
   if (strategy==='race' && a.safety<8) desired.unshift({type:'secure',amount:1});
   if (strategy==='safe' && a.safety<16) desired.unshift({type:'secure',amount:1});
   if (strategy==='safe') desired.push({type:'investigate',topic:'control'});
  }
  for (const action of desired) {
   try { if(listActions(s,action)[0].feasible) s=commit(s,{type:'take_action',action}); } catch { /* unavailable ordinary choice; retain resources */ }
  }
  s=commit(s,{type:'end_turn'});
 }
 return s;
}
