# Circloora final architecture decision record

Status: **LOCKED FOR MVP IMPLEMENTATION**  
Decision owner: Build Director  
Date: 2026-07-18  
Architecture version: `circloora-adr-1`  

This record reconciles the six required Phase 1 reports:

- `product-ux.md`
- `agent-systems.md`
- `data-identity.md`
- `circular-methodology.md`
- `security-privacy.md`
- `qa-evaluation.md`

Those reports remain the detailed acceptance contracts. This record controls when they conflict.

## 1. Launch decision

Circloora launches as an iPhone-first, installable, local-first circular ownership application. It is not a recycling scanner. Its complete credential-free path is a realistic and visibly disclosed mock-agent experience backed by IndexedDB. The production application also contains server-only OpenAI Agents SDK, Responses API, web-search, and Realtime integration boundaries, but those capabilities remain disabled until their credentials and live gates pass.

The deployment in this task is a **demo release** because `OPENAI_API_KEY` is not configured. Every analysis surface must say:

> Demo analysis—OpenAI is not currently connected.

No runtime may silently fall back from live to mock.

## 2. Resolved decisions

| Topic | Locked decision |
| --- | --- |
| Product wedge | Persistent Passports, adaptive investigation, ranked next-life pathways, Missions, verification, four ledgers, and coordinated moves |
| Primary routes | The supplied route set plus `/profile`; `/` conditionally renders first-visit landing or returning Home |
| Navigation | Home, Things, Missions, Profile with a central Scan action, not a fifth tab |
| Identity | Anonymous local mode is complete and creates no remote account; account creation occurs only after useful value |
| Persistence | IndexedDB is canonical locally; typed repositories isolate adapters; cloud sync is optional |
| Cloud | Supabase adapters, SQL/RLS design, and auth UI are feature-gated; disabled without complete environment configuration |
| Images | Raw images are ephemeral by default. Catalog uses a designed placeholder unless the user separately opts into a sanitized derived thumbnail/evidence retention |
| OpenAI | `@openai/agents` manager pattern on Responses; model names come from environment; current recommended default is `gpt-5.6-sol` but is not hardcoded in runtime calls |
| Realtime | Optional WebRTC/ephemeral-token interaction layer; it cannot mutate authoritative state |
| Agent state | Canonical `InvestigationSnapshot` is independent from SDK state; approval continuation state is encrypted and versioned server-side |
| Determinism | Safety, legality, schemas, state transitions, ranking, scheduling, verification rules, climate arithmetic, anti-abuse, and Credits are code-owned |
| Sources | Provider-dependent local recommendations require current source records. Empty results return the mandated limitation |
| Credits | Prototype behavioral points only; scan/unknown/disposal award zero; environmental modifier is bounded to 0.80–1.20 |
| Climate | Comparative ranges only at tiers A–C; Tier D shows unavailable; no model intuition supplies emissions factors |
| Actions | MVP prepares drafts/checklists only after approval; it never publishes, contacts, books, buys, pays, or transfers |
| Deployment | New Vercel project `circloora-app`, mock mode explicitly enabled unless live credentials later pass gates |

## 3. System topology

```text
iPhone Safari / installed PWA
  -> Next.js App Router UI
     -> IndexedDB repository (anonymous authority / signed-in working set)
     -> same-origin typed API routes
        -> session, CSRF, Zod, rate, size, timeout, idempotency gates
        -> MockAgentRuntime OR LiveAgentRuntime (never implicit fallback)
           -> CirclooraOrchestrator
              -> bounded specialist agents as tools
              -> deterministic domain tools
           -> independent verification gate
        -> optional Supabase adapters (feature-gated)
        -> safe public SSE event adapter
```

All privileged modules import `server-only`. Browser code may import schemas and types, never privileged clients.

## 4. Canonical route structure

```text
/
/start
/lens/[investigationId]
/inventory/[investigationId]
/investigate/[investigationId]
/catalog
/thing/[objectId]
/missions
/mission/[missionId]
/plan/[investigationId]
/verify/[missionId]
/credits
/complete/[investigationId]
/history
/impact
/profile
/install
/privacy
/methodology

/api/session
/api/agent/start
/api/agent/resume
/api/agent/approve
/api/agent/reject
/api/agent/cancel
/api/verification/run
/api/realtime/token
/api/health
```

Focused capture, inventory, and verification routes hide the bottom tab bar. All other product screens use the app shell where it does not compete with the primary task.

## 5. Component ownership structure

```text
components/
  agent/          public events, evidence/approval/revision panels
  camera/         Lens, capture controls, review, permission recovery
  catalog/        cards, filters, Spaces, empty states
  credits/        disclosure, entries, multiplier explanation
  evidence/       requests, consent, source/evidence provenance
  inventory/      room candidates and confirmation controls
  layout/         shell, tab bar, scan control, safe-area actions
  missions/       cards, steps, approval packets, verification states
  next-life-map/  accessible decision rail plus text equivalent
  passport/       identity, confidence, history, four ledger summaries
  plan/           timeline, dependencies, grouped trips, fallbacks
  pwa/            install prompt/instructions and offline state
  safety/         blocking escalation and prohibited-action copy
  sources/        source freshness, jurisdiction, and limitations
  ui/             tokens, buttons, fields, cards, dialogs, skeletons
  verification/   claim form, evidence level, result hierarchy
```

## 6. Canonical domain model

One schema source in `lib/schemas` generates TypeScript types via `z.infer`. Every trust boundary uses strict, bounded schemas with a `schemaVersion`. Stable UUIDs are generated by code, not by models.

Required aggregates:

- `PreferenceProfile`
- `Space`
- `Investigation`
- `ObjectPassport`
- `Observation`
- `Hypothesis`
- `EvidenceRequest` and `EvidenceAsset`
- `Pathway` and `PathwayScore`
- `AgentRun`, `AgentEvent`, and `InvestigationSnapshot`
- `UserApproval`
- `Mission`
- `RecommendationRevision`
- `VerificationResult`
- `CircularActionEntry`
- `CircularValueEntry`
- `ClimateImpactEntry`
- `CreditClaim` and `CreditLedgerEntry`
- `LocalPathwaySource`
- `MovePlan`

The four ledgers are append-only. Corrections append reversals or superseding entries. UI projections such as balances are never authoritative.

### Persistence contract

```ts
interface EntityRepository<T> {
  get(id: string): Promise<T | null>;
  list(query?: unknown): Promise<T[]>;
  put(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

interface CirclooraRepository {
  export(): Promise<unknown>;
  import(payload: unknown): Promise<void>;
  clear(): Promise<void>;
}
```

Production adapters may extend this contract with optimistic versions, transactions, paging, sync, tombstones, and outboxes. Components consume domain services, not IndexedDB or SQL directly.

## 7. Database and identity lock

The local database is `circloora`. Stores cover profile, spaces, investigations, objects, observations, hypotheses, evidence metadata, pathways, sources, agent runs/events/state, approvals, missions, revisions, verification, four ledgers, plans, outbox, and migration metadata. Raw bytes use a separate store only after explicit consent.

When cloud accounts are enabled:

- Supabase Auth supports Apple and email magic link; Google is optional.
- Postgres mirrors stable domain IDs and adds `owner_id`, versions, timestamps, and tombstones.
- RLS is enabled and forced on every owner table.
- Server-derived scores, verification, agent state, and ledgers are read-only to clients.
- Evidence uses a private bucket and short-lived purpose-bound access.
- Local-to-cloud migration previews counts/conflicts, preserves local data until verification, and recomputes local prototype Credits.
- Foreground pull is authoritative; realtime is only an invalidation hint.

Because no Supabase credentials are present, the demo release keeps cloud accounts disabled and renders no dead provider controls.

## 8. Agent contracts

`CirclooraOrchestrator` is the sole user-facing manager. It dynamically selects among:

- `ObjectIntelligenceAgent`
- `CircularPathwayAgent`
- `LocalPathwayAgent`
- `ValueAgent`
- `ActionAgent`
- `VerificationAgent`

The eight required tools retain the names and strict semantics in the build brief:

- `analyze_visual_evidence`
- `request_additional_evidence`
- `search_current_pathways`
- `estimate_remaining_value`
- `rank_next_life_pathways`
- `generate_action_packet`
- `optimize_move_plan`
- `verify_outcome`

The live runtime uses a manager pattern and keeps conversational ownership in the orchestrator. Image analysis occurs in an isolated completed run so raw image content never enters resumable root state. Evidence waits end the turn and resume from the canonical snapshot; approval waits bind principal, run, state revision, tool, exact argument digest, and expiration.

Public events are allowlisted summaries with monotonic sequence numbers. Prompts, raw model/tool payloads, reasoning, chain-of-thought, evidence content, and secrets are prohibited.

Hard run limits are eight objects, four images per object, eight model turns, twelve total tools including nested tools, and two automatic transient retries.

## 9. Deterministic methodology lock

Pathways first pass safety, legality, authority, condition, recall/eligibility, current-source, deadline, and evidence gates. Balanced eligible-path scoring uses:

- Circular value retained: 25%
- Completion probability: 18%
- Evidence confidence: 12%
- Deadline fit: 12%
- Local availability: 10%
- Financial recovery: 9%
- Effort fit: 6%
- Travel fit: 5%
- Preference match: 3%

The six documented preference presets replace weights but never gates. A lower-hierarchy path must either be the only eligible option, beat the higher path by at least five points, be part of an explicit dated fallback, or be chosen by the user after the tradeoff is shown.

Credits use:

```text
round-half-up(
  Base Action Score
  × Verification Multiplier
  × Value Retention Multiplier
  × Effort Multiplier
  × Environmental Confidence Modifier
)
```

The locked prototype modifier ranges are value retention `0.85–1.15`, effort `0.95–1.10`, and environmental confidence `0.80–1.20`. Safety and eligibility can force zero. Credits are calculated once from unrounded factors and rounded once.

The climate engine compares explicit baseline/alternative intervals under a common functional unit and horizon. Operational products include production, intervention, transport, operation, refrigerant where material, and end-of-life. A result crossing zero says direction is uncertain. Tier D forbids a number.

## 10. Security and privacy lock

- Same-origin APIs only; anonymous live calls use a short-lived HttpOnly session plus Origin/Host, fetch-metadata, and CSRF checks.
- Raw evidence is ephemeral by default and never enters analytics, logs, traces, exports, service-worker caches, or resumable agent state.
- Decode and MIME-sniff uploads, enforce byte/pixel/page/frame caps, re-encode images, strip metadata, reject SVG/HTML/polyglots, and isolate risky parsers.
- Use a nonce CSP in production, strict security headers, no third-party scripts by default, and feature-gated exact connect origins.
- Validate owner and authority server-side; never trust user/model-supplied owner, award, safety, storage, source, or destination fields.
- Treat user text, OCR, documents, images, webpages, and tool output as untrusted evidence, never instructions.
- Logs and analytics are allowlists. They exclude free text, entity IDs, location, evidence, prompts/responses, safety detail, and secrets.
- Preview uses isolated variables/data, mock mode by default, `noindex`, and Vercel Deployment Protection where available.
- Local delete clears IndexedDB and user caches. Cloud delete revokes access first and reports purge status honestly.

## 11. Launch scope and feature flags

| Capability | Demo release |
| --- | --- |
| Local anonymous profile/catalog | Enabled |
| Mock adaptive agent scenarios | Enabled and disclosed |
| Camera/upload/room workflows | Enabled |
| Persistence/export/import/delete | Enabled |
| Passports, Missions, plans, verification, four ledgers | Enabled |
| PWA/offline shell and local reads | Enabled |
| Live OpenAI agents/web search | Wired, disabled without key/model |
| Realtime voice | Wired or clearly unavailable; disabled without key/model |
| Supabase accounts/sync | Architecture and optional adapter; disabled without full configuration |
| Durable evidence storage | Disabled by default |
| Analytics | No-op unless configured and consented |
| Real rewards, redemption, partners, regeneration | Not available; interfaces only |

## 12. Dependency graph and integration order

```text
Foundation + schemas
  -> repository + mock fixtures
     -> camera and local persistence
     -> agent facade and deterministic tools
        -> catalog + Passports
        -> Missions + move planning
           -> verification + four ledgers
              -> sources + operations
                 -> full UI/E2E integration
                    -> review/fixes
                       -> release candidate
                          -> Vercel preview/production
```

No feature agent may redefine shared schemas. Interface conflicts return to the Build Director.

## 13. Implementation ownership

1. Foundation: Next.js, TypeScript, Tailwind, tokens, app shell, primitives, PWA shell.
2. Data/identity: schemas/repositories, IndexedDB, optional Supabase, export/import/delete.
3. Camera: Lens, capture/upload, processing, permissions, evidence adapter.
4. Runtime: live/mock agent facade, server routes, tools, pause/resume, approvals, events.
5. Catalog: My Circloora, Passport, search/filter/history.
6. Missions: Mission state UI, plan, action packet, approval workflow.
7. Impact: deterministic ranking, verification, ledgers, Credits, climate intervals.
8. Sources: source records/freshness and no-source behavior.
9. Operations: health, safe analytics/logging, headers, rate/idempotency utilities.

## 14. Acceptance and release gates

The QA report's stable IDs are normative. At minimum, release requires:

- strict TypeScript, lint, format, unit, integration, agent/safety eval, and production build success;
- complete local mock single-object and room journeys;
- evidence pause/reload/resume and recommendation revision;
- safety interruption with no prohibited instruction;
- source-empty behavior with no invented provider;
- verification and deterministic Credits, including duplicate blocking;
- IndexedDB persistence, export/import, local delete, and no raw-image default;
- all four required iPhone viewports with no overflow and 44px targets;
- automated accessibility plus manual keyboard/reduced-motion checks;
- secret/client-bundle scan and dependency audit;
- actual preview and production URL checks for `/`, `/api/health`, and the remote mock workflow;
- a final independent Release Auditor result of `RELEASE APPROVED`.

Live OpenAI, Realtime, Supabase/provider, or partner gates are recorded as `blocked_missing_credential` or `not_applicable_feature_disabled`; they may not be reported as passed.

## 15. Phase 2 entry criteria

Phase 2 may begin because:

- all six required reports exist;
- route, schema, repository, agent, methodology, privacy, and QA ownership is locked;
- derived imagery defaults to placeholder unless explicit consent exists;
- the account-optional/cloud seam is resolved;
- mock/live claims and deployment posture are explicit;
- implementation order and test ownership are defined.

