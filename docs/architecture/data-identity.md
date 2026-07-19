# Circloora data and identity architecture

Status: Phase 1 architecture proposal  
Scope: anonymous persistence, optional identity and cloud sync, Postgres/RLS, evidence storage, retention, portability, domain contracts, and indexes  
Non-goal: production implementation

## 1. Decision summary

Circloora is local-first and account-optional. The launch path is:

```text
First scan -> useful result -> save locally -> optional account -> optional cloud migration/sync
```

The MVP's anonymous mode is browser-local IndexedDB, not a silent remote “anonymous user” account. No Supabase user, cloud row, or durable cloud image is created until the person deliberately starts account creation and accepts the migration preview. This resolves the apparent tension between “do not require an account for the MVP” and the requested Supabase architecture:

- Local mode is a complete launch capability: catalog, investigations, resumable state, missions, prototype ledgers, export/import, and deletion work without an account.
- Supabase Auth, Postgres, Storage, and cross-device sync are an optional deployment capability behind `NEXT_PUBLIC_CLOUD_ACCOUNTS_ENABLED` (proposed). They can ship disabled until configured and tested.
- Every domain aggregate uses the same Zod contract and stable client-generated ID in both modes. `IndexedDbRepository` and `SupabaseRepository` implement the same repository interfaces; UI and agent code do not branch on persistence details.
- Signing in never makes local data disappear. The app previews the merge, migrates metadata transactionally, asks separately about durable evidence upload, and keeps a recoverable local copy until cloud verification succeeds.
- Supabase anonymous sign-ins are intentionally not used for local mode. They would create remote identity/data before the user has asked for an account, complicate privacy messaging, cleanup, abuse controls, and abandoned-session retention. They remain a future option only if a concrete server-before-account requirement appears.

This is an architecture lock recommendation. Implementation should not introduce a second domain model for cloud records.

## 2. Ownership, identity, and modes

### 2.1 Owner scopes

Every local record carries an `ownerScope` discriminated union:

```text
{ kind: "local"; localProfileId: UUID }
{ kind: "account"; userId: UUID }
```

`localProfileId` is random UUIDv7 generated on-device. It is not a fingerprint, is not sent to analytics, and cannot authenticate to cloud services. Upon successful migration, persisted cloud rows receive `owner_id = auth.uid()` while retaining their entity IDs. Local records switch to account scope only after the server acknowledges their migration batch.

### 2.2 Persistence modes

| Mode | Identity | Canonical store | Images/evidence | Sync |
| --- | --- | --- | --- | --- |
| Anonymous local | Random local profile | IndexedDB | Session-only by default; optional local blob with consent | No cross-device sync |
| Signed in, offline | Supabase user plus device ID | IndexedDB working set/outbox | Local pending blob or cached encrypted response; never public | Push on reconnection |
| Signed in, online | Supabase user | Postgres; IndexedDB cache | Private Storage only with explicit retention consent | Push/pull plus realtime invalidation |
| Exported | User-held archive | JSON/ZIP outside app control | Optional, separately selected | None |

The app must label the mode in Profile/Privacy: “Saved on this device” or “Synced to your account.” Incognito/private browsing and browser storage eviction can remove local data; onboarding and export affordances must say so plainly.

### 2.3 Device identity

Each installation generates a random `deviceId` UUIDv7. It supports sync diagnostics and Hybrid Logical Clock (HLC) tie-breaking but is not a tracking identifier. A device registration contains `device_id`, `user_id`, optional user-assigned label, first/last sync time, and revoked time. Do not store user agent or IP beyond transient security logs unless separately justified.

## 3. Anonymous IndexedDB design

### 3.1 Database and migrations

Use one database, `circloora`, with an integer database version and idempotent upgrade steps. Never delete a store as part of a normal upgrade without first migrating and validating its records. A failed upgrade leaves the prior database intact and displays export/retry guidance.

Object stores:

| Store | Key / indexes | Purpose |
| --- | --- | --- |
| `meta` | key | schema version, local profile ID, device ID, HLC, last export/sync |
| `profiles` | `id`; `ownerScope`, `updatedAt` | preferences and privacy settings |
| `spaces` | `id`; `owner`, `nameNormalized`, `updatedAt` | room/space taxonomy |
| `investigations` | `id`; `owner`, `status`, `updatedAt`, `deadline` | scan/move investigations |
| `objects` | `id`; `owner`, `status`, `spaceId`, `category`, `updatedAt`, multi-entry `searchTokens` | Circloora Passports |
| `observations` | `id`; `[objectId, createdAt]`, `investigationId`, `origin` | factual/user/retrieved/inferred statements |
| `hypotheses` | `id`; `[objectId, status]`, `investigationId`, `updatedAt` | revisable model hypotheses |
| `evidenceRequests` | `id`; `[investigationId, status]`, `objectId` | pause/resume requests |
| `evidenceAssets` | `id`; `objectId`, `missionId`, `sha256`, `retentionUntil` | metadata only by default |
| `evidenceBlobs` | `assetId` | consented local blobs, isolated so default export/query cannot include bytes |
| `pathways` | `id`; `[objectId, status]`, `investigationId`, `rank` | candidate pathways |
| `sources` | `id`; `pathwayId`, `urlHash`, `expiresAt`, `retrievedAt` | source provenance and freshness |
| `agentRuns` | `id`; `investigationId`, `status`, `updatedAt` | bounded run metadata |
| `agentEvents` | `id`; `[runId, sequence]`, `[investigationId, timestamp]` | public, redacted activity feed |
| `agentState` | `runId`; `investigationId`, `updatedAt` | validated resumable state; no images/secrets |
| `approvals` | `id`; `[investigationId, status]`, `missionId` | consequential-action approvals |
| `missions` | `id`; `[owner, state]`, `objectId`, `deadline`, `updatedAt` | actionable tasks |
| `recommendationRevisions` | `id`; `[objectId, createdAt]`, `investigationId` | why a recommendation changed |
| `verifications` | `id`; `missionId`, `objectId`, `decision`, `createdAt` | outcome verification |
| `actionLedger` | `id`; `[objectId, completedAt]`, `missionId` | circular facts, append-only |
| `valueLedger` | `id`; `[objectId, calculatedAt]`, `actionId` | practical value, append-only |
| `climateLedger` | `id`; `[objectId, calculationDate]`, `actionId` | qualified estimates, append-only |
| `creditLedger` | `id`; `[owner, createdAt]`, `missionId`, `objectId`, `claimKey` unique | prototype points, append-only |
| `movePlans` | `id`; `investigationId` unique, `deadline`, `updatedAt` | coordinated plan |
| `outbox` | auto-increment `sequence`; `entityType`, `entityId`, `status`, `nextAttemptAt` | ordered offline mutations |
| `tombstones` | `[entityType, entityId]`; `deletedAt` | deletion propagation |
| `migrationBatches` | `id`; `status`, `createdAt` | resumable local-to-cloud import |

`evidenceBlobs` is never opened by catalog list/search or default export. Storage estimation must be checked before saving a blob. On quota error the user can continue without durable evidence.

### 3.2 Atomicity and crash recovery

- Write an aggregate and its outbox operation in one IndexedDB transaction.
- Store no partially parsed domain entity: parse with the current Zod schema before commit and on every read.
- Ledger additions and verification results share one transaction, so an outcome cannot appear verified without its ledger effect.
- Persist agent state at each pause and after each accepted tool result; state references evidence asset IDs rather than raw bytes.
- Use deterministic idempotency keys for operations that can be retried, e.g. `verification:{missionId}:{claimId}` and `credit:{missionId}:{verificationId}:{methodologyVersion}`.
- Keep a small `quarantine` export in memory for records that fail a future migration; do not silently discard them.

### 3.3 Local data protection limits

IndexedDB is origin-isolated, not encryption at rest. Browser script running under the origin can read it. Therefore:

- apply strict CSP/XSS controls;
- never persist auth refresh/access tokens inside domain stores;
- avoid exact address, full receipt text, biometrics, or unnecessary notes;
- keep raw images ephemeral by default;
- provide a one-tap “Delete all data on this device” flow;
- do not claim local encryption unless a separately reviewed WebCrypto key-management design is shipped.

## 4. Typed repository abstraction

Repositories operate on domain aggregates, not SQL rows or IndexedDB records. The minimal contract is:

```ts
type EntityType =
  | "profile" | "space" | "investigation" | "object" | "observation"
  | "hypothesis" | "evidenceRequest" | "evidenceAsset" | "pathway"
  | "source" | "agentRun" | "agentEvent" | "agentState" | "approval"
  | "mission" | "recommendationRevision" | "verification" | "actionEntry"
  | "valueEntry" | "climateEntry" | "creditEntry" | "movePlan";

interface EntityRepository<T extends SyncEntity> {
  get(id: EntityId, options?: ReadOptions): Promise<T | null>;
  list(query: QuerySpec<T>): Promise<Page<T>>;
  create(entity: T, options?: WriteOptions): Promise<WriteResult<T>>;
  update(id: EntityId, patch: DomainPatch<T>, options: ExpectedVersion): Promise<WriteResult<T>>;
  delete(id: EntityId, options: ExpectedVersion & DeleteReason): Promise<Tombstone>;
  watch?(query: QuerySpec<T>, signal: AbortSignal): AsyncIterable<RepositoryChange<T>>;
}

interface UnitOfWork {
  transaction<T>(work: (repos: RepositorySet) => Promise<T>): Promise<T>;
}

interface SyncCoordinator {
  status(): Promise<SyncStatus>;
  push(limit: number, signal?: AbortSignal): Promise<PushResult>;
  pull(cursor: SyncCursor | null, limit: number, signal?: AbortSignal): Promise<PullResult>;
  reconcile(conflict: SyncConflict, decision?: UserConflictDecision): Promise<ReconcileResult>;
}

interface EvidenceRepository {
  putConfirmed(input: ConfirmedEvidence, consent: EvidenceRetentionConsent): Promise<EvidenceAsset>;
  getAuthorized(assetId: EntityId, purpose: EvidenceAccessPurpose): Promise<Blob | SignedAccess>;
  delete(assetId: EntityId): Promise<Tombstone>;
}
```

Contract rules:

- `get/list` never return unparsed data.
- `update/delete` require `expectedVersion`; conflict is a typed result, not an exception string.
- `QuerySpec` is an allowlisted domain query, never arbitrary SQL/filter strings.
- `Page` uses a stable cursor `(sortValue, id)`, not offset pagination.
- Append-only repositories expose `append`, `list`, and `reverse/supersede`; they do not expose update/delete.
- `EvidenceRepository` is separate because blob consent, transport, and retention differ from metadata.
- `IndexedDbRepository` is authoritative in local mode. In signed-in mode it remains the immediate write target/cache and the outbox synchronizes to `SupabaseRepository`.
- Server-created data (verified outcomes, credit awards, deterministic calculation versions) is returned through repository contracts but cannot be authoritatively forged by a client implementation.

## 5. Authentication architecture

### 5.1 Providers and flows

Use Supabase Auth only when cloud accounts are enabled:

1. **Sign in with Apple** is the primary OAuth option for the iPhone-first web app. Use Supabase's web OAuth PKCE flow through `/auth/callback`. Apple OAuth does not reliably supply a full name, so `firstName` is an optional profile prompt, never inferred. Apple's web client secret requires operational rotation every six months.
2. **Email magic link** is the universal passwordless fallback. Use PKCE, exact redirect allowlists for local/preview/production, a branded template, rate limits, and a neutral response that does not reveal account existence.
3. **Google** is optional behind `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`. Do not render the button until its provider credentials and callback have been verified in that environment.

Official Supabase references: [Auth](https://supabase.com/docs/guides/auth), [Apple OAuth](https://supabase.com/docs/guides/auth/social-login/auth-apple), [identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking), and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

### 5.2 Session boundaries

- Use the supported Supabase SSR client for Next.js and PKCE callback exchange.
- On server requests, validate the current user with the Auth server; do not trust a user ID posted by the browser or merely decode an unverified JWT.
- Restrict redirect destinations to an internal allowlist and persist only a validated relative `returnTo` path.
- Cookie settings must be HTTPS/Secure in preview/production, SameSite=Lax, shortest practical lifetime, and scoped to the app. Logout revokes the session and clears local account-scoped cache only after pending changes are resolved or exported.
- OAuth state/PKCE verifier and migration nonce are short-lived and single-use.
- The Supabase publishable key may be in the client; the service-role key and provider secrets are server-only. No service-role key may exist in a `NEXT_PUBLIC_*` variable or client bundle.

### 5.3 Account conversion and identity collisions

The user sees a preflight summary: record counts, unsynced changes, evidence items, and the destination account. Default choice is **merge local data into the signed-in catalog**. “Discard local data” is destructive and requires separate confirmation plus an export offer.

Supabase can automatically link verified identities that share an email, but Apple private relay addresses and existing identities can differ. Never merge two Supabase user IDs based only on a client-reported email. A signed-in user may deliberately link another provider using Supabase identity linking. If local data is being attached to an already populated account, use the migration/conflict process below; do not create a second profile row or reassign another user's rows.

## 6. Postgres schema

### 6.1 Conventions

- `public` contains owner-visible product tables; `app_private` contains sync/audit/migration internals and is not exposed through the data API.
- All owner data tables carry `id uuid primary key`, `owner_id uuid not null references auth.users(id) on delete cascade`, `schema_version smallint`, `version bigint`, `created_at timestamptz`, `updated_at timestamptz`, `deleted_at timestamptz`, and `source_device_id uuid` unless explicitly append-only.
- IDs are client-generated UUIDv7. Time comes from the server on cloud writes. Client timestamps are stored as metadata for reconciliation, never trusted for authorization or reward limits.
- Use `text` plus CHECK constraints for evolving product enums in the first migrations; generate TypeScript/Zod values from one canonical domain definition. Postgres native enums make safe iterative deployment harder.
- Monetary amounts use integer minor units plus ISO 4217 currency; durations use integer minutes/days; distances use integer meters; all climate values use explicit unit strings and decimal values.
- Soft deletion creates a tombstone for sync. A later purge hard-deletes the row. Foreign keys to independently retained ledger/history records use `ON DELETE RESTRICT`; user-account deletion cascades after export/purge orchestration.
- Authoritative ledger records are append-only. Correction is a new row with `supersedes_id` or a reversing entry.

### 6.2 Tables

| Table | Domain columns beyond common sync columns | Write authority |
| --- | --- | --- |
| `profiles` | `first_name`, `general_location`, `postal_code`, `household_type`, `occupancy_type`, `transportation_options jsonb`, `preferred_travel_radius_m`, `repair_comfort_level`, `minimum_resale_threshold_minor`, `currency`, `donation_preferences jsonb`, `accessibility_preferences jsonb`, `reward_preferences jsonb`, `regeneration_preferences jsonb`, `privacy_settings jsonb`, `notification_settings jsonb` | owner |
| `devices` | `device_id`, `label`, `first_seen_at`, `last_sync_at`, `revoked_at` | owner/server |
| `spaces` | `name`, `name_normalized`, `kind`, `sort_order`, `archived_at` | owner |
| `investigations` | `mode`, `status`, `goal`, `deadline`, `approximate_area`, `preference_mode`, `active_object_id`, `blocked_reason`, `completed_at` | owner/server |
| `objects` | `investigation_id`, `user_confirmed_name`, `search_document`, `client_fingerprint`, `primary_image_asset_id`, `category`, `subcategory`, identity/brand/model json, `probable_materials jsonb`, `space_id`, ownership/acquisition/age fields, condition/functionality/repairability, maintenance/warranty/manual/part/recall json, value range, recommended pathway, alternatives, `verification_status`, uncertainty, safety flags, credits cache, `passport_disclaimer_version` | owner/server |
| `observations` | `object_id`, `investigation_id`, `origin`, `statement`, `structured_value jsonb`, `confidence`, `evidence_asset_ids uuid[]`, `source_ids uuid[]`, `observed_at`, `model_version` | owner/server append |
| `hypotheses` | `object_id`, `investigation_id`, `kind`, `claim`, `confidence`, `status`, `supporting_observation_ids uuid[]`, `contradicting_observation_ids uuid[]`, `resolved_at` | server; owner may reject/confirm through explicit action |
| `evidence_requests` | `object_id`, `investigation_id`, unresolved question/reason/type, current confidence, safety context, instruction/target/framing/capture mode/test/prohibited actions/completion/accessibility fields, `status`, `fulfilled_asset_ids`, `fulfilled_at` | server; owner fulfils/cancels |
| `evidence_assets` | `object_id`, `mission_id`, `verification_id`, `kind`, `storage_bucket`, `storage_path`, `sha256`, perceptual hash, duplicate group, MIME, byte size, dimensions, redaction status, consent basis/version/time, retention policy/until, `purged_at` | owner upload metadata; server validates |
| `pathways` | `object_id`, `investigation_id`, `pathway_type`, `status`, `rank`, title, description, reason, requirements, disqualifiers, confidence, deadline/travel/effort/value ranges, source freshness | server; owner selects |
| `pathway_scores` | `pathway_id`, `ranking_run_id`, factor scores, active weights, total score, safety/legal veto, disqualifying factors, explanation, changeable evidence, `methodology_version` | server append |
| `local_pathway_sources` | pathway/organization/source type, title, canonical URL/hash, publisher, jurisdiction, eligibility, location, hours, retrieved/published/expires timestamps, verification status, limitations, confidence, content fingerprint | server append/refresh |
| `agent_runs` | `investigation_id`, status, turn/tool/retry counters, prompt/model/config versions, mock flag, started/paused/completed times, safe error code, cost/usage summary | server |
| `agent_events` | `run_id`, `investigation_id`, sequence, timestamp, agent, event type, summary, tool name, object, status, user action required | server append |
| `agent_state_snapshots` | `run_id`, `investigation_id`, sequence, state JSON, state schema version/hash, previous hash, pause reason, expires at | server append; owner read |
| `user_approvals` | `investigation_id`, `mission_id`, action type, scope/payload summary, status, requested/resolved timestamps, expiration, decision reason, idempotency key | owner decides; server requests |
| `missions` | `object_id`, `investigation_id`, objective, reason, evidence requirements, steps, deadline, effort/cost/recovery ranges, safety notes, approval state, state, verification requirement, available credits, fallback mission/pathway, completed time | owner/server |
| `recommendation_revisions` | object/investigation, previous/current pathway, triggering evidence, explanation, prior/new confidence, ranking run IDs, verification ID, created time | server append |
| `verification_results` | mission/object, claimed/supported outcome, decision, level, evidence summary/assets, confidence, fraud flags, credits eligibility/amount/explanation, follow-up, verifier/model/methodology version, claim key | server append |
| `circular_action_entries` | object/mission/verification, pathway, started/completed times, verification level/evidence/verifier, confidence, sources, limitations, `supersedes_id` | server append |
| `circular_value_entries` | action/object, all required money/time/trip/item metrics as ranges, currency/units, assumptions, confidence, source/methodology version, calculation time, `supersedes_id` | server append |
| `climate_impact_entries` | action/object, impact category, tier, low/high/unit, boundary, baseline/alternative, displacement assumption, data sources, method/version, confidence/uncertainty/date/limitations, unavailable reason, `supersedes_id` | server append |
| `credit_claims` | object/mission/verification, claim key, status, submitted time, duplicate image/document flags, suspicious flags, daily-cap date | owner submits; server decides |
| `credit_ledger_entries` | object/mission/action/verification/claim, entry type, base score, each multiplier, signed amount, balance effect, verification level, methodology version, explanation, idempotency key, `supersedes_id` | server append |
| `move_plans` | investigation unique, deadline, ordered/daily plan, grouped trips, urgent actions, dependencies, fallback pathways, expected completion, deadline risk | server/owner-approved patch |

`objects.credits_cache` and other summaries are non-authoritative projections rebuilt from ledgers; they must never be used to prove an award.

### 6.3 Private sync/deletion tables

| Table | Key fields | Purpose |
| --- | --- | --- |
| `app_private.change_log` | global `sequence bigint generated always as identity`, owner, entity type/id, operation, version, changed at | pull cursor/source of truth |
| `app_private.migration_batches` | batch ID, owner, device, manifest hash, status, counts, started/completed/failed time, error code | idempotent imports |
| `app_private.migration_items` | batch, entity type/local ID, status, server version, error code | resumable progress |
| `app_private.idempotency_keys` | owner, key, request hash, response reference, expires at | retry safety |
| `app_private.deletion_jobs` | job, owner, scope, requested/re-authenticated times, status, purge deadline/result | auditable deletion |
| `app_private.security_events` | server-generated ID, owner nullable, category, coarse metadata, created/expiry | rate limit/abuse with redaction |

Do not expose these tables to the browser. Owner-scoped security-definer RPCs may return a minimal change page, migration status, export job status, or deletion status after setting a safe `search_path` and independently checking `auth.uid()`.

## 7. Row-level security and database authorization

RLS is enabled and forced on every owner-data table. The baseline policy shape is:

```sql
using (owner_id = (select auth.uid()) and deleted_at is null)
with check (owner_id = (select auth.uid()))
```

Specific rules:

1. `profiles`: a user may select/insert/update only `id = owner_id = auth.uid()`; deletion is through the deletion service.
2. User-editable aggregates (`spaces`, `investigations`, `objects`, `missions`, `user_approvals`, consented `evidence_assets`) get owner-scoped SELECT/INSERT/UPDATE. Direct hard DELETE is denied; an owner-scoped delete RPC produces a tombstone.
3. Server-derived tables (`hypotheses`, pathway scores/sources, agent runs/events/state, recommendation revisions, verification results, all authoritative ledgers) grant the authenticated user SELECT only. Writes occur in trusted server routes/RPCs after server Auth validation. Service-role use is limited to those server modules.
4. `observations` distinguish owner-originated statements from server origins. Direct client insert may set only `origin = user_reported`; a trigger rejects client claims of `directly_observed`, `externally_retrieved`, `inferred`, or `estimated` authority.
5. A trigger rejects changes to `owner_id`, `id`, `created_at`, authoritative calculation fields, and versions not advanced by the approved mutation function.
6. Child rows include `owner_id` for simple, indexable policies. A deferred constraint trigger verifies the referenced parent has the same owner; do not rely only on the client to provide it.
7. Public/anonymous database roles receive no product-table privileges. Local anonymous mode never calls Supabase.
8. RLS predicates never use `raw_user_meta_data` for authorization. If a future admin role exists, it uses server-controlled app metadata plus short-lived server access, not a user-editable claim.
9. Service-role credentials bypass RLS and therefore remain server-only. All service operations take the authenticated owner ID from the verified server session, not request payload.

### 7.1 Storage RLS

Create one private bucket, `evidence-private`, with allowlisted image/document MIME types and a small configured maximum. Object path:

```text
{auth.uid()}/{assetId}/{sanitizedVariantName}
```

Storage policies require `bucket_id = 'evidence-private'` and the first folder segment equal to `auth.uid()` for SELECT/INSERT/UPDATE/DELETE. The corresponding `evidence_assets.owner_id` and asset ID must match. Downloads use authenticated requests or purpose-bound short-lived signed URLs (target: five minutes); signed URLs are not stored in domain records or logs. Supabase private buckets are RLS-controlled and are not public URLs; see [Storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

Do not permit overwrite of an original. Variants use distinct immutable paths. Server scanning/validation completes before `validation_status = 'accepted'`; rejected files are deleted. The browser never lists a user's bucket prefix as a catalog operation.

## 8. Index plan

All indexes below are migration requirements, not optional tuning notes. RLS ownership columns lead user-facing indexes.

### 8.1 Core indexes

```text
profiles:                    unique(id); unique(owner_id)
devices:                     unique(owner_id, device_id); (owner_id, revoked_at)
spaces:                      (owner_id, archived_at, sort_order); unique(owner_id, name_normalized) where archived_at is null and deleted_at is null
investigations:              (owner_id, status, updated_at desc, id); (owner_id, deadline) where status not terminal; (owner_id, updated_at desc, id)
objects:                     (owner_id, updated_at desc, id) where deleted_at is null; (owner_id, space_id, updated_at desc); (owner_id, category, updated_at desc); (owner_id, condition); (owner_id, current_recommended_pathway); (owner_id, verification_status); GIN(search_document); GIN(safety_flags); unique(owner_id, client_fingerprint) where client_fingerprint is not null and deleted_at is null
observations:                (owner_id, object_id, observed_at desc); (owner_id, investigation_id, observed_at); GIN(evidence_asset_ids)
hypotheses:                  (owner_id, object_id, status, updated_at desc); (owner_id, investigation_id, status)
evidence_requests:           (owner_id, investigation_id, status, created_at); (owner_id, object_id, status)
evidence_assets:             (owner_id, object_id, created_at desc); (owner_id, mission_id); (owner_id, retention_until) where purged_at is null; (owner_id, sha256); (owner_id, perceptual_hash)
pathways:                    (owner_id, object_id, status, rank); (owner_id, investigation_id, rank)
pathway_scores:              unique(owner_id, ranking_run_id, pathway_id); (owner_id, pathway_id, created_at desc)
local_pathway_sources:       (owner_id, pathway_id, verification_status); (owner_id, expires_at); unique(owner_id, canonical_url_hash, content_fingerprint)
agent_runs:                  (owner_id, investigation_id, updated_at desc); (owner_id, status, updated_at)
agent_events:                unique(owner_id, run_id, sequence); (owner_id, investigation_id, timestamp, id)
agent_state_snapshots:       unique(owner_id, run_id, sequence); (owner_id, investigation_id, created_at desc)
user_approvals:              (owner_id, status, requested_at); (owner_id, mission_id); unique(owner_id, idempotency_key)
missions:                    (owner_id, state, deadline, id); (owner_id, object_id, updated_at desc); (owner_id, investigation_id, state); (owner_id, deadline) where state in active states
recommendation_revisions:    (owner_id, object_id, created_at desc); (owner_id, investigation_id, created_at)
verification_results:        (owner_id, mission_id, created_at desc); (owner_id, object_id, created_at desc); unique(owner_id, claim_key)
move_plans:                  unique(owner_id, investigation_id) where deleted_at is null; (owner_id, deadline)
```

`objects.search_document` is a generated/trigger-maintained `tsvector` from user-confirmed name, category, brand, model, and normalized space name. Free-form sensitive notes and raw OCR are deliberately excluded.

### 8.2 Ledger, abuse, and sync indexes

```text
circular_action_entries:     (owner_id, object_id, completed_at desc); (owner_id, mission_id); unique(owner_id, verification_id, pathway) where supersedes_id is null
circular_value_entries:      (owner_id, object_id, calculation_date desc); unique(owner_id, action_id, methodology_version) where supersedes_id is null
climate_impact_entries:      (owner_id, object_id, calculation_date desc); (owner_id, impact_category, calculation_date desc); unique(owner_id, action_id, impact_category, methodology_version) where supersedes_id is null
credit_claims:               unique(owner_id, object_id, mission_id) where status in ('pending','under_review','awarded'); (owner_id, submitted_at); (owner_id, daily_cap_date); GIN(fraud_risk_flags)
credit_ledger_entries:       (owner_id, created_at desc, id); (owner_id, mission_id); (owner_id, object_id); unique(owner_id, idempotency_key)
change_log:                  (owner_id, sequence); (owner_id, entity_type, entity_id, sequence desc)
migration_batches:           unique(owner_id, manifest_hash); (owner_id, status, created_at desc)
migration_items:             unique(batch_id, entity_type, local_id); (batch_id, status)
idempotency_keys:            unique(owner_id, key); (expires_at)
deletion_jobs:               (owner_id, status, requested_at desc); (purge_deadline) where status not terminal
security_events:             (owner_id, category, created_at desc); (expires_at)
```

Index every foreign key used in deletion or join paths. Run `EXPLAIN (ANALYZE, BUFFERS)` against owner-scoped catalog, sync-pull, mission, evidence-expiry, and credit-history queries before launch. Avoid GIN-indexing arbitrary JSON blobs until a measured query needs it.

## 9. Domain and Zod schema catalog

### 9.1 Shared rules

All schemas are `.strict()` at trust boundaries and carry `schemaVersion`. Persisted entities use:

```text
SyncMeta = {
  id: UUID;
  ownerScope: OwnerScope;
  schemaVersion: positive integer;
  version: nonnegative integer;
  createdAt: ISO timestamp with offset;
  updatedAt: ISO timestamp with offset;
  deletedAt?: ISO timestamp with offset;
  sourceDeviceId: UUID;
  hlc: validated HLC string;
}
```

Shared primitives:

- `EntityIdSchema`: canonical UUID; implementations generate UUIDv7.
- `TimestampSchema`: timezone-aware ISO-8601, normalized to UTC on write.
- `ConfidenceSchema`: number from 0 through 1 plus optional level `low | medium | high`; do not store only a prose label.
- `MoneyRangeSchema`: `{ lowMinor, highMinor, currency, confidence, disclaimer: "estimate_not_appraisal" }`, nonnegative and low <= high.
- `QuantityRangeSchema`: finite low/high, explicit unit, low <= high.
- `SourceRefSchema`: source ID, canonical URL, title, publisher, retrieved timestamp, verification/freshness status.
- `SafetyFlagSchema`: code, severity, observation basis, prohibited actions, official-source requirement, resolution state.
- `EvidenceRefSchema`: asset ID, kind, capture time, redaction/validation status; never raw bytes or a durable signed URL.
- Text is Unicode-normalized, length-limited per field, and stored as plain text. HTML is never accepted from model/user schemas.
- JSON export parses the envelope first, then dispatches each record by `entityType` and `schemaVersion`. Unknown newer versions are rejected with a non-destructive report.

### 9.2 Required schemas

#### `InvestigationSchema`

Fields: `SyncMeta`; `mode: single_object | room_move`; required bounded `goal`; optional `deadline`; `approximateArea` (general locality/postal code only); `preferenceMode: maximize_money | minimize_waste | finish_fastest | minimize_travel | minimize_effort | balanced`; `status` exactly `draft | inventory_review | investigating | awaiting_evidence | evaluating_pathways | awaiting_approval | action_ready | awaiting_verification | completed | blocked | cancelled`; confirmed object IDs (max eight for room mode); active object ID; unresolved question IDs; run ID; blocked reason; completion time. Cross-field refinements enforce a deadline for move mode and prohibit `completed` with unresolved required approvals.

#### `ObjectPassportSchema`

Fields: `SyncMeta`; investigation ID; `userConfirmedName`; optional primary `EvidenceRef`; category/subcategory; probable identity/brand/model each with confidence/evidence; probable materials list; current space; ownership status; acquisition date; estimated age range; condition; functionality; repairability; maintenance needs; warranty information; manual/replacement-part/recall source links; estimated remaining `MoneyRange`; current recommended pathway ID; alternative pathway IDs; observations; inferences; assumptions; uncertainty; safety flags; source links; history/revision IDs; completed mission IDs; verification IDs; credits earned as a non-authoritative projection; lifecycle status/catalog view flags; required consumer-passport disclaimer version. No image bytes, receipt contents, or exact address.

#### `ObservationSchema`

Fields: `SyncMeta`; object/investigation IDs; `origin` exactly `directly_observed | user_reported | externally_retrieved | inferred | estimated`; bounded statement; typed structured value; confidence; evidence/source references; observation timestamp; actor type; model/tool version when applicable. A refinement requires evidence for directly observed claims and source refs for externally retrieved claims.

#### `HypothesisSchema`

Fields: `SyncMeta`; object/investigation IDs; kind (`identity | brand | model | material | condition | safety | pathway | other`); claim; confidence; `status: active | supported | contradicted | rejected | superseded`; supporting/contradicting observation IDs; missing evidence; resolution time; superseding ID. Hypotheses cannot be presented as observations.

#### `EvidenceRequestSchema`

Fields: `SyncMeta`; object/investigation IDs; unresolved question; reason; `evidenceType: image | document | user_answer | safe_visual_check | partner_confirmation`; current confidence; safety context; instruction; target area; framing guidance; capture mode; optional physical test; prohibited actions; completion criteria; accessibility alternative; `status: requested | fulfilled | declined | expired | cancelled`; fulfilled evidence IDs/time. A safety refinement forbids a physical test when a blocking safety flag exists.

#### `PathwaySchema`

Fields: `SyncMeta`; object/investigation IDs; pathway type from the complete circular hierarchy (`avoid_replacement`, `continued_use`, `maintenance`, `repair`, `upgrade`, `share`, `lend`, `resell`, `direct_transfer`, `donate_for_reuse`, `manufacturer_return`, `refurbish`, `components_recovery`, `material_recycling`, `compost`, `special_handling`, `dispose`, `unknown`); state; title/reason; requirements; source IDs; value/effort/travel/time ranges; deadline fit; confidence; disqualifiers; score ID; rank; evidence that could alter rank.

#### `PathwayScoreSchema`

Fields: pathway and ranking-run IDs; factor scores 0..1 for circular value, completion probability, evidence confidence, deadline fit, local availability, financial recovery, user effort, travel, and preference adjustment; weights summing to 1 within tolerance; `safetyLegalVeto`; total score; disqualifying factors; explanation; active preference mode; methodology version. Refinement forces disqualified/no rank when vetoed and recomputes total deterministically rather than accepting a model total.

#### `AgentEventSchema`

Fields exactly required by the brief: timestamp, allowlisted agent name, event type, bounded public summary, optional allowlisted tool name/object ID, `status: started | progress | paused | completed | failed | cancelled`, and `userActionRequired`. Also run/investigation IDs and monotonic sequence. Reject fields named reasoning, chainOfThought, prompt, rawResponse, image, token, or secret.

#### `MissionSchema`

Fields: `SyncMeta`; object/investigation IDs; objective; reason; required evidence; ordered typed steps; deadline; effort/cost/recovery ranges; safety notes; approval state; exact mission state `proposed | awaiting_evidence | ready | awaiting_approval | approved | in_progress | awaiting_verification | verified | completed_unverified | blocked | cancelled`; verification requirement; available prototype credits; selected/fallback pathway; dependency mission IDs; completion time. State transition refinement uses the canonical mission state machine and never permits `verified` without a verification result.

#### `UserApprovalSchema`

Fields: `SyncMeta`; investigation/mission IDs; action type; user-visible scope and payload summary; risk/side effects; `status: requested | approved | rejected | expired | revoked`; requested/resolved/expiry timestamps; actor; decision reason; single-use idempotency key. It never contains an external secret or raw third-party message body.

#### `VerificationResultSchema`

Fields: `SyncMeta`; object/mission/claim IDs; claimed outcome; decision exactly `approved | approved_with_reduced_confidence | revision_required | additional_evidence_required | safety_escalation | blocked`; supported action outcome; `verificationLevel: partner_verified | document_supported | visually_supported | user_attested | insufficient_evidence | rejected`; evidence summary/refs; verifier; confidence; sources; limitations; fraud flags; credit eligibility/amount/explanation; follow-up request; methodology/model version. Refinements force zero credits for insufficient/rejected, scan-only, unknown, or disposal outcomes.

#### `CreditLedgerEntrySchema`

Fields: immutable IDs/references; `entryType: award | reversal | adjustment | expiry`; pathway/action; base score; verification multiplier; value-retention multiplier; effort multiplier; environmental-confidence modifier constrained 0.80..1.20; signed integer amount; verification level; claim/idempotency key; methodology version; explanation; created time; optional superseded entry. Deterministic refinement checks rounded formula for awards and zero for ineligible actions. It always carries the prototype/no-value disclosure version.

#### `LocalPathwaySourceSchema`

Fields: `SyncMeta`; pathway ID; source priority/type; organization/title; canonical HTTPS URL; publisher; jurisdiction; optional coarse location/hours; eligibility; retrieved/published/expiry timestamps; verification status; limitations; confidence; content fingerprint. A displayed current-local pathway requires at least one unexpired verified source, otherwise the pathway carries the mandated cannot-verify message.

#### `MovePlanSchema`

Fields: `SyncMeta`; investigation ID; deadline; ordered plan; daily plan; grouped trips; urgent actions; mission dependencies; fallback pathways/dates; expected completion date; deadline risk; user availability/travel constraints; plan version; approval state. Maximum eight launch objects and no cyclic mission dependencies.

#### `PreferenceProfileSchema`

Fields: `SyncMeta`; optional first name/general location/postal code; household/occupancy types; transportation options; travel radius; repair comfort; minimum resale `MoneyRange` threshold; donation, accessibility, reward, regeneration, privacy, and notification preferences; ranking mode; agent-memory consent/version. It rejects inferred sensitive characteristics and precise coordinates. Regeneration preferences carry `preferenceOnly: true` in the MVP.

### 9.3 Additional required domain schemas

- `SpaceSchema`: name/kind/order/archive state.
- `EvidenceAssetSchema`: metadata, hashes, validation/redaction, consent, storage locator, retention; no public URL/raw data.
- `AgentRunSchema`: bounded turns/tools/retries, versions, mock disclosure, state.
- `AgentStateSnapshotSchema`: safe serializable orchestrator state, state hash, prior hash, pause reason; explicitly excludes images, secrets, chain of thought, full prompts/responses.
- `RecommendationRevisionSchema`: old/new recommendation, triggering evidence, explanation, confidence and ranking versions.
- `CircularActionEntrySchema`: every required action ledger field and supported outcome.
- `CircularValueEntrySchema`: all required monetary, life, time, trip, and item metrics as exact values or ranges with assumptions and units.
- `ClimateImpactEntrySchema`: required impact category; tier A/B/C/D; range/unit/boundary/baseline/alternative/displacement/sources/method/confidence/uncertainty/date/limitations; Tier D requires an unavailable reason and forbids numeric estimates.
- `CreditClaimSchema`: claim/evidence hashes, active status, fraud flags, daily cap metadata.
- `SyncOperationSchema`: operation ID, entity type/id, base version, patch or tombstone, HLC, device, idempotency key; payload parsed again by entity schema.
- `SyncConflictSchema`: base/local/remote values, conflicting field paths, policy, resolution state.
- `TombstoneSchema`: entity type/id, causal version/HLC, deleted time, reason code; no deleted payload.
- `MigrationManifestSchema`: schema/export version, local profile/device, counts, ordered content hashes, evidence choices, created time.
- `ExportEnvelopeSchema`: product/export/schema versions, generated time, account/local scope, record arrays, checksums, redaction flags; secrets and analytics excluded.
- `DeletionRequestSchema`: scope (`investigation | object | local_all | cloud_account`), target IDs, reauthentication proof reference for cloud account, export offered/accepted, confirmation phrase, idempotency key.

Canonical domain definitions should generate TypeScript types (`z.infer`) and be imported by API, repository, sync, export/import, mock fixtures, and tests. SQL constraints mirror security- and money-critical invariants; Zod alone is not a database security boundary.

## 10. Local-to-cloud migration

### 10.1 Preflight

1. Complete authentication and verify the server session.
2. Acquire a local migration lease; ordinary writes continue into an outbox but the migration snapshot is immutable.
3. Validate/migrate every local record to the current Zod version. Show quarantined-record errors before any upload.
4. Build a manifest containing record counts, dependency order, hashes, and requested evidence choices. Never include raw bytes in the manifest.
5. Fetch the existing cloud summary and show a merge preview. Default to merge; never silently replace either catalog.
6. Obtain separate consent for each class of durable evidence. “Sync my catalog” does not imply “retain all raw images.”

### 10.2 Import protocol

1. Call a server migration endpoint with an idempotency key and manifest hash. It creates/resumes `migration_batch` owned by the authenticated user.
2. Upload metadata in dependency-ordered chunks: profile/spaces/investigations/objects, evidence metadata, observations/hypotheses/requests, pathways/sources, missions/approvals/revisions, verification and ledgers, move plans, safe agent state.
3. Preserve entity UUIDs. The server ignores any uploaded owner ID and assigns `auth.uid()`.
4. Parse each batch with Zod; enforce FKs, RLS-equivalent owner checks, and server-authority rules. Locally computed prototype verification/credits are imported as `legacy_local_unverified`, not as authoritative cloud awards; trusted server code revalidates/recomputes them.
5. Upload consented evidence separately to immutable private paths using short-lived signed upload authorization. Verify checksum/validation before connecting it to a record.
6. Server returns per-item status and final manifest checksum. Client pulls the resulting cloud state and compares counts/hashes.
7. Only after verification does client mark records account-scoped and clear the migration lease. Keep local cached copies for offline use; do not duplicate them under both owners.

Migration is restartable. A failed batch is not visible as a partially migrated catalog until its aggregate roots are valid; resumable item status avoids re-uploading accepted chunks.

### 10.3 Existing-account collisions

- Same stable entity ID and same content hash: idempotent no-op.
- Same stable ID with divergent content: normal three-way conflict resolution.
- Different IDs with probable duplicate fingerprint (normalized identity + acquisition clue + perceptual image hash): retain both, suggest a user-confirmed merge, never auto-merge from model similarity.
- Profile: merge per field; explicit cloud privacy preferences choose the more privacy-preserving value until the user decides.
- Evidence: retain both immutable assets; duplicate hashes may share a duplicate group but not cross-user bytes/paths.

## 11. Cross-device sync and conflict resolution

### 11.1 Protocol

IndexedDB remains the working set. Each mutation writes an outbox item with `baseVersion`, domain patch, tombstone or append event, HLC, device ID, and idempotency key.

1. **Push:** send ordered, bounded operations. Cloud mutation uses compare-and-swap (`expectedVersion`) inside a transaction. It returns accepted versions or typed conflicts.
2. **Pull:** request `app_private.change_log` entries after the owner's opaque sequence cursor, page by page. Fetch/parse the referenced current entities, apply them atomically, then advance the local cursor.
3. **Realtime:** use a private Supabase Broadcast channel as an invalidation hint (“changes available after cursor N”), not as the durable event stream. Pull remains authoritative after reconnect, missed messages, app suspension, or token refresh. Supabase recommends Broadcast for scale/security; see [database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes).
4. Sync runs after sign-in, network restoration, app foreground/focus, successful local write debounce, and explicit refresh. Do not depend on iOS background service-worker execution.
5. Backoff uses jitter and a cap. Auth/rate-limit/validation errors stop blind retries and preserve the outbox with user-facing recovery.

### 11.2 Ordering and clocks

Cloud `version` and change-log `sequence` are authoritative. HLC combines server-adjusted wall time, local counter, and random device ID only to produce a deterministic tie-break for concurrent offline edits. Raw client wall-clock “last write wins” is prohibited because clocks drift and can be manipulated.

### 11.3 Merge policies

| Data | Concurrent policy |
| --- | --- |
| Append-only observation/events/ledger entries | Set union by stable ID/idempotency key; never overwrite |
| Passport/profile scalar field | Three-way field merge; one-side-only change wins; true concurrent change uses HLC but records a visible conflict for user-confirmed identity, space, ownership, privacy, and accessibility fields |
| Tags/materials/source links | Set union; explicit removal uses an element tombstone |
| Ordered mission steps/plan | Three-way ordered merge if edits touch separate step IDs; otherwise require user resolution |
| Mission status | Validated state-machine join; never regress. Safety escalation/block dominates active states. Verified requires authoritative verification. Conflicting terminal states require review |
| Pathway rank/derived estimate | Recompute server-side from merged evidence and methodology version; never merge numeric outputs |
| Evidence blobs | Immutable; keep both, group exact/perceptual duplicates, user decides |
| Credits/verification | Server authoritative; union valid server entries, reject client overwrite/recalculation |
| Deletion | Causally later deletion wins. Concurrent edit after unseen deletion is quarantined and offered as a new restored record, never silently resurrected |

Every auto-resolution produces a `resolutionReason` and the prior values remain in bounded revision history. “Why this changed” uses recommendation revisions, not raw sync conflict logs.

## 12. Export, import, and deletion

### 12.1 Export/import

- Anonymous export is generated entirely in the browser from a consistent IndexedDB snapshot.
- Account export is generated by an authenticated server job with owner-scoped queries. Notify only inside the app; email contains no archive. Download uses a single-use, short-lived URL.
- Default format is UTF-8 JSON `circloora-export-v1.json` with manifest, schema/product versions, checksums, domain records, source metadata, and tombstones needed for coherent import.
- Optional ZIP adds separately consented evidence files plus an asset manifest. Default export excludes raw images, auth identities/tokens, private provider metadata, analytics, internal fraud heuristics, prompts, chain of thought, service logs, signed URLs, and secrets.
- Import is preview-only before mutation: validate archive type/size/checksum/Zod versions, reject path traversal and active content, report counts/conflicts, then use the same migration engine. Never execute or render imported HTML.

### 12.2 Scoped deletion

- **Investigation:** delete investigation-only state; passports intentionally promoted to catalog require explicit inclusion.
- **Object:** show dependent missions, evidence, verification, ledgers, and plan effects. Confirm, tombstone aggregate, remove private assets, recompute summaries.
- **All local data:** close database connections/tabs, delete IndexedDB database, caches containing user records, local evidence, auth-scoped app cache, and service-worker user data; preserve only static app shell. Confirm completion by reopening and checking absence.
- **Cloud account:** require a fresh session/reauthentication, offer export, revoke devices/sessions, immediately disable access, enqueue owner-wide Storage and Postgres purge, then delete the Supabase Auth user. The API responds with job status, not a false claim of instantaneous backup erasure.

Delete requests are idempotent. Normal UI cannot hard-delete individual ledger entries to manipulate a balance; account/object purge removes the whole associated private history. Security/legal holds are not assumed for this consumer MVP; if introduced later they require explicit policy, notice, and scoped access.

## 13. Evidence and image handling

1. Decode, MIME-sniff, limit dimensions/bytes, resize, re-encode, strip EXIF/location metadata, preview, and require confirmation before any API transmission.
2. Raw capture remains an in-memory/file handle during the scan by default. Persist only a derived observation and an asset receipt saying no durable image was retained.
3. “Save evidence for this mission/account” is separate, granular consent. Explain purpose, location (device/account), retention, and deletion.
4. Durable cloud evidence goes only to `evidence-private`; never analytics, public buckets, model traces, logs, source URLs, or catalog HTML metadata.
5. Compute cryptographic SHA-256 for exact duplicate detection and a reviewed perceptual hash for warning purposes. Cross-user hash matching must not reveal that another user has the same file.
6. Run server validation/malware scanning for documents, re-decode images, reject SVG/HTML/polyglot/unsupported formats, and produce sanitized immutable variants. OCR output is minimized to claim-relevant fields; full receipt contents are not retained.
7. Face/address/document detection is a warning/crop assist only. Facial recognition/identity inference is prohibited. Do not store sensitive detection embeddings.
8. Model access uses only the confirmed sanitized variant and minimum necessary context. Temporary processing handles are purged after the run/expiry and are never reused for training or advertising by Circloora.

## 14. Data classification and handling

| Class | Examples | Storage/transmission rules |
| --- | --- | --- |
| C0 Public | methodology, generic UI copy, official public source URLs | May be cached/public; provenance required |
| C1 Internal non-user | build version, redacted aggregate health metrics, mock fixtures | No user content; limited logs |
| C2 Private pseudonymous | catalog/passports, missions, approximate locality/postal code, preferences, estimates, credits | Owner-scoped IndexedDB or RLS; encrypted in transit; no ad use |
| C3 Sensitive private | raw images, receipts, free-form notes, exact timestamps/locations, repair/safety evidence, accessibility settings | Minimize; explicit consent for durability; private bucket; short access/retention; redact logs/analytics |
| C4 Restricted secret/security | sessions, OAuth state/verifier, provider secrets, OpenAI/service-role keys, detailed abuse signals | Secret manager or secure cookies/server only; never domain store/export/client/log |

Accessibility preferences are treated as C3 even though they improve the experience. General location is C2; exact address/coordinates are not collected for the MVP. Object ownership and household contents can reveal behavior and are always private even without an account.

Analytics receives event name, coarse mode, success/failure code, build/schema version, and a rotating pseudonymous analytics ID only after consent/configuration. It never receives entity IDs, raw images, location/postal code, receipt/OCR, free text, source query, safety details, model prompt/response, or auth identifier.

## 15. Retention schedule

| Data | Default retention | Disposal |
| --- | --- | --- |
| Anonymous local domain records | Until user deletes, browser evicts storage, or user imports into account; warn that device storage is not guaranteed | Delete database/cache; export optional |
| Raw unconfirmed image | Current capture session only | Release memory/file handle on cancel/navigation |
| Confirmed transient analysis image | Processing duration; hard target <=24 hours for failed cleanup paths | Delete temporary object/handle and signed access |
| Explicitly saved evidence | Until mission outcome + 30 days by default; user may choose “until I delete,” with a visible setting | Purge blob and mark asset purged; retain minimal verification fact if object remains |
| Receipt/document sanitized evidence | Mission outcome + 30 days maximum by default | Purge file/OCR; retain only necessary verification summary/hash where justified |
| Agent state snapshot | Active investigation + 30 days; retain latest safe terminal snapshot with investigation until deletion | Scheduled purge, preserve domain outcomes/revisions |
| Public agent events/traces | User feed with investigation; internal detailed trace 30 days | Delete detailed trace; retain redacted error aggregate |
| Sources/methodology inputs | With linked record, refresh at expiry; source page copies are not retained unless licensed/required | Remove orphaned source rows |
| Idempotency entries | 24 hours after last safe retry window | Scheduled purge |
| Migration files/status | Temporary archive 24 hours; batch metadata 30 days | Purge archive/items, retain minimal success/error count only if needed |
| Security/rate-limit events | 30 days normally; suspicious abuse signals up to 90 days with access restriction | Scheduled purge/anonymization |
| Deleted cloud user data | Inaccessible immediately; active stores/assets purged target <=7 days, no later than 30 days | Purge job with verification; backups expire under documented provider schedule |

The production privacy notice must state actual Supabase, Vercel, OpenAI, analytics, log, and backup retention—not aspirational numbers. Launch review must verify vendor data controls and update this table if their real configuration differs.

## 16. Required architecture acceptance tests

Implementation agents must add at least:

### Repository and schema

- Both repository implementations pass one contract suite for CRUD, pagination, expected-version conflict, tombstone, and transaction behavior.
- Every persisted fixture and API body parses with the same canonical Zod schema; unknown fields/version fail safely.
- IndexedDB upgrade from each supported version preserves counts, IDs, and ledger totals.
- Default persistence/export/agent state contains no raw bytes, data URLs, signed URLs, secret/token fields, prompt, or chain of thought.

### Identity/migration

- A first scan and full mock workflow work with network disabled and no account/Supabase request.
- Apple, magic-link, and enabled Google callbacks reject unallowlisted redirect/state/PKCE failures.
- Migration into empty and populated accounts is idempotent and restartable; owner ID is always server-derived.
- Existing-account merge never loses local/cloud records; duplicate suggestions require user confirmation.
- Local prototype credits cannot become authoritative cloud credits without server recomputation.

### RLS/storage

- For every table and Storage operation, user A cannot select/insert/update/delete user B data by ID, foreign key, guessed path, bulk filter, realtime subscription, RPC, or signed URL.
- Anonymous/public roles cannot access product tables/buckets.
- Client cannot mutate owner, server-derived observations, verification, score, or ledger values.
- Parent/child owner mismatch and path/metadata owner mismatch fail.
- Expired signed URLs and revoked sessions fail; public URL generation is impossible for evidence.

### Sync/deletion

- Concurrent edits exercise all merge-policy rows, clock skew, duplicated delivery, reorder, offline delete/edit, and missed realtime notifications.
- Cursor resumes without gaps/duplicates across pages and token refresh.
- Mission state never regresses and credits/ledgers remain idempotent.
- Object/investigation/local-all/account deletion removes the documented scope; purge jobs retry safely; export-before-delete remains readable.
- Evidence expiry removes bytes while preserving the minimum user-visible verification explanation.

## 17. Delivery sequencing and interface ownership

1. Build Director locks canonical domain schemas, state machines, methodology version fields, and ownership conventions.
2. Foundation creates schema package and repository interfaces only; no adapter-specific types leak into components.
3. Authentication/Cloud-Data agent owns IndexedDB/Supabase adapters, migrations, Postgres/RLS/Storage policies, sync, export, and deletion.
4. Camera agent consumes `EvidenceRepository` and `EvidenceAssetSchema`; it does not write Storage paths or image blobs into passports directly.
5. Runtime agents consume repositories and safe `AgentStateSnapshotSchema`; they do not persist raw prompts/responses or issue authoritative credits.
6. Catalog/Missions/Impact agents use canonical aggregate and append-only ledger interfaces. Any schema conflict returns to the Build Director.
7. Security/Privacy/QA agents test RLS, provider flows, data minimization, purge behavior, and client bundle secret absence before cloud accounts are enabled.

## 18. Explicit limitations and risks

- Anonymous local data is device/browser specific, may be evicted, and cannot synchronize. Export reminders mitigate but do not remove this limitation.
- IndexedDB does not provide strong at-rest secrecy against same-origin script compromise or device access.
- Cross-device merge of long offline ordered plans can require human conflict resolution; automatic sequence merging is intentionally conservative.
- Sign in with Apple's secret rotation and private relay email handling create recurring operational work.
- Supabase RLS is only effective if every exposed table/function/storage path is covered and service-role code cannot accept forged ownership.
- Durable evidence creates materially higher privacy and breach impact; keeping it opt-in and short-lived is a product requirement, not a backlog polish item.
- Cloud deletion cannot retroactively remove an archive already downloaded by the user and may not immediately erase provider backups. Wording must distinguish immediate access revocation from final purge.
- Methodology and credit ledgers need server-authoritative versions. Allowing offline prototype outcomes means some migrated entries will remain visibly unverified until recomputation.
- “Sync” must not imply iOS background reliability; the foreground pull protocol is the correctness mechanism.
