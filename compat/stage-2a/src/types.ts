export type Topic = 'control';
export type Visibility = 'public' | 'physical' | 'covert' | 'internal';
export type Focus = 'reasoning' | 'coding' | 'science' | 'agency';
export type Action =
  | { type: 'train'; scale: 'small' | 'large'; method: 'pretraining' | 'rl'; focuses: [Focus, Focus] }
  | { type: 'ship'; model: 'own' | 'third-party' }
  | { type: 'secure'; amount: 1 | 2 }
  | { type: 'investigate'; topic: Topic };
export type ResponseAction = Extract<Action, { type: 'secure' | 'investigate' }>;
export type CommandPayload =
  | { type: 'take_action'; action: Action }
  | { type: 'override_plan_item'; itemId: string; choice: 'veto' | 'lease' | 'product' | 'safety' }
  | { type: 'override_belief'; topic: Topic; conviction: number | null }
  | { type: 'respond_to_evidence'; evidenceId: string; response: ResponseAction }
  | { type: 'end_turn' };
export interface Command { actorId: string; idempotencyKey: string; expectedRevision: number; payload: CommandPayload }
export interface Grid { id: Topic; label: string; support: number[]; binEdges: number[]; prior: number[] }
export interface Evidence {
  id: string; independentKey: string; quarter: number; availableQuarter: number;
  observerId: string; sourceId: string; topic: Topic; summary: string;
  likelihood: number[]; credibility: number; ambiguity: number; receptivity: number;
  visibility: Visibility; detected: boolean; flagged: boolean; processed: boolean;
  status: 'undetected' | 'pending' | 'discounted' | 'noted' | 'acted-on';
}
export interface BeliefOverride { topic: Topic; conviction: number; startQuarter: number; expiresQuarter: number }
export interface BeliefState { prior: number[]; posterior: number[]; evidenceIds: string[]; override: BeliefOverride | null; diagnostics: string[] }
export interface Actor {
  id: string; name: string; cash: number; compute: number; capability: number;
  product: number; safety: number; revenue: number; influence: number;
  receptivity: number; switchingCost: number; intelligence: number;
  weights: { revenue: number; capability: number; safety: number; mission: number };
  lastRoutine: RoutineChoice; belief: BeliefState;
}
export type RoutineChoice = 'hold' | 'lease' | 'product' | 'safety';
export interface PlanItem { id: string; choice: RoutineChoice; cashCost: number; computeCost: number; score: number; reason: string; overridden: boolean }
export interface Plan { actorId: string; quarter: number; items: PlanItem[]; cashCommitted: number; computeCommitted: number; conflicts: string[]; explanation: string }
export interface Project { id: string; actorId: string; kind: 'train'; createdQuarter: number; remaining: number; gain: number; focuses: [Focus, Focus] }
export interface Intervention { id: string; actorId: string; action: Action; cashCost: number; computeCost: number; forcedByEvidence?: string }
export interface Trace { id: string; quarter: number; actorId: string; kind: string; summary: string; details: Record<string, unknown> }
export interface Scenario {
  id: string; version: string; modelVariant: string; title: string; horizon: number;
  provenance: { kind: 'synthetic'; note: string; sources: string[] };
  grid: Grid; actors: Array<Omit<Actor, 'belief'>>;
  openingCashCost: number; openingCompute: number;
  costs: { trainSmall: number; trainLarge: number; ship: number; secureUnit: number; investigate: number; lease: number; product: number; safety: number };
  riskTable: Array<[number, number]>;
}
export interface ReplayIdentity { engineHash: string; scenarioHash: string; numericalVersion: string; modelVariant: string; seed: string; scenarioId: string }
export interface RunState {
  formatVersion: 1; identity: ReplayIdentity; revision: number; quarter: number;
  phase: 'planning' | 'ended'; playerId: string; movesUsed: number;
  actors: Record<string, Actor>; plans: Record<string, Plan>; projects: Project[];
  interventions: Intervention[]; evidence: Evidence[]; traces: Trace[];
  hidden: { controlEffectiveness: number; incidents: number; undetectedIncidents: number };
  log: Command[]; receipts: Record<string, { fingerprint: string; revision: number }>;
  report: HorizonReport | null;
}
export interface HorizonReport { kind: 'prototype-horizon' | 'insolvent'; labViability: string; influence: string; societalOutcome: string; caveat: string }
export interface CommandResult { ok: boolean; state: RunState; data?: Record<string, unknown>; error?: { code: string; message: string } }
