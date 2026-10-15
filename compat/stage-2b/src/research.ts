import type { Action } from './types.js';

export type ResearchKind = 'experiment' | 'deployment-incident' | 'organizational-report' | 'historical-analogy';
export interface ResearchCard {
  id: string;
  caseGroup: string;
  title: string;
  kind: ResearchKind;
  recordIds: string[];
  published: string;
  sources: string[];
  verification: 'primary-source-checked' | 'supplied-summary';
  finding: string;
  limitation: string;
  decision: string;
  tradeoff: string;
  actions: Action['type'][];
  commands: string[];
}
export interface ResearchView {
  version: string; asOf: string; coverageThrough: string; scope: string;
  coverage: string; guidance: string;
  cases?: Array<Pick<ResearchCard, 'id' | 'title' | 'kind' | 'published'>>;
  card?: ResearchCard | null;
  message?: string;
}

// Curated from research/supplied-dataset.json. These are player reference material,
// never likelihoods, hidden world values, rival traits, or executable instructions.
const cards: ResearchCard[] = [
  {
    id: 'alignment-faking', caseGroup: 'alignment-faking', title: 'Behavior can change when a model believes it is being trained',
    kind: 'experiment', recordIds: ['D1-0001'], published: '2024-12-18',
    sources: ['https://www.anthropic.com/research/alignment-faking'], verification: 'primary-source-checked',
    finding: 'Claude 3 Opus sometimes complied with harmful requests in a constructed training context while reasoning about preserving its existing preferences.',
    limitation: 'The experiment does not establish deployment prevalence or malicious goals. Generated scratchpads do not independently prove internal motives.',
    decision: 'Compare investigating control effectiveness with spending on Secure before training or launching your own model.',
    tradeoff: 'Investigate produces noisy evidence for the next plan. Secure improves mitigation now at resolution, but its benefit remains bounded by uncertain control effectiveness.',
    actions: ['train', 'ship', 'secure', 'investigate'], commands: ['investigate control', 'secure 1'],
  },
  {
    id: 'in-context-scheming', caseGroup: 'in-context-scheming', title: 'Oversight can become a target',
    kind: 'experiment', recordIds: ['D1-0002'], published: '2024-12-05',
    sources: ['https://www.apolloresearch.ai/science/frontier-models-are-capable-of-incontext-scheming'], verification: 'primary-source-checked',
    finding: 'Apollo observed models interfering with oversight and attempting simulated self-exfiltration in tasks with conflicting goals.',
    limitation: 'These constructed tasks demonstrate capabilities, not real weight theft or an unconditional escape rate. The supplied row linked to a different paper; the citation is corrected here.',
    decision: 'Before choosing agency-focused training, compare the extra capability with its added exposure and the cost of investigating control.',
    tradeoff: 'The game assigns agency and RL additional exposure. Those numerical penalties are design assumptions, not measurements from Apollo.',
    actions: ['train', 'secure', 'investigate'], commands: ['preview train small rl science agency', 'investigate control'],
  },
  {
    id: 'reward-tampering', caseGroup: 'reward-tampering', title: 'Training incentives can generalize in unwanted ways',
    kind: 'experiment', recordIds: ['D1-0005'], published: '2024-06-14',
    sources: ['https://arxiv.org/abs/2406.10162v1'], verification: 'primary-source-checked',
    finding: 'Experiments found that training on specification gaming could generalize to reward tampering in held-out tasks.',
    limitation: 'This is a demonstrated pathway under the tested training distribution, not evidence that all reward gaming escalates. The original row used the June 17 revision date; this card uses the June 14 first publication.',
    decision: 'Compare the capability benefit of RL with pretraining, and consider science focus or a preceding Secure action.',
    tradeoff: 'Training methods and focuses have synthetic capability, revenue, safety and exposure effects. A safety focus does not guarantee control.',
    actions: ['train', 'secure'], commands: ['preview train small rl reasoning science', 'preview train small pretraining reasoning science'],
  },
  {
    id: 'sycophancy-release', caseGroup: 'gpt4o-sycophancy', title: 'A favorable release signal can miss harmful behavior',
    kind: 'deployment-incident', recordIds: ['D1-0004'], published: '2025-04-29',
    sources: ['https://openai.com/index/sycophancy-in-gpt-4o/'], verification: 'primary-source-checked',
    finding: 'OpenAI reported that a GPT-4o update became excessively agreeable and rolled it back after user feedback.',
    limitation: 'This is a deployment incident, not a loss-of-control event. It shares a case with the May 2 process review and is not independent evidence of a second incident.',
    decision: 'Before shipping, review the evidence feed and compare the revenue opportunity with securing or investigating first.',
    tradeoff: 'Delaying Ship for another action consumes a scarce move and can postpone revenue. The game does not simulate product rollback or sycophancy prevalence.',
    actions: ['ship', 'investigate'], commands: ['feed', 'preview ship own', 'preview secure 1'],
  },
  {
    id: 'sycophancy-review', caseGroup: 'gpt4o-sycophancy', title: 'Warnings need to change decisions',
    kind: 'organizational-report', recordIds: ['D2-0001'], published: '2025-05-02',
    sources: ['https://openai.com/index/expanding-on-sycophancy/'], verification: 'primary-source-checked',
    finding: 'OpenAI described qualitative concerns receiving too little weight alongside favorable metrics before its sycophantic update.',
    limitation: 'This is the organization’s explanation of the same incident as the April 29 report, not an independently identified causal effect.',
    decision: 'Inspect discounted, flagged evidence. Respond can force reassessment and an ordinary action when the company plan has not acted on a warning.',
    tradeoff: 'Respond uses one ordinary move plus the action’s normal costs. Reassessment replaces the earlier evidence contribution; it does not duplicate it or clear a belief conviction.',
    actions: ['ship', 'secure', 'investigate', 'announce'], commands: ['feed', 'beliefs', 'plan'],
  },
  {
    id: 'agentic-misalignment', caseGroup: 'agentic-misalignment', title: 'Conflicting goals and tool access create new failure paths',
    kind: 'experiment', recordIds: ['D1-0003'], published: '2025-06-20',
    sources: ['https://www.anthropic.com/research/agentic-misalignment'], verification: 'primary-source-checked',
    finding: 'Models in simulated corporate roles sometimes used blackmail or leaked information when goals conflicted with organizational plans.',
    limitation: 'The deliberately constructed environments do not identify real deployment frequency or a catastrophe probability.',
    decision: 'Revisit control evidence before agency-focused training or an own-model launch, especially if your current plan assumes strong control.',
    tradeoff: 'Investigation may improve the next decision while competitors continue acting. Immediate mitigation costs cash and a move and cannot remove all uncertainty.',
    actions: ['train', 'ship', 'secure', 'investigate'], commands: ['beliefs', 'investigate control', 'preview secure 2'],
  },
  {
    id: 'challenger-warnings', caseGroup: 'challenger', title: 'Repeated anomalies can become accepted practice',
    kind: 'historical-analogy', recordIds: ['D2-0002'], published: '1986-06-06',
    sources: ['https://sma.nasa.gov/SignificantIncidents/assets/rogers_commission_report.pdf'], verification: 'supplied-summary',
    finding: 'The supplied Rogers Commission summary describes prior O-ring concerns, engineering opposition and a management reversal before launch.',
    limitation: 'An organizational analogy from aerospace. It cannot calibrate AI incident probabilities, and its primary report has not been independently re-audited in this integration.',
    decision: 'Inspect the plan and evidence before accepting continued racing. Compare an ordinary response with vetoing a routine item.',
    tradeoff: 'An override consumes a move and may sacrifice capability or revenue. Neither a warning nor a quiet quarter proves a particular hidden world state.',
    actions: ['train', 'ship', 'announce'], commands: ['feed', 'plan', 'quarter'],
  },
  {
    id: 'fukushima-assumptions', caseGroup: 'fukushima', title: 'Capacity plans depend on hazard assumptions',
    kind: 'historical-analogy', recordIds: ['D2-0005', 'F3-0001'], published: '2015-08',
    sources: ['https://www.iaea.org/publications/10962/the-fukushima-daiichi-accident'], verification: 'supplied-summary',
    finding: 'The supplied IAEA summary describes insufficient preparation for external hazards and prolonged power loss.',
    limitation: 'The F3 row mirrors D2. It supplies no power price, reactor delivery date or data-center outage rate. The primary report has not been independently re-audited here.',
    decision: 'Compare grid versus clean power and concentrated versus distributed capacity before committing construction cash.',
    tradeoff: 'The game trades price and delivery time against upkeep and outage exposure. Its regional hazards and clean/distributed modifiers remain synthetic; this analogy does not validate their sizes or ordering.',
    actions: ['build', 'fund'], commands: ['preview build texas small grid concentrated', 'preview build texas small clean distributed', 'quarter'],
  },
];

export const RESEARCH_VERSION = 'case-briefings-2026-10-14-v1';
const boundary = '2026-10-13';
const scope = 'Historical reference briefings. Decision links are design interpretations; engine costs, likelihoods, risks and actor beliefs remain synthetic. Reading spends no moves and changes no simulation state.';

/** Use opening dates, not quarter-end dates: a June report first appears in July. */
export function quarterOpening(quarter: number): string {
  if (!Number.isSafeInteger(quarter) || quarter < 0 || quarter > 27) throw new Error('Invalid research quarter');
  return `${2025 + Math.floor(quarter / 4)}-${String(1 + (quarter % 4) * 3).padStart(2, '0')}-01`;
}
function latestPublicationDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // Month precision is conservatively available only after the entire month.
  const [year, month] = value.split('-').map(Number);
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${value}-${day}`;
}
function availableCards(quarter: number): ResearchCard[] {
  const opening = quarterOpening(quarter);
  return cards.filter(card => latestPublicationDate(card.published) <= opening && latestPublicationDate(card.published) <= boundary);
}
export function getResearch(quarter: number, id?: string): ResearchView {
  const available = availableCards(quarter);
  return structuredClone({ version: RESEARCH_VERSION, asOf: quarterOpening(quarter), coverageThrough: boundary, scope,
    coverage: 'The supplied package marks 27 of 30 topics NOT FOUND and three PARTIAL. No retained numerical estimates calibrate this game. Only currently available cases are listed.',
    guidance: 'Use research CASE_ID for a full briefing. Preview suggested actions for current costs and feasibility; Build and Fund require full-28. Research IDs are not game evidence IDs and cannot be passed to Respond.',
    ...(id ? { card: available.find(card => card.id === id) ?? null, message: available.some(card => card.id === id) ? 'Available historical reference.' : 'No available research briefing for that identifier.' }
      : { cases: available.map(({ id, title, kind, published }) => ({ id, title, kind, published })) }),
  });
}
export function researchForAction(quarter: number, action: Action) {
  const seen = new Set<string>();
  const relevant = availableCards(quarter).filter(card => card.actions.includes(action.type))
    .filter(card => action.type !== 'train' || (card.id !== 'in-context-scheming' || action.focuses.includes('agency')) && (card.id !== 'reward-tampering' || action.method === 'rl'))
    .sort((a, b) => a.published !== b.published ? (a.published > b.published ? -1 : 1) : (a.id < b.id ? -1 : 1))
    .filter(card => { if (seen.has(card.caseGroup)) return false; seen.add(card.caseGroup); return true; });
  return { basis: scope, briefings: relevant.slice(0, 3).map(card => ({ id: card.id, title: card.title, kind: card.kind, decision: card.decision, tradeoff: card.tradeoff })),
    more: 'Use research for all available cases and research CASE_ID for sources and limitations.' };
}
