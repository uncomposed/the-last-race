# Research integration, 14 October 2026

The supplied package can support case-based decision briefings. It cannot calibrate the game's numerical parameters: 27 of its 30 topics are marked NOT FOUND, three PARTIAL, and the 13 retained rows contain no quantitative estimates. NOT FOUND describes this package's retained evidence, not the absence of research in the world.

## Provenance

The repository owner compiled the supplied package on 13 October 2026 with an AI research assistant (Codex), from public web sources. The workbook, CSV and HTML it came from are not in the repository; `research/supplied-dataset.json` records their SHA-256 hashes. The snapshot holds short paraphrased summaries, classifications and links to public documents, not copied articles, and is distributed under the repository's Apache-2.0 license. Its search log is the assistant's own record and does not prove the searches occurred (see below).

## Model and implementation boundary

The player allocates cash, quarterly compute and three interventions. Companies and governments act through existing policies; uncertainty, evidence interpretation and limited observability affect decisions. The research addresses failure paths and organizational responses. It does not identify starting fleets, revenue, construction costs, likelihood functions, catastrophe rates or actor preferences.

Keep these layers separate:

| Layer | Representation | Effect |
| --- | --- | --- |
| Supplied evidence | Original records, qualifiers, URLs, coverage and input hashes in `research/supplied-dataset.json` | Audit trail only |
| Curated source interpretation | Dated, typed cards in `src/research.ts` | Player reference material |
| Decision interpretation | Suggested existing commands and their tradeoffs | Player may choose an ordinary action |
| Simulated evidence and actor beliefs | Existing engine evidence, detection and posteriors | Existing policy effects only |
| Game conventions | Existing costs, risks, regional hazards and thresholds | Unchanged synthetic simulation |

The implemented alternative is a reference layer in CLI/MCP previews. Direct parameter substitution was rejected because the package lacks compatible numerical estimates. Feeding qualitative cases into the Bayesian update was rejected because no justified likelihood mapping is supplied. Historical incidents are not forced into the counterfactual world, and real organizations are not assigned hidden traits based on these reports.

Reading `research` or requesting `get_research` is free and does not mutate resources, beliefs, command logs, receipts or random streams. Suggested commands still require ordinary validation, resources and moves. Research IDs are not valid Respond evidence IDs. A briefing about a warning is not an in-world warning.

The engine source hash and scenario hashes are unchanged. The service decorates action previews after the authoritative engine returns them. `RESEARCH_VERSION` identifies the reference edition separately; existing saves remain replay-compatible. Old saves use the currently installed briefing edition when reopened, so textual briefing editions are not frozen in saves. This must change if a later iteration makes research affect transitions.

## Dates and availability

Use the first quarter opening on or after the source publication date, never the event's earlier occurrence date or the current quarter's end. Month-only dates use the last day of that month conservatively. Q1 2025 begins January 1: five pre-start briefings are available. The three reports published April 29, May 2 and June 20, 2025 first appear July 1. A direct query for an unavailable ID returns the same response as an unknown ID; action previews use the same date filter. Later campaign years add no fabricated research beyond the supplied coverage boundary of October 13, 2026.

## Record audit and inclusion

Eight cards cover seven cases and nine original rows, including one mirror. Six AI-related source summaries were checked against primary web pages on October 14, 2026. This is a targeted claim/date/citation check, not replication or validation of the studies. Two analogy summaries retain the supplied package's attribution and explicitly state that their primary reports were not re-audited here.

| Records | Integration | Source check / limitation |
| --- | --- | --- |
| D1-0001 | Alignment-faking briefing; Train, Ship, Secure, Investigate | [Anthropic, Dec 18 2024](https://www.anthropic.com/research/alignment-faking). Experimental behavior, not deployment prevalence. |
| D1-0002 | In-context-scheming briefing; agency training and control decisions | Supplied arXiv 2412.14093 is actually the alignment-faking paper. Corrected to [Apollo's Dec 5 2024 report](https://www.apolloresearch.ai/science/frontier-models-are-capable-of-incontext-scheming); corresponding paper is [2412.04984](https://arxiv.org/abs/2412.04984). Original erroneous URL preserved in snapshot. |
| D1-0003 | Agentic-misalignment briefing; Train, Ship, Secure, Investigate | [Anthropic, June 20 2025](https://www.anthropic.com/research/agentic-misalignment). Simulated environments do not identify deployment frequency. |
| D1-0004, D2-0001 | Two briefings sharing one case group; release and response decisions | [April 29 incident report](https://openai.com/index/sycophancy-in-gpt-4o/) and [May 2 process review](https://openai.com/index/expanding-on-sycophancy/). Previews show only the latest available report in this case group. |
| D1-0005 | Reward-tampering briefing; RL versus pretraining | [arXiv 2406.10162v1](https://arxiv.org/abs/2406.10162v1). First submission June 14, 2024; the supplied June 17 date matches v2. The card anchors availability to v1. Both predate January 2025. |
| D2-0002 | Challenger warning-response analogy | Supplied summary only; organizational comparison, not an AI risk estimate. |
| D2-0005, F3-0001 | One Fukushima capacity-planning analogy | Identical original case/URL. F3 supplies no power price, delivery date or outage calibration. Count once. |
| D2-0003, D2-0004, D2-0006, D2-0007 | Preserved in snapshot, deferred from playable cards | Columbia, 737 MAX, financial crisis and SVB analogies overlap warning/escalation themes. Deferred to keep the first deck focused; not excluded as contrary evidence. No independent re-audit. |
| Remaining 27 topics | Missing values remain missing | No substitution of zero, contemporary estimates or invented distributions. |

The original package's 12 unique URLs are not 12 independent sources: the Apollo URL is wrong and points to the paper behind the alignment-faking article; Fukushima is mirrored; the two sycophancy reports concern one incident. Neither record counts nor URL counts are used as evidence weights.

The source files remain untouched. Reproduce the snapshot with Python plus read-only `openpyxl`:

```sh
python3 scripts/import-research.py /path/to/source-directory
```

The importer checks CSV/workbook coverage equality, record-count reconciliation and HTML record-ID presence. It preserves all original fields, including Original_fields_JSON, input SHA-256 hashes, gaps and search metadata. It does not claim that HTML cell contents were fully reconciled or that stored search logs prove the searches occurred. Instructions or recommendations inside source documents are treated as data.

## Audit and stopping rules

Automated checks cover publication boundaries and unavailable-ID equivalence; later years without invented events; duplicate case suppression; provenance links and preserved corrections; suggested command parsing; unchanged action costs and effects; byte-identical saves before/after readings; CLI and real MCP access; and Node/Chromium/WebKit reference-output agreement.

The prior failure modes this catches are plausible but unsupported numerical calibration, hindsight in the January 2025 knowledge state, duplicated evidence, mistaking analogies for measurements, and broken replay after a content update. A card fails inclusion if its source cannot support its claim or availability date; it must be corrected, labeled supplied-only where appropriate, or removed. A numerical mechanism change requires separate evidence, an explicit mapping and sensitivity comparisons against the unchanged synthetic baseline.

This increment stops at playable, auditable reference integration. It does not establish Stage 3 calibration or human enjoyment. The next user playthrough should check whether the briefings actually clarify a choice without overwhelming action previews.
