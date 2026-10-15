export type Topic = 'control' | 'racing' | 'capability' | 'safety' | 'credibility';
export type Visibility = 'public' | 'physical' | 'covert' | 'internal';
export type Focus = 'reasoning' | 'coding' | 'science' | 'agency';
export type Action =
  | { type: 'train'; scale: 'small' | 'large'; method: 'pretraining' | 'rl'; focuses: [Focus, Focus]; concealment?: 0 | 1 | 2 }
  | { type: 'ship'; model: 'own' | 'third-party' }
  | { type: 'secure'; amount: 1 | 2; concealment?: 0 | 1 | 2 }
  | { type: 'investigate'; topic: Topic; targetId?: string }
  | { type: 'build'; regionId: string; scale: 'small' | 'large'; power: 'grid' | 'clean'; layout: 'concentrated' | 'distributed'; concealment?: 0 | 1 | 2 }
  | { type: 'fund'; source: 'parent' | 'external'; amount: 20 | 40 }
  | { type: 'announce'; claim: 'racing' | 'safety' | 'slowdown'; targetId: string; value: boolean }
  | { type: 'wildcard'; ruling: WildcardRuling };
export type ResponseAction = Exclude<Action, { type: 'wildcard' }>;
export type CommandPayload =
  | { type: 'take_action'; action: Action }
  | { type: 'override_plan_item'; itemId: string; choice: 'veto' | 'lease' | 'product' | 'safety' }
  | { type: 'override_belief'; topic: Topic; targetId?: string; conviction: number | null }
  | { type: 'respond_to_evidence'; evidenceId: string; response: ResponseAction }
  | { type: 'propose_wildcard'; proposal: string; ruling: WildcardRuling }
  | { type: 'decide_wildcard'; proposalId: string; decision: 'accept' | 'reject'; humanApproval: string }
  | { type: 'apply_wildcard'; proposalId: string }
  | { type: 'end_turn' };
export interface Command { actorId: string; idempotencyKey: string; expectedRevision: number; payload: CommandPayload }
export interface Grid { id: Topic; label: string; support: number[]; binEdges: number[]; prior: number[] }
export interface Evidence {
  id: string; independentKey: string; quarter: number; availableQuarter: number;
  observerId: string; sourceId: string; topic: Topic; targetId?: string; summary: string;
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
  lastRoutine: RoutineChoice; belief: BeliefState; strategy?: CompanyStrategy;
}
export type RoutineChoice = 'hold' | 'lease' | 'product' | 'safety';
export interface PlanItem { id: string; choice: RoutineChoice; cashCost: number; computeCost: number; score: number; reason: string; overridden: boolean }
export interface Plan { actorId: string; quarter: number; items: PlanItem[]; cashCommitted: number; computeCommitted: number; conflicts: string[]; explanation: string }
export type Project = { id: string; actorId: string; createdQuarter: number; remaining: number } & ({ kind: 'train'; gain: number; focuses: [Focus, Focus]; paradigm?: boolean } | { kind: 'build'; asset: Asset });
export interface Intervention { id: string; actorId: string; action: Action; cashCost: number; computeCost: number; forcedByEvidence?: string }
export interface Trace { id: string; quarter: number; actorId: string; kind: string; summary: string; details: Record<string, unknown> }
export interface Scenario {
  id: string; version: string; modelVariant: string; title: string; horizon: number;
  provenance: { kind: 'synthetic'; note: string; sources: string[] };
  grid: Grid; actors: Array<Omit<Actor, 'belief'>>;
  openingCashCost: number; openingCompute: number;
  costs: { trainSmall: number; trainLarge: number; ship: number; secureUnit: number; investigate: number; lease: number; product: number; safety: number };
  campaign?: CampaignConfig;
  riskTable: Array<[number, number]>;
}
export interface ReplayIdentity { engineHash: string; scenarioHash: string; numericalVersion: string; modelVariant: string; seed: string; scenarioId: string }
export interface RunState {
  formatVersion: 2; identity: ReplayIdentity; revision: number; quarter: number;
  phase: 'planning' | 'ended'; playerId: string; movesUsed: number;
  actors: Record<string, Actor>; plans: Record<string, Plan>; projects: Project[];
  interventions: Intervention[]; evidence: Evidence[]; traces: Trace[];
  hidden: { controlEffectiveness: number; incidents: number; undetectedIncidents: number };
  campaign: CampaignState | null;
  log: Command[]; receipts: Record<string, { fingerprint: string; revision: number }>;
  report: HorizonReport | null;
}
export interface HorizonReport { kind: 'prototype-horizon' | 'insolvent' | Ending; mechanism?: string; labViability: string; influence: string; societalOutcome: string; caveat: string }
export interface CommandResult { ok: boolean; state: RunState; data?: Record<string, unknown>; error?: { code: string; message: string } }

export type Ending = 'safe-lead' | 'multipolar-balance' | 'coordinated-slowdown' | 'winner-takes-all' | 'loss-of-control' | 'left-behind' | 'failed-slowdown' | 'verification-broken';
export interface Region { id: string; name: string; jurisdiction: 'us' | 'china'; power: number; cost: number; delay: number; upkeep: number; hazard: number }
export interface Asset { id: string; regionId: string; capacity: number; upkeep: number; power: 'grid' | 'clean'; layout: 'concentrated' | 'distributed'; availableQuarter: number; expiresQuarter: number | null }
export interface Obligation { id: string; payment: number; startQuarter: number; endQuarter: number; source: 'parent' | 'external' }
export interface CompanyStrategy {
  assets: Asset[]; obligations: Obligation[]; beliefs: Record<string, BeliefState>;
  insolvent: boolean; parentBudget: number; racingPressure: number; expectedRivalCapability: number; expectedRivalSafety: number;
  pledgeUntil: number; lastLaunchCapability: number; launches: number;
}
export interface WildcardRuling {
  effect: 'capacity' | 'cash' | 'safety'; amount: number; price: number;
  delay: number; duration: number | null; upkeep: number; visibility: 'public' | 'physical' | 'covert';
}
export interface WildcardProposal { id: string; proposal: string; ruling: WildcardRuling; quarter: number; status: 'proposed' | 'accepted' | 'rejected' | 'applied'; humanApproval: string | null }
export interface Government { id: 'us' | 'china'; name: string; budget: number; monitoring: number; stance: 'growth' | 'verify'; policy: Actor }
export interface Claim { id: string; speakerId: string; targetId: string; claim: 'racing' | 'safety' | 'slowdown'; value: boolean; quarter: number; settlesQuarter: number; settled: boolean }
export interface CampaignConfig {
  regions: Region[]; strategicPrior: number[]; detectionMultiplier: number; marketCap: number; frontier: number; dominanceGap: number; safeSafety: number;
  verificationThreshold: number; paradigmThreshold: number; slowdownQuarters: number;
  precedence: Ending[]; rumorPropensities: number[];
}
export interface CampaignState {
  governments: Government[]; proposals: WildcardProposal[]; wildcardUsed: boolean;
  claims: Claim[]; trust: Record<string, number>; monitoring: Array<{ observerId: string; targetId: string; quarter: number }>;
  treaty: { establishedQuarter: number | null; members: string[]; quietQuarters: number; defections: Array<{ actorId: string; quarter: number; startCapability: number; consequential: boolean }> };
  verification: { establishedQuarter: number | null; coverage: number; invalidatedBy: string | null };
  pendingEffects: Array<{ id: string; actorId: string; ruling: WildcardRuling; availableQuarter: number }>;
  hidden: { rumorPropensity: number; breakout: { actorId: string; quarter: number; discovered: boolean } | null };
}
