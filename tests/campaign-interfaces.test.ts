import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createRun, getView, execute, saveRun, resumeRun } from '../src/engine.js';
import { canonical } from '../src/numeric.js';
import { runStrategy } from '../scripts/campaign-witnesses.js';
import type { ServiceResult } from '../src/service.js';
import type { CommandPayload } from '../src/types.js';

test('full MCP campaign agrees with engine through interruption, recovery and terminal replay', async()=>{
 const dir=await mkdtemp(join(tmpdir(),'race-full-mcp-'));
 let client:Client;
 const connect=async()=>{
  client=new Client({name:'full-campaign-check',version:'1.0'});
  await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/mcp.ts'],cwd:process.cwd(),stderr:'pipe',env:{...Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined)),LAST_RACE_SESSION_DIR:dir}}));
 };
 const call=async(name:string,args:Record<string,unknown>)=>{
  const raw=await client.callTool({name,arguments:args}); const r=raw.structuredContent as unknown as ServiceResult;
  assert.equal(r?.ok,true,JSON.stringify(raw));return r;
 };
 try {
  await connect();
  const names=(await client!.listTools()).tools.map(t=>t.name);
  for(const name of ['preview_quarter','decide_wildcard','apply_wildcard','list_runs','get_final_reveal'])assert.ok(names.includes(name));
  const seed='campaign:2';const transcript=runStrategy(seed,'balance');let state=createRun(seed,'full-28');
  const created=await call('create_run',{seed});const runId=created.runId!;
  for(const command of transcript.log) {
   const {type,...params}=command.payload;
   const result=await call(type,{runId,actorId:command.actorId,expectedRevision:command.expectedRevision,idempotencyKey:command.idempotencyKey,...params});
   state=execute(state,command).state;
   assert.equal(canonical((result.data as {view:unknown}).view),canonical(getView(state)));
   if(state.revision===5) {
    await client!.close();await connect();
    const recovered=await call('list_runs',{});assert.ok((recovered.data as Array<{runId:string}>).some(r=>r.runId===runId));
    assert.equal((await call('get_view',{runId})).revision,5);
   }
  }
  assert.equal(state.phase,'ended');assert.equal(canonical(state),canonical(transcript));
  const saved=await call('save_run',{runId});const serialized=(saved.data as {serialized:string}).serialized;
  assert.equal(canonical(resumeRun(serialized)),canonical(state));
  await call('get_final_reveal',{runId});
  const ended=await client!.callTool({name:'end_turn',arguments:{runId,actorId:state.playerId,expectedRevision:state.revision,idempotencyKey:'after-ending'}});assert.equal(ended.isError,true);
  // Exercise the formerly missing compute ruling through real tool schemas too.
  const fresh=await call('create_run',{seed:'owner-first'});let revision=0;const id=fresh.runId!;
  const issue=async(payload:CommandPayload)=>{
   const {type,...params}=payload;const r=await call(type,{runId:id,actorId:fresh.actorId,expectedRevision:revision,idempotencyKey:`tool:${revision}`,...params});revision=r.revision!;return r;
  };
  await issue({type:'take_action',action:{type:'train',scale:'small',method:'pretraining',focuses:['reasoning','coding']}});
  await issue({type:'take_action',action:{type:'ship',model:'own'}});
  const proposed=await issue({type:'propose_wildcard',proposal:'Purchase capacity',ruling:{effect:'capacity',amount:4,price:12,delay:0,duration:null,upkeep:1,visibility:'physical'}});
  const proposalId=(proposed.data as {view:ReturnType<typeof getView>}).view.campaign!.proposals[0].id;
  await issue({type:'decide_wildcard',proposalId,decision:'accept',humanApproval:'Explicit synthetic human test approval'});
  await issue({type:'apply_wildcard',proposalId});await call('preview_quarter',{runId:id});await issue({type:'end_turn'});
  for(const action of [{type:'build',regionId:'texas',scale:'small',power:'grid',layout:'distributed',concealment:1},{type:'fund',source:'parent',amount:20},{type:'announce',claim:'slowdown',targetId:'deepcent',value:true}] as const) await issue({type:'take_action',action});
  await issue({type:'end_turn'});
  await issue({type:'take_action',action:{type:'investigate',topic:'racing',targetId:'openbrain'}});
  await issue({type:'override_belief',topic:'racing',targetId:'openbrain',conviction:0.7});
  const feed=(await call('get_feed',{runId:id})).data as Array<{id:string;canRespond:boolean}>;
  await issue({type:'respond_to_evidence',evidenceId:feed.find(e=>e.canRespond)!.id,response:{type:'secure',amount:1,concealment:2}});
  await issue({type:'end_turn'});
 }finally{await client!?.close();await rm(dir,{recursive:true,force:true});}
});
