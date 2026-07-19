# Runtime schema reconciliation

The runtime branch began before canonical `lib/schemas` exports existed. It therefore uses the type-only adapters in `lib/agents/contracts/domain-adapter.ts`; those adapters perform no validation and must be removed after integration.

## Required canonical exports

The merged `@/lib/schemas` package must export these names (or the Build Director must provide a one-to-one alias):

- `InvestigationSnapshotSchema` and `InvestigationSnapshot`
- `InvestigationStatusSchema`
- `EvidenceRefSchema` and `EvidenceRef`
- `ObservationSchema` and `Observation`
- `HypothesisSchema` and `Hypothesis`
- `EvidenceRequestSchema` and `EvidenceRequest`
- `PathwaySchema` and `Pathway`
- `PathwayScoreSchema` and `PathwayScore`
- `AgentEventSchema` and `AgentEvent`
- `UserApprovalSchema` and `UserApproval`
- `VerificationResultSchema` and `VerificationResult`
- `LocalPathwaySourceSchema` and `LocalPathwaySource`
- `MovePlanSchema` and `MovePlan`

## Integration changes

1. Replace `CanonicalInvestigationSnapshotAdapter`, `CanonicalEvidenceRefAdapter`, and `CanonicalSourceRefAdapter` with types inferred from the canonical schemas.
2. Parse `StartRunInput.snapshot` and `ResumeRunInput.snapshot` with `InvestigationSnapshotSchema`; keep `assertNoForbiddenSnapshotData` as the additional privacy invariant.
3. Replace duplicated tool-boundary `EvidenceRefSchema`, `PathwaySchema`, observation, hypothesis, and source-ref fragments with imported canonical schemas using `.pick(...)` only where the tool contract is intentionally narrower.
4. Map `PublicAgentEventSchema` to the canonical `AgentEventSchema` without adding raw model events, prompts, reasoning, tool arguments/results, evidence content, or arbitrary summary text.
5. Bind `ContinuationStore` to the owner-scoped agent-state/approval repositories and optimistic `stateRevision` transaction supplied by the data branch.
6. Inject the canonical deterministic ranking, move scheduler, current-source, verification, and Credits services through `RuntimeToolServices`. The runtime must not implement alternate formulas.
7. Add `AGENT_STATE_ENCRYPTION_KEY`, `OPENAI_AGENTS_SDK_VERSION`, and `AGENT_RATE_LIMIT_READY` to deployment configuration. Live mode remains fail-closed until the distributed limiter and continuation store pass security tests.

The tool schemas in `lib/tools` are API/function-tool contracts, not alternate persistence schemas. Their bounds and strict unknown-key rejection remain required after reconciliation.
