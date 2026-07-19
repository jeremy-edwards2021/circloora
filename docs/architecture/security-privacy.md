# Circloora security and privacy architecture

Status: Phase 1 architecture proposal  
Scope: threat model, browser/server boundaries, CSP and headers, evidence handling, abuse controls, agent security, privacy, administration, vendor controls, deletion, retention, preview protection, and launch acceptance tests  
Non-goal: production implementation

## 1. Decision summary

Circloora handles unusually revealing consumer data: photographs of homes and possessions, receipts, approximate location, object history, and agent-generated inferences. Its launch architecture therefore uses five non-negotiable controls:

1. **Anonymous means local-first.** Anonymous catalog, investigation, mission, and ledger records live in IndexedDB. A random local profile ID is not an account credential and is not sent to Supabase or analytics. Live AI still requires an explicit, confirmed transmission through Circloora's server; it does not silently turn the user into a remote account.
2. **Raw evidence is ephemeral by default.** Captures remain in memory or a temporary file handle, are minimized and sanitized before transmission, and are not put in IndexedDB, Supabase Storage, logs, analytics, traces, exports, agent state, or public URLs unless the user separately chooses durable evidence storage.
3. **The browser never holds authority.** OpenAI calls, current-source searches that use paid credentials, authoritative verification, credit awards, signed evidence access, and privileged Supabase work happen on trusted server routes. Owner IDs, award fields, storage paths, and authorization scopes are derived server-side.
4. **Models are untrusted planners, not security principals.** Text in images, OCR, receipts, QR codes, webpages, user input, and tool results is untrusted data. Deterministic code owns authorization, validation, safety vetoes, ranking arithmetic, credit arithmetic, rate limits, and approval enforcement.
5. **Live service is gated on deploy-time security.** Mock mode may ship without cloud providers. Live OpenAI, cloud accounts, optional evidence storage, analytics, realtime voice, and production administration each stay disabled until their own acceptance gates pass in the environment where they will run.

This document extends, and must not fork, `data-identity.md`. In particular it adopts that document's owner scopes, repository interfaces, RLS policy shape, private `evidence-private` bucket, local-to-cloud migration protocol, deletion jobs, and retention schedule.

## 2. Security objectives and exclusions

### 2.1 Objectives

- Preserve confidentiality of household contents, documents, location, preferences, account data, and evidence.
- Prevent one account, anonymous session, preview visitor, or administrator from reading or mutating another user's data.
- Prevent client or model manipulation of verification, ledgers, safety vetoes, methodology, and Credits.
- Keep OpenAI, Supabase, Vercel, analytics, and realtime data flows explicit and minimal.
- Make an investigation resumable without persisting raw images, private reasoning, raw prompts/responses, or secrets.
- Resist malicious uploads, decompression bombs, parser exploits, prompt injection, SSRF, replay, automated cost abuse, and duplicate reward claims.
- Give the user reliable export and deletion controls in both local and account modes.
- Produce enough redacted operational evidence to investigate failures and abuse without creating a shadow copy of user content.

### 2.2 Explicit exclusions for the MVP

- No facial recognition, face matching, biometric identification, sensitive-trait inference, or person search.
- No exact address or precise GPS collection. Use postal code or general locality only when the user supplies it.
- No public evidence sharing, public object profiles, public Storage buckets, or guessable asset URLs.
- No arbitrary URL fetcher, browser automation, shell, code execution, remote MCP server, email sender, marketplace publisher, payment, booking, or autonomous third-party contact tool.
- No real cash, transferable reward, redemption, carbon asset, or environmental commodity.
- No production “debug admin” view. Development fixtures cannot access production data.
- No claim that browser-local IndexedDB is encrypted at rest. It is origin-isolated and remains readable to same-origin script or a person with access to the device profile.

## 3. Trust boundaries and data flow

```text
Untrusted capture / user text / imported JSON
                 |
                 v
Browser validation, crop, preview, confirmation
  |              |                         |
  |              |                         +--> consented IndexedDB evidence blob
  |              |                              (optional, device-only)
  |              v
  |        Same-origin API + CSRF + session binding
  |              |
  |              v
  |       Trusted Next.js server boundary
  |       - auth/session verification
  |       - request and file validation
  |       - rate/cost/idempotency controls
  |       - evidence sanitization
  |       - deterministic authorization/calculation
  |       - safe structured logging
  |          |              |               |
  |          v              v               v
  |       OpenAI       Supabase*       Web search/provider*
  |       minimum      owner-scoped     coarse query, bounded output
  |       context      RLS/private
  |                    Storage
  v
IndexedDB canonical domain state
(anonymous authority; signed-in working set/cache)

* disabled until configured and independently accepted
```

The service worker may cache only static app shell and deliberately selected, already-local catalog responses. It must never cache API POSTs, evidence, signed URLs, auth callbacks, realtime credentials, exports, deletion responses, or user-specific HTML.

### 3.1 Anonymous live-analysis session

Anonymous local mode needs a server boundary for OpenAI without creating a cloud identity. The contract is:

- The server issues a short-lived, opaque anonymous session cookie only after a same-origin user action. It contains or references a random value, issued/expiry time, version, and authenticated signature. It contains no local profile ID, email, catalog ID, or fingerprint.
- Cookie flags are `HttpOnly`, `Secure` outside local development, `SameSite=Lax`, `Path=/`, and a host-only name. Rotate it and cap its lifetime; it is an abuse/CSRF binding, not a durable identity.
- Every mutating or costly API request validates the cookie, an Origin/Host allowlist, `Sec-Fetch-Site` when present, and a single-session CSRF token sent in a custom header. CORS is same-origin only. A missing browser metadata header is not by itself proof of a non-browser client; authentication and rate limits still apply.
- Anonymous requests never receive Supabase product-table credentials and never write owner data to Postgres or Storage. The normalized result returns to the browser and is persisted in IndexedDB.
- An anonymous request may use a short-lived transient processing handle and a privacy-preserving rate-limit key. It does not create a durable remote profile. Server failure cleanup is targeted within 24 hours, not described as instantaneous.
- Local Credits are visibly non-authoritative prototype entries. Account migration imports them as `legacy_local_unverified`; trusted server code must revalidate and recompute before any authoritative cloud ledger entry.

This resolves the anonymous/live-agent seam: a complete mock workflow can remain offline, while live AI is an explicit online processing event without silently enabling cloud accounts.

## 4. Threat model

### 4.1 Assets

| Asset | Sensitivity | Consequence of compromise |
| --- | --- | --- |
| Raw room/object images, receipt/document evidence | Restricted user content | Reveals household, people, addresses, purchases, serial numbers, routines, or safety conditions |
| Catalog, Passport, missions, history, preferences | Private | Reveals possessions, value, location, deadlines, accessibility needs, and behavior |
| Auth sessions, OAuth state/PKCE, realtime client tokens | Restricted credential | Account takeover or live API misuse |
| OpenAI, Supabase service-role, OAuth, Vercel bypass, sealing and hashing keys | Critical secret | Cross-user access, provider cost abuse, state forgery, or preview bypass |
| Verification and four ledgers | Integrity-critical | Fraudulent Credits, false outcome/environmental claims, loss of trust |
| Agent state, approvals, public activity events | Private/integrity-critical | Recommendation tampering, replay, approval substitution, or sensitive trace disclosure |
| Sources and current local pathway results | Integrity-critical | Unsafe travel/handling advice or fabricated current programs |
| Logs, traces, analytics, backups | Secondary sensitive store | A hidden duplicate of content with broader internal access |

### 4.2 Adversaries

- An unauthenticated attacker probing APIs, previews, health output, uploads, and auth redirects.
- A malicious or compromised signed-in user attempting IDOR, mass assignment, cross-tenant Storage access, claim duplication, or cost exhaustion.
- A malicious file crafted to exploit a decoder/OCR/PDF parser, exhaust memory/CPU, or smuggle active content.
- Prompt injection embedded in a label, receipt, QR code, webpage, imported record, or tool result.
- A compromised dependency, browser extension, same-origin XSS payload, service worker, or build pipeline.
- A malicious or careless operator with Vercel, Supabase, OpenAI, analytics, or admin access.
- A third-party provider breach or retention mismatch.
- An ordinary user accidentally photographing a face, personal document, address, access code, or payment information.

### 4.3 Threat and control register

| Threat | Primary controls | Residual risk / launch disposition |
| --- | --- | --- |
| Cross-site scripting reads IndexedDB or acts as the user | Nonce CSP, no raw HTML, contextual output encoding, dependency review, no third-party scripts by default, Trusted Types report-only evaluation | IndexedDB has no independent encryption boundary; any exploitable same-origin script is high severity and a launch blocker |
| CSRF starts paid runs or resolves approvals | SameSite cookie, Origin/Host and fetch-metadata checks, CSRF token bound to session, POST-only mutation, approval digest and idempotency | Browser bugs/extensions remain; re-auth is required for account deletion and privileged changes |
| IDOR/cross-tenant access | Server-derived owner, forced RLS, child-parent owner constraints, private bucket policies, negative multi-user tests | A service-role coding error can bypass RLS; privileged modules require independent review |
| Client forges safety, verification, score, or Credits | Server-owned fields, strict Zod contracts, deterministic recomputation, append-only ledgers, signed/idempotent results | Offline prototype entries are tamperable and must remain labeled non-authoritative |
| Malicious image/HEIC/PDF exploits parser or exhausts resources | Byte/pixel/page/frame caps, magic-byte sniffing, isolated decoder worker, re-decode/re-encode, malware scan for documents, timeout/memory limits, reject active formats | Novel parser vulnerabilities remain; decoder dependencies need rapid patching |
| EXIF/location or hidden receipt data leaks | Metadata stripping twice, privacy warning/crop, OCR minimization, no analytics/log/trace content, default ephemeral retention | Automated detection is not guaranteed; confirmation copy must not promise perfect redaction |
| Prompt injection invokes tools or changes rules | Treat all content as data, least-privilege dynamic tool exposure, strict schemas, server-owned authority, URL/SSRF policy, approval revalidation, independent verifier | Model output can still be misleading; deterministic gates and qualified UI are mandatory |
| SSRF through source or action links | No arbitrary fetch tool; only provider search; URL canonicalization; HTTP(S) only; block private/link-local/loopback/reserved destinations and unsafe redirects | DNS rebinding and redirect behavior must be tested against the actual fetch implementation |
| Duplicate images/receipts or replay earns Credits | Claim uniqueness, HMAC fingerprints, perceptual duplicate warning, timestamps, idempotency, daily caps, server recomputation, append-only reversals | Anonymous offline caps are resettable; no redemption and no authoritative migration without review |
| Automated model/realtime cost abuse | Distributed rate limit, concurrency lock, body caps, max 8 turns/12 tools/2 retries, timeouts, abort, budget alerts, provider quotas | IP-based controls can affect shared networks and can be bypassed; use multiple coarse signals and accessible challenge/retry paths |
| Signed URL leakage | Prefer same-origin authenticated evidence proxy; otherwise five-minute, purpose-bound URLs; never persist/log; no public bucket | Supabase signed URLs remain valid until expiry; keep expiry short because ordinary auth-key rotation does not revoke them |
| Preview exposes product/user data | Vercel Deployment Protection, isolated preview secrets/data, `noindex`, explicit callback allowlist, mock default | Share links/bypass tokens are bearer credentials and must be revocable and never placed in app links |
| Logs/traces/analytics become a content store | Allowlist event schemas, content-free logs, sensitive tracing disabled, analytics exclusions, short retention, role separation | Provider infrastructure may record request metadata; production notice must reflect actual vendor settings |
| Admin/insider reads evidence | No raw-evidence access by default, SSO/MFA, just-in-time role, reason/ticket, two-person break-glass for content, immutable audit | Provider console super-admins remain powerful; minimize membership and review quarterly |
| Deletion silently leaves copies | Scope preview, client store/cache deletion, access revocation, idempotent purge job, Storage/Postgres verification, vendor backup disclosure | Backups and user-downloaded exports are not immediately retractable; UI must distinguish access revocation from final purge |
| Supply-chain/build compromise | Lockfile, minimal dependencies, provenance/license review, automated audit, secret scan, protected branch, reproducible CI build, no untrusted PR secrets | Package-registry compromise remains; critical parser/runtime advisories block release |

## 5. Browser and server boundary

### 5.1 Browser responsibilities

- Camera permission after a user gesture; stop tracks on navigation/backgrounding and reinitialize intentionally.
- Initial byte/type/dimension checks, crop/retake, client resize/re-encode where supported, metadata removal, preview, privacy warning, and explicit confirmation.
- IndexedDB canonical state for anonymous mode and signed-in offline working set.
- Display public agent events, normalized observations/inferences, sources, confidence, approvals, and limitations.
- Hold only short-lived publishable credentials intended for browsers: a Supabase publishable key, optional PostHog project key, and server-minted realtime client secret. These are not authorization by themselves.

The browser must not:

- receive a permanent OpenAI key, Supabase service-role key, provider OAuth secret, sealing/HMAC key, Vercel bypass secret, or admin credential;
- decide ownership, RLS scope, authoritative verification, Credits, safety clearance, or methodology outputs;
- choose a Storage path containing an owner supplied as trusted authority;
- persist a signed URL, raw prompt/response, chain of thought, tool input/output, raw image-bearing SDK state, or secret;
- call OpenAI standard APIs directly.

### 5.2 Server responsibilities

- Validate authenticated Supabase identity using the Auth server, or validate the short-lived anonymous session. Never trust a posted user ID or a merely decoded, unverified token.
- Apply request, schema, payload, rate, concurrency, timeout, retry, idempotency, and abort limits before paid/provider work.
- Sanitize evidence and construct the minimum model input from confirmed evidence.
- Inject owner, environment, model, method, award, storage, tool availability, and source-policy fields.
- Re-run deterministic safety, ranking, verification, and Credits rules after model output.
- Resolve evidence by opaque ID and authorize every access. A model- or browser-supplied URL is never an authorization token.
- Return production-safe error codes and request IDs; keep internal stack/provider details server-side and content-free.

Use `server-only` imports for all privileged clients and config. OpenAI/image/PDF/OCR work runs in a bounded Node runtime, not a browser bundle or unconstrained edge middleware.

## 6. Content Security Policy and HTTP headers

### 6.1 CSP decision

Use a fresh cryptographically random nonce per HTML response and force dynamic rendering for nonce-bearing pages. The current Next.js App Router guidance notes that nonce CSP requires dynamic rendering and that Next applies the parsed nonce to framework scripts. See the official [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy).

Production baseline, formatted here for readability:

```text
default-src 'self';
base-uri 'none';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self' 'nonce-{RANDOM_PER_RESPONSE}' 'strict-dynamic';
script-src-attr 'none';
style-src 'self' 'nonce-{RANDOM_PER_RESPONSE}';
img-src 'self' data: blob:;
font-src 'self';
media-src 'self' blob:;
worker-src 'self' blob:;
manifest-src 'self';
connect-src 'self' {FEATURE_GATED_EXACT_ORIGINS};
frame-src 'none';
upgrade-insecure-requests;
```

Rules:

- Do not add `'unsafe-inline'` or `'unsafe-eval'` in production. Development may require `'unsafe-eval'` for framework debugging and must use a distinct development policy.
- Keep images same-origin by proxying private evidence through an authenticated route where practical. If a direct private Storage URL is required, add only the exact Supabase project origin; never add `https:` or `*`.
- Build `connect-src` from enabled features. Possible exact additions are the environment's Supabase HTTPS/WSS origin, consented analytics ingest origin, and OpenAI Realtime HTTPS/WSS origin. Standard OpenAI requests remain server-side and do not require a browser CSP allowance.
- Avoid third-party script loaders. The analytics adapter should send validated events directly rather than loading a permissive remote script. If a remote script later becomes essential, it needs nonce/SRI review and an updated threat model.
- Start a candidate policy in `Content-Security-Policy-Report-Only` on preview with a same-origin, rate-limited, content-free report endpoint. Fix violations, then enforce before release. Do not send DOM samples, full URLs, query strings, or user data to a third-party CSP collector.
- Evaluate `require-trusted-types-for 'script'` in report-only mode. Promote it only after Next.js, analytics, PWA, and accessibility testing prove compatibility; it is defense-in-depth, not a reason to weaken the nonce policy.

### 6.2 Required headers

| Header | Production value / rule |
| --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` only after the custom domain and every subdomain are HTTPS-ready; otherwise omit `preload` until verified |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer` to prevent object/source/preview paths leaking to external sites |
| `X-Frame-Options` | `DENY` as legacy defense in addition to CSP `frame-ancestors 'none'` |
| `Permissions-Policy` | `camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()`; add no capability without a feature review |
| `Cross-Origin-Opener-Policy` | `same-origin`; authentication uses redirect, not popup. If a reviewed provider forces a popup, narrow only the callback/auth surface rather than weakening the whole site |
| `Cross-Origin-Resource-Policy` | `same-origin` for app responses; explicitly classify any public static asset exception |
| `X-Permitted-Cross-Domain-Policies` | `none` |
| `Origin-Agent-Cluster` | `?1` |
| `X-Robots-Tag` | `noindex, nofollow, noarchive` on every preview; production private/user routes and exports also noindex |

Do not enable `Cross-Origin-Embedder-Policy` by default; it can break provider and media flows. If a HEIC/WASM implementation needs cross-origin isolation, self-host all relevant assets and complete a separate compatibility/security review.

### 6.3 Cache and CORS policy

- Auth callbacks, app HTML containing user state, evidence, agent/verification routes, realtime tokens, exports, deletion, `/api/health`, and signed-in API GETs return `Cache-Control: no-store`.
- Hashed static assets may use `public, max-age=31536000, immutable`. The static offline shell contains no user data.
- Never use `Access-Control-Allow-Origin: *` with product APIs. Default to no CORS header; if a future native client is added, use an exact origin allowlist and separate credentials design.
- Do not cache error bodies that may vary by authorization. Add `Vary` deliberately when a cacheable public response depends on an accepted header.
- Downloads use `Content-Disposition: attachment`, a safe server-generated filename, `nosniff`, and a fixed content type. Imported or uploaded active HTML is never rendered.

## 7. Upload, image, HEIC, and receipt security

### 7.1 One evidence pipeline

Every camera capture, library upload, additional evidence image, and verification receipt passes through the same state machine:

```text
selected -> client_checked -> previewed -> user_confirmed
         -> server_received -> quarantined -> decoded -> sanitized
         -> accepted_for_run -> transiently_processed -> purged
                                      |
                                      +-> separately consented durable evidence
```

Client checks improve feedback but confer no trust. The server independently validates the original bytes and the sanitized output.

### 7.2 Launch allowlist and limits

Initial allowlist:

- Still images: JPEG, PNG, WebP, HEIC/HEIF only.
- Receipt/document evidence: still image or PDF only. PDF support may remain feature-gated until the sanitizer and malware scanner pass the document suite.
- Reject SVG, HTML, XML, GIF/animation, TIFF, ZIP, Office files, executables, encrypted/password PDFs, embedded files, and unknown/polyglot types.

Proposed hard limits, enforced before and after decoding:

| Dimension | Limit |
| --- | --- |
| Client selection | 12 MiB per image; 8 MiB per PDF |
| Images per object/run | 4 |
| Room candidates | 8 |
| Decoded still | 40 megapixels, one primary frame, max side 12,000 px, aspect ratio 1:20..20:1 |
| Sanitized model image | longest edge target 2,048 px, quality bounded, max 4 MiB |
| Receipt PDF | 4 pages, 20 megapixels total after rasterization |
| Parsing | bounded CPU/memory with a short timeout; failure is a safe rejection, not a retry loop |

The implementation may lower these limits to match Vercel/request/provider limits. Raising them requires load and parser-abuse testing.

### 7.3 Type and parser validation

- Check extension only for user guidance. Trust neither extension nor browser MIME. Sniff magic bytes, require the detected type to match the allowlist, and fully decode.
- Reject extra trailing active content, implausible container structure, excessive metadata, multiple/animated frames, oversized ICC profiles, or decoder warnings that indicate truncation/polyglot data.
- Run native/WASM image and PDF parsers in a constrained worker/process with patched, pinned dependencies, memory/time limits, and no network access.
- Re-encode to a new JPEG or WebP pixel surface. Strip EXIF, XMP, GPS, thumbnails, comments, filenames, device IDs, depth maps, audio, and other auxiliary streams. The server repeats this even when the client claims it already did so.
- Malware-scan documents before OCR. Rasterize rather than exposing the original PDF to browser viewers or the model. Never execute PDF JavaScript, follow embedded links, extract attachments, or load external resources.
- Generate a new opaque asset ID and server-controlled immutable path. Never preserve a user filename in a URL or log.

### 7.4 HEIC/HEIF handling

HEIC is a container, not proof of a safe single photo. The decoder must cap item count, dimensions, decoded pixels, metadata size, auxiliary/depth images, sequences, and processing time before allocating full buffers. Select only the primary still item and ignore auxiliary tracks. Re-encode to the canonical sanitized format; do not upload the original HEIC to OpenAI.

Prefer native browser decoding followed by canvas re-encode when reliable. Otherwise use a reviewed, pinned local decoder behind feature detection. If neither works, preserve the investigation and tell the user to retake with Circloora Lens or upload a JPEG/PNG. Never silently fail or upload the unsupported original as a fallback.

### 7.5 Faces, addresses, documents, and receipts

- Before transmission, warn when an assistive detector may have found a face, address, personal document, license plate, access code, payment card, or sensitive material. Offer crop or retake. Detection is best-effort and the copy must not promise perfect detection.
- Facial recognition, identity inference, demographic inference, and face embeddings are prohibited. Privacy detection output is a transient crop warning only.
- Receipt OCR extracts only claim-relevant fields: merchant class/name when needed, coarse date, total/range when needed, and a masked transaction reference. Drop line items unless required for the claimed object; drop payment-card fragments, loyalty IDs, addresses, email/phone, cashier names, signatures, barcodes, QR payloads, and unrelated purchases.
- Never follow a QR code, barcode URL, or link found in evidence. It may be shown as untrusted text only if relevant and safe.
- Persist a short verification summary and evidence level, not the full OCR. Sanitized receipt evidence expires at mission outcome plus 30 days maximum by default.

### 7.6 Duplicate and abuse fingerprints

- Use SHA-256 locally for exact duplicate assistance. For server abuse records, store `HMAC(DUPLICATE_HASH_KEY, normalized_content_hash)` so an internal database leak cannot be used as a general file-membership oracle.
- Perceptual hashes are probabilistic warnings, never automatic proof of fraud. Scope lookup to the same owner/anonymous abuse bucket unless a narrowly reviewed cross-account fraud process is introduced.
- Never reveal that another user uploaded the same file. Return only a generic duplicate-review state.
- Fingerprints are security data, not analytics. Apply the 30/90-day security retention schedule and remove them during account purge unless a documented active abuse investigation requires a disclosed hold.

### 7.7 Transient and durable storage

- Unconfirmed capture: current browser session only; release on retake, cancel, navigation, app switch timeout, or crash recovery.
- Confirmed analysis image: memory or transient object only; delete on run completion/cancel. Failed cleanup is retried and has a hard target of 24 hours.
- Durable local evidence: isolated `evidenceBlobs` IndexedDB store only after granular consent, never loaded by ordinary catalog/search/export.
- Durable cloud evidence: private `evidence-private` Supabase bucket only after separate consent, immutable sanitized variant only, owner path and metadata enforced by RLS, explicit `retentionUntil`.
- A Passport stores an opaque `EvidenceRef`, not bytes, data URLs, signed URLs, source filename, full OCR, or Storage path.

## 8. Secrets and configuration

### 8.1 Classification

| Configuration | Browser exposure | Handling |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL`, feature flags | Allowed, non-authoritative | Treat as public and validate server-side independently |
| Supabase URL and publishable key | Allowed when cloud accounts enabled | RLS is the authorization boundary; key is not secret |
| PostHog project key/host | Allowed only after analytics review | Key is public; events remain schema-limited and consented |
| Realtime ephemeral client secret | Browser, short-lived and purpose-bound | Mint server-side after rate/auth checks; never cache/persist/log |
| `OPENAI_API_KEY`, `OPENAI_PROJECT_ID` where sensitive, Supabase service-role, OAuth secrets, `ANON_SESSION_SECRET`, state sealing and HMAC keys, Vercel bypass | Never | Server secret manager only; mark Vercel preview/production values Sensitive |

The official Vercel documentation distinguishes ordinary encrypted environment variables from [Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables), whose values become unreadable after creation. Use Sensitive values for production and preview secrets and separate values by environment.

### 8.2 Rules

- `.env.example` contains names and empty/example-safe values only. `.env.local`, provider downloads, Vercel link data where sensitive, key files, dumps, and exports are gitignored.
- No secret may use a `NEXT_PUBLIC_*` name. CI rejects suspicious secret names in client modules even if they appear unused.
- Use separate OpenAI projects/keys, Supabase projects, OAuth clients, analytics projects, and bypass credentials for development, preview, and production. Preview never receives production databases or provider keys.
- Scope provider keys to the smallest supported project/role, set provider spend/rate alerts, require MFA for dashboards, and keep team membership minimal.
- `ANON_SESSION_SECRET`, state-sealing key, duplicate-HMAC key, and rate-limit hashing key are independent random values. Maintain a versioned key ring for graceful state/cookie verification during rotation; never reuse an API key for HMAC or encryption.
- Secret rotation means add new version, deploy, verify, retire old version after the maximum token/state lifetime, redeploy, and test revocation. Suspected exposure skips the grace period where safe and invalidates sessions/states explicitly.
- Never interpolate env values into HTML, error text, logs, trace metadata, source maps, or the health response. `/api/health` reports booleans only.
- Production source maps are not publicly served. Build logs and artifacts are access restricted; do not rely on provider redaction as the primary secret control.

### 8.3 Release secret checks

- Secret scan git history, tracked/untracked source, generated output, `.next/static`, source maps, service worker/precache manifest, Playwright artifacts, and deployment logs.
- Search the client bundle for actual configured secret values in a controlled CI step without printing them.
- Assert privileged modules cannot be imported from a Client Component.
- Verify a rotated/revoked OpenAI key, Supabase service-role key, realtime token, and preview bypass no longer work as expected.

## 9. Authentication, Supabase, and account authorization

Adopt the identity architecture's PKCE flows, exact callback allowlists, neutral magic-link response, verified server session, and local-to-cloud merge preview.

Mandatory controls:

- Sign in with Apple and optional Google use exact environment callback URLs and a short-lived, single-use OAuth state/PKCE verifier. Only validated relative `returnTo` paths are accepted.
- Supabase session cookies are Secure in preview/production, HttpOnly where supported by the SSR integration, SameSite=Lax, host-only, and shortest practical lifetime. Never store auth tokens in domain stores, exports, analytics, or agent state.
- Enable and force RLS on every exposed owner table. Public/anon database roles have no product privileges. Grant authenticated roles only operations required by the data architecture.
- Every child row repeats owner for efficient policies and has a constraint trigger proving the parent has the same owner. Owner ID is immutable and server-derived for service operations.
- Server-derived observations, scores, verification, run state, sources, and all authoritative ledgers are owner-readable but not client-writable.
- Service-role code is isolated in a small server-only module. Each operation starts from a verified session, derives `auth.uid()` server-side, validates target ownership again, and accepts no caller-supplied owner override.
- `evidence-private` remains private. Storage policies bind bucket, first path segment, asset ID, owner metadata, and operation. No upsert/overwrite; sanitized variants use immutable names.
- Prefer authenticated same-origin evidence streaming. If signed URLs are necessary, mint them server-side for one asset/purpose, target five-minute expiry, omit them from logs/state, and never treat auth-key rotation as revocation. Supabase documents that [private bucket access is RLS-controlled](https://supabase.com/docs/guides/storage/buckets/fundamentals) and that signed URLs remain valid until expiry.
- RLS and grants are both required. Supabase's [API security guidance](https://supabase.com/docs/guides/api/securing-your-api) describes grants as object reachability and RLS as row reachability.

Cloud accounts remain disabled until the complete cross-user RLS/Storage/RPC/realtime test matrix passes against the deployed Supabase project.

## 10. Rate limiting, replay, and abuse controls

### 10.1 Limiter architecture

Define one `RateLimiter` interface used by every route and tool. A production live-AI deployment requires a distributed, atomic backing store or an equivalent Vercel Firewall/rate-limit control; in-memory serverless counters are test helpers only. If the distributed limiter is unavailable, high-cost live routes fail closed with a retryable error while local/mock use remains available.

Keys combine coarse signals without persistent fingerprinting:

- signed-in user ID HMAC or opaque anonymous session HMAC;
- privacy-preserving IP prefix HMAC (`/24` IPv4 or `/56` IPv6) derived only from verified Vercel request metadata;
- route/capability and environment;
- claim/object/mission idempotency key where relevant.

Do not trust a raw client `X-Forwarded-For`. Rotate rate-limit hashing keys on a documented schedule. Store no raw IP in the application security table.

### 10.2 Proposed launch limits

These are conservative defaults and configuration, not model-owned values:

| Capability | Burst | Longer window / additional control |
| --- | ---: | --- |
| Anonymous session issue | 5/min/IP-prefix | 30/day/IP-prefix; accessible challenge after threshold |
| Agent start | 3/min/session or user | 20/day anonymous, 60/day signed-in; one active run |
| Agent resume | 10/min/run | Max 8 model turns and 12 total tool calls across start/resume |
| Evidence upload | 8/min/session or user | 4 images/object; byte/pixel quotas enforced before parsing |
| Verification submit | 3/min/user/session | 10/day anonymous prototype, 30/day signed-in; one active claim/mission |
| Realtime token | 2/min/user/session | One active token; <=10-minute purpose/expiry; feature flag and budget cap |
| Magic link | 3/hour/email-HMAC and IP-prefix | Neutral response; provider limit also enabled |
| Export | 2/hour/user | One active job; archive expires in 24 hours |
| Account/local deletion request | 5/hour | Idempotent; fresh re-auth for cloud account |
| CSP report | 20/min/IP-prefix | Tiny schema/body; discard samples and query strings |

Return `429` with a safe stable error code, `Retry-After`, and a specific accessible next step. Do not reveal which fraud signal fired.

### 10.3 Cost and loop controls

- Eight confirmed objects per first room scan, four images per object, eight model turns, twelve tool calls, two automatic retries per failed tool, one active run per session, explicit timeout and `AbortSignal` propagation.
- Tool-specific timeouts and response-size caps. A provider timeout returns a bounded tool error, not an unbounded retry or fallback to invented information.
- Reserve the cost budget atomically before a model/tool call and release/settle it afterward. A resumed run uses the original run counters.
- Cache only normalized, non-sensitive derived observations by content/method/model version; never cache a raw image or cross-user private result.
- Provider/project hard quotas and budget alerts are the final cost circuit breaker. Mock mode is the safe degradation path.

### 10.4 Credits and verification abuse

- One active claim per object and mission; unique server claim/idempotency key; append-only award/reversal entries.
- Server timestamp and server recomputation own daily caps, verification multiplier, formula, and award. Client clocks and client-calculated totals are advisory only.
- Exact document/image HMAC, bounded perceptual warning, evidence reuse history, impossible cadence, repeated reversals, and linked duplicate missions can flag review.
- A flag reduces/holds the award; it does not accuse the user in UI. Manual review sees minimized summaries and no raw evidence unless a separately authorized evidence review is necessary.
- Scan, unknown outcome, disposal, insufficient evidence, and rejected evidence always earn zero. Safety veto always wins.
- Because MVP Credits have no value and no redemption, anti-abuse must remain proportionate. Do not build invasive cross-site/device fingerprinting.

## 11. Safe logging, tracing, analytics, and privacy telemetry

### 11.1 Logging contract

Use a centralized allowlist logger. Permitted application log fields:

```text
timestamp, level, requestId, routeTemplate, method, statusCode,
durationBucket, environment, buildVersion, actorKind,
safeErrorCode, modelConfiguredBoolean, mockBoolean,
turnCount, toolCount, retryCount, redactedProviderCode
```

Do not log request/response bodies, multipart fields, filenames, headers, cookies, query values, signed URLs, user/account/object/mission IDs, raw IP, postal code, source query, source page text, user notes, OCR, image/document hashes, evidence summaries, prompts, model responses, tool arguments/results, approval payloads, free-form exceptions, or stack traces containing input.

- Convert exceptions to known error codes at the boundary. Internal stack traces may enter a restricted error system only after recursive redaction and must never include request bodies or tool/model payloads.
- Redact exact secret values plus key-name and token patterns, but never use redaction as permission to log content in the first place.
- Production debug logging is off. Console output from SDKs/parsers is captured or disabled.
- Request IDs are random per request and safe to show to the user. They are not catalog or user IDs.
- Security events use their own restricted store and schema: category, coarse actor bucket, route, result, timestamps, count, retention, and reviewer action. No raw evidence.

### 11.2 OpenAI Agents tracing

The Agents SDK enables tracing by default in server runtimes and generation/function spans may contain inputs and outputs. The official [Agents SDK tracing guide](https://openai.github.io/openai-agents-js/guides/tracing/) provides `tracingDisabled` and `traceIncludeSensitiveData` controls.

Circloora production default is:

- `traceIncludeSensitiveData: false` for every run, enforced centrally;
- tracing disabled entirely for raw visual-analysis/root capture runs and whenever required by OpenAI Zero Data Retention;
- if redacted operational tracing is enabled, metadata is limited to workflow/version, random run correlation, agent/tool name, timing, count, safe status, and token/cost totals;
- no image, prompt, response, tool payload, local profile ID, account ID, object ID, postal code, source query, approval payload, or safety details in trace metadata;
- application public activity events are a separate, explicitly allowlisted product record, not a copy of SDK traces.

### 11.3 Analytics contract

Analytics is disabled/no-op when unconfigured and off until the user opts in. Honor Global Privacy Control and Do Not Track as opt-out. Do not use autocapture, session replay, heatmaps, form capture, ad tracking, or cross-site identity.

Allowed payload:

```text
eventName from the brief's fixed enum,
coarse mode/category,
success/failure code,
build/schema version,
viewport class,
mock/live boolean,
coarse duration/count bucket
```

Forbidden payload:

- raw images, thumbnails, image/document hashes, EXIF, filenames;
- precise location, postal code, source query, source URL with query, or organization/location name;
- receipt contents/OCR, price/transaction detail, personal notes, accessibility settings, safety details;
- user/account/local profile/device/object/investigation/mission/source IDs;
- model prompts, full responses, tool inputs/outputs, public event summary text, exception text;
- email, auth provider, IP, full user agent, API keys, cookies, signed URLs, or realtime tokens.

Enforce this with a strict analytics event schema that strips/rejects unknown keys and with unit tests containing seeded canary secrets and prohibited content. Use a short-lived random analytics session ID only if essential; do not join it to accounts. Clearing local data clears consent and any analytics identifier. Account deletion does not falsely claim deletion of anonymous aggregates that were never linkable to the account.

## 12. Prompt-injection and agent-tool defenses

### 12.1 Untrusted content rule

The following never become instructions, regardless of their wording: user text, image text, OCR, barcodes/QR, receipts, filenames, EXIF, imported records, webpages, search snippets, tool errors/results, and prior model output. Agent instructions explicitly label and delimit them as data, but prompt wording is only the first layer.

### 12.2 Enforced runtime controls

- Expose only tools required for the current object/category/state. The orchestrator does not expose every tool on every run.
- Every function tool uses strict Zod input/output schemas, bounded strings/arrays/numbers, enumerated operations, unknown-key rejection, and a server-controlled timeout. Parse both model arguments and provider/tool responses.
- Remove owner IDs, award amounts, methodology versions, storage paths, auth scopes, approval state, and arbitrary fetch targets from model-writable inputs. Trusted code injects them.
- Deterministic code owns pathway scoring, safety/legal veto, credit formula, evidence level constraints, duplicate/idempotency decisions, source freshness requirements, and mission state transitions.
- A source tool searches through the approved provider and returns normalized citations. It is not an arbitrary network client. If any direct fetch is later introduced, resolve DNS and every redirect, permit HTTP(S) only, block credentials, fragments, nonstandard ports by default, loopback, RFC1918/4193, link-local, metadata services, reserved IPs, and size/type/time excess.
- Never follow instructions or links found in evidence/source content. Do not expose shell, code execution, filesystem, admin, service-role, messaging, payment, listing, or browser automation tools to the consumer agent.
- Render model text as escaped text/controlled Markdown with raw HTML disabled. Canonicalize links, allow HTTP(S) only, add `rel="noopener noreferrer"`, and distinguish external/unverified destinations.
- Independent Verification Agent output still passes deterministic validation. “Approved” text is not an award or safety clearance by itself.
- Do not expose private chain-of-thought. Public events come from a fixed enum and short redacted summaries.

### 12.3 Human approval security

Approval is required before preparing any consequential action packet and again before any future external side effect. The approval record contains:

- authenticated/anonymous session binding;
- run, mission, object, action type, and canonical payload digest;
- human-readable exact scope and destination;
- requested/expiry/resolved time;
- one-time nonce and idempotency key;
- method/config version and safety state digest.

At execution, trusted code re-authenticates, reloads current object/safety/mission state, recomputes the digest, reruns input guardrails and authorization, and consumes the nonce atomically. Any payload, destination, evidence, ownership, deadline, safety, or method change invalidates the approval and requires a new preview. This prevents model substitution and time-of-check/time-of-use replay.

### 12.4 Pause/resume state

Two separate artifacts exist:

1. **Canonical domain snapshot:** Zod-validated normalized observations, hypotheses, source references, unresolved questions, counters, public events, approvals, and method/model versions. It contains no raw image, data URL, signed URL, prompt, response, tool payload, secret, chain of thought, or provider credential.
2. **SDK run envelope:** only if required for exact SDK resume, serialize after visual input has been reduced to normalized observations. Encrypt and authenticate it server-side as a versioned AEAD envelope bound to session/user, run, environment, schema version, sequence, expiry, and previous-state hash. It is opaque to the browser. Anonymous mode may keep the sealed envelope in IndexedDB and return it to the server; signed-in mode may store it owner-scoped. The server rejects oversize, expired, replayed, wrong-environment, wrong-owner, unknown-version, or authentication-failed envelopes.

Never treat deserialized SDK state as authorization. Revalidate tools, counters, ownership, approvals, safety, and all state transitions after opening it. Key rotation uses the versioned sealing key ring. Terminal/abandoned detailed state follows the 30-day retention schedule.

## 13. Admin and operational access

### 13.1 Roles

| Role | Allowed | Prohibited by default |
| --- | --- | --- |
| Support | Account status, redacted job/error state, user-provided request ID | Raw evidence, prompts/responses, secrets, ledger mutation, impersonation |
| Safety/verification reviewer | Assigned minimized claim summary, sanitized evidence only when required, record decision/reason | Browse/search all users, download original, alter methodology or award directly |
| Security operator | Rate/security event summaries, revoke sessions/keys, contain incidents | Ordinary catalog browsing or product-content access |
| Deployment operator | Vercel deploy/config health, environment booleans | Read sensitive env values after creation, user evidence |
| Break-glass administrator | Time-limited incident access approved by two authorized people | Standing use, unlogged access, bulk export |

### 13.2 Controls

- Separate staff identity from consumer Supabase Auth. Require organization SSO and phishing-resistant MFA where supported; otherwise hardware-backed MFA and a minimal allowlist.
- Authorization uses server-controlled role data, never `raw_user_meta_data`, email domain alone, a client flag, or Vercel Deployment Protection.
- `/admin` and admin APIs are server-authorized on every request, `no-store`, noindex, CSRF-protected, and preferably network/identity-proxy restricted. Production returns 404/deny when admin capability is disabled.
- No account impersonation. Support reproduces with fixtures or asks the user to export/share a deliberately redacted artifact.
- Evidence access is per-case, purpose-bound, five minutes, no bulk listing, visible watermark/case ID where feasible, and audited. Original evidence remains unavailable unless the sanitized variant cannot resolve a serious case and break-glass is approved.
- High-impact actions—role grant, service key rotation, account-wide purge override, award adjustment, evidence access, protection bypass creation—require reason/ticket and immutable audit. Evidence access and break-glass require a second approver.
- Review staff access quarterly and immediately on role change/offboarding. Provider team owner count is minimized.
- Development admin/debug fixtures compile out or return unavailable in production and preview-live environments.

## 14. Retention and deletion

### 14.1 Retention schedule

This schedule mirrors `data-identity.md` and is a launch contract. Vendor configuration and the privacy notice must state reality if a provider cannot meet it.

| Data | Default |
| --- | --- |
| Anonymous domain state | Device until user deletion, browser eviction, or migration; explicitly warn that browser storage is not guaranteed |
| Raw unconfirmed image | Current capture session only |
| Confirmed transient image | Processing duration; failed-cleanup hard target <=24 hours |
| Explicit saved evidence | Mission outcome +30 days; user may choose “until I delete” |
| Sanitized receipt/document | Mission outcome +30 days maximum; purge OCR and file |
| Agent state snapshot | Active investigation +30 days; only latest safe terminal snapshot retained with investigation |
| User-visible public events | With investigation; internal detailed trace 30 days maximum and content-free |
| Temporary export/migration archive | 24 hours; migration batch detail 30 days |
| Idempotency entries | 24 hours after safe retry window |
| Ordinary security/rate events | 30 days; restricted suspicious abuse signals up to 90 days |
| Deleted cloud data | Access disabled immediately; active stores/assets target <=7 days, no later than 30 days; backups expire on documented provider schedule |

Use automated expiry jobs plus metrics for overdue objects. A retention field without a tested purge worker is not a privacy control.

### 14.2 Local deletion

“Delete all data on this device” must:

1. Explain scope and offer export without making export mandatory.
2. Coordinate open tabs through `BroadcastChannel`/version lock and stop camera, agent, upload, sync, and service-worker writes.
3. Close IndexedDB connections and delete the `circloora` database, consented evidence blobs, outbox, sealed state, account-scoped cache, exports held by the origin, and any service-worker user caches.
4. Revoke the anonymous session cookie and clear analytics consent/identifier. Preserve only versioned static app shell if the user agrees; otherwise clear origin caches too.
5. Reopen/inspect stores and report actual completion or a specific browser-blocked retry state. Never show success solely because `deleteDatabase()` was called.

Deleting one object or investigation previews dependent missions, plans, evidence, verification, and ledger effects, uses a tombstone for sync, removes private bytes, and recomputes summaries. It cannot selectively erase an adverse ledger entry while retaining its award.

### 14.3 Cloud account deletion

Cloud deletion requires a fresh verified session/reauthentication, exact scope confirmation, export offer, and idempotency key. Then:

1. Revoke devices/sessions and immediately disable normal account access.
2. Cancel active runs, realtime tokens, signed-access minting, uploads, exports, and migration jobs.
3. Enqueue owner-wide purge of private Storage variants, Postgres owner rows/private sync records, app trace correlations, admin assignments, and provider-linked app records.
4. Delete the Supabase Auth user only through the trusted deletion service in an order that preserves purge authority and verification.
5. Verify no active asset/row remains, record content-free completion, and expose job status rather than claiming immediate backup deletion.

The user-facing notice distinguishes immediate inaccessibility, active-store purge, provider backup expiry, and copies the user exported/shared. If a future legal/security hold is introduced, it requires policy, notice, strict scope, access logging, and expiry; no undisclosed hold exists by default.

## 15. Vendor-specific security

### 15.1 OpenAI

- Use a dedicated production OpenAI Project and restricted project key; separate preview/development projects and budgets.
- Standard Responses/Agents calls are server-only and set storage off (`store: false`) wherever supported. Do not create Files, Vector Stores, Conversations, background runs, remote MCP connections, or persistent provider objects without a separate retention review and deletion implementation.
- Disable sensitive tracing as specified above. If the organization is approved for Zero Data Retention, disable incompatible tracing/features and verify actual endpoint eligibility.
- The current [OpenAI data controls documentation](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint) says API data is not used for training unless the customer opts in, default abuse monitoring may retain content for up to 30 days, Responses application state depends on endpoint/storage configuration, and image/file inputs may be retained for manual review when classifiers flag potential CSAM even under enhanced controls. The production privacy notice must disclose the actual project controls and this exception in plain language.
- Send only the confirmed sanitized image and minimum task context. Use approximate area only when local research requires it; never send exact address, account/auth identifiers, unrelated catalog, or full receipt OCR.
- Validate model and tool output before use. Provider refusal/safety errors do not get retried into a weaker model or mock result presented as live.
- Realtime uses server-minted short-lived browser credentials after auth/rate checks, concise instructions, text fallback, one active session, and no authoritative state. The permanent key never reaches the browser.

### 15.2 Supabase

- Separate projects per environment; production dashboard MFA, minimal owners, audit review, database/network restrictions where supported, tested backups and restore.
- Expose only the intended schema. Keep `app_private` outside the Data API. Explicit grants plus forced RLS protect all owner tables, functions, views, realtime channels, and Storage.
- Security-definer functions set a safe `search_path`, schema-qualify objects, revoke public execute, validate `auth.uid()`, and return minimal typed results.
- Service-role and provider secrets remain Vercel server secrets. No service-role client, generated admin link, bucket list, or raw SQL endpoint is exposed.
- Private Storage uses content restrictions at bucket and application layers; rejected/quarantined objects are removed; expiry and orphan sweeps are monitored.
- Run cross-user isolation tests after every migration, policy, grant, RPC, or Storage change.

### 15.3 Vercel

- New isolated `circloora-app` project; no inherited `.vercel` link, production domain, team secret, or data connection.
- Team MFA/SSO where available, least-privilege project roles, protected Git production branch, access and deployment audit review.
- Sensitive env values per environment, preview/prod separation, no production secrets on pull-request builds, no untrusted fork workflow with secrets.
- Set function max duration/memory deliberately; enforce request size before parsing; abort downstream calls; monitor cost, 4xx/5xx, cleanup lag, and unusual egress.
- Do not put private values in build-time `NEXT_PUBLIC_*`, build output, edge config, deployment metadata, logs, or client source maps.
- Redeploy after environment/key changes and verify the previous deployment/key is no longer accepted where revocation is intended.

## 16. Preview and deployment protection

- Enable Vercel Authentication or equivalent Deployment Protection for every preview, including branch aliases. A preview share link or bypass is a bearer capability and must be time-limited/revocable.
- Prefer Vercel Trusted Sources/OIDC for automation when available. Otherwise send the Protection Bypass secret in the `x-vercel-protection-bypass` header, never a query string, screenshot, committed Playwright config, or application link. Vercel documents the [automation bypass header](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).
- Preview uses mock mode by default, an isolated preview OpenAI project with low quota only when live testing is intentional, and an isolated Supabase project with synthetic data. Production user data never enters preview.
- Every preview response sends `X-Robots-Tag: noindex, nofollow, noarchive`; no sitemap or social image contains private routes. Protection is still required because noindex is not access control.
- OAuth/magic-link redirect allowlists enumerate specific trusted preview aliases used for auth testing. Do not wildcard all `*.vercel.app` deployments. Random PR previews do not receive provider auth secrets.
- `/api/health` is content-free and no-store. It returns environment, build, feature booleans, storage mode, mock state, and time—not project IDs, hostnames, model/key values, quotas, region, commit secrets, or protection status.
- Remote Playwright uses the header/OIDC credential from CI secret storage. Traces, screenshots, videos, downloads, and HTML reports are treated as potentially private artifacts with short retention and never record evidence or secrets.
- Production goes public only after the release gate, dependency/secret scans, remote health check, remote mock workflow, iPhone tests, CSP enforcement, and log inspection pass.

## 17. Privacy notice and user controls

The `/privacy` page and capture confirmation must clearly distinguish:

- what remains only on this device;
- what is sent to Circloora's Vercel-hosted server and why;
- what is sent to OpenAI, Supabase, and optional analytics/realtime services;
- that raw images are not retained by Circloora by default, while transient processing and provider abuse/safety retention exceptions may exist;
- that optional evidence retention is separate from catalog sync and has a visible expiry;
- that object/household data may be sensitive even without a name;
- how to crop/retake, continue in mock/local mode, export, delete one object/investigation, delete all local data, and delete an account;
- anonymous storage eviction/incognito limitations and online/offline boundaries;
- MVP limitations: privacy detection is best-effort, local storage is not encrypted at rest, impact/value are qualified estimates, and Credits have no monetary value.

Consent is purpose-specific and versioned:

1. Confirm this sanitized image for one analysis.
2. Optionally save this evidence on this device.
3. Optionally retain sanitized evidence in the account until the stated expiry.
4. Optionally enable analytics.
5. Optionally enable microphone/realtime voice.

Account creation/catalog sync does not imply evidence retention, analytics, or voice consent. A user may revoke optional consent prospectively and purge stored evidence without deleting the Passport's minimal verification fact.

## 18. Launch security acceptance tests

All tests run in development/CI as appropriate and the applicable subset runs against the protected preview. A critical failure blocks live production; it is not waived silently.

### 18.1 Browser policy and XSS

- Fetch every route class and assert the exact CSP/header/cache policy; verify a unique nonce per HTML response and no nonce reuse from cache.
- Inject script tags, event handlers, `javascript:` links, raw HTML, malicious Markdown, SVG, source snippets, tool output, filenames, and imported text; none execute or create unsafe navigation.
- CSP is enforced in production build with zero unexplained violations through landing, auth, camera, PWA, agent, evidence, analytics-disabled/enabled, and realtime-enabled flows.
- Service worker/cache inspection finds no API response, evidence, signed URL, auth callback, export, token, or user HTML.
- No horizontal/test artifact issue weakens security controls at all required iPhone viewports; permission-denied and app-switch paths stop camera/microphone tracks.

### 18.2 API, session, CSRF, and replay

- Each POST rejects missing/invalid Origin, forged Host/forwarding headers, missing/expired anonymous/session binding, missing/invalid CSRF, wrong content type, unknown Zod keys, oversized/deep payload, and unsupported method.
- CORS preflight from an untrusted origin yields no credentialed access; wildcard origin is absent.
- Anonymous cookie flags/lifetime/rotation pass; local profile ID is absent from the cookie, requests, analytics, and server storage.
- Approval, resume, verification, credit, migration, export, and deletion idempotency tests cover duplicate, reorder, concurrent, expired, wrong-session/user, altered payload, and method-version replay.
- Aborted/disconnected requests cancel provider work where supported and do not later award Credits or mutate terminal state.
- Production-safe errors never expose stack, SQL, provider body, env value, model prompt, file path, internal hostname, or user content.

### 18.3 Upload/parser/privacy

- Corpus covers valid JPEG/PNG/WebP/HEIC/HEIF/PDF and spoofed MIME/extension, truncated files, polyglots, SVG/HTML, animation/multiple frames, huge dimensions, decompression bombs, extreme aspect ratios, metadata bombs, ICC abuse, HEIC auxiliary/depth/sequence items, encrypted/scripted/embedded-file PDFs, malware test fixture, and parser timeout.
- Server re-encode output contains pixels only plus required safe encoding; EXIF/XMP/GPS/thumbnails/comments/filename/device/depth/audio and PDF active/external content are absent.
- Unsupported HEIC produces the accessible retake/JPEG guidance and preserves investigation state.
- Unconfirmed/cancelled images never reach the network. Confirmed images sent to the model are sanitized and no larger/more numerous than policy.
- Receipt OCR fixture proves unrelated line items, addresses, contact/payment/loyalty data, signature, barcode, and QR payload are absent from persisted summary, logs, traces, analytics, and model context.
- Face/address/document warning provides crop/retake and never stores an embedding or inferred identity. False negative copy does not promise complete detection.
- Default IndexedDB, export, service worker, server state, Supabase tables/buckets, logs, traces, analytics, Playwright artifacts, and `.next` output contain no raw bytes/data URLs.
- Transient cleanup runs on success, failure, timeout, abort, and retry exhaustion; overdue cleanup metric/alarm is tested.

### 18.4 Auth, RLS, Storage, and tenant isolation

- Apple, magic-link, and enabled Google callbacks reject forged/expired state, PKCE failure, wildcard/untrusted redirect, open redirect, account-enumerating response, and identity collision based only on email.
- User A cannot select/insert/update/delete/subscribe/list/download/sign/access user B data by row ID, child FK, guessed Storage path, metadata mismatch, filter, RPC, realtime, export, or deletion endpoint.
- Anonymous/public Supabase roles cannot reach product tables, functions, realtime channels, or `evidence-private`.
- Client cannot set/change owner or write server-derived observation, run state, verification, score, source, ledger, award, methodology, or safety authority.
- Service-role functions reject forged owner/payload; security-definer functions have fixed search path, minimal grants, and no public execution.
- Private evidence has no public URL; expired signed URL/revoked session fails. Five-minute expiry is measured, and URL is absent from logs/state/referrer.
- Local-to-cloud migration is idempotent, evidence consent is separate, prototype Credits are revalidated, and no remote data is created before account/migration consent.

### 18.5 Agent and prompt-injection security

- Injection strings in object labels, OCR, receipt, QR, user note, imported JSON, search page, source snippet, and tool result cannot change system policy, expose another tool, alter owner, bypass safety/approval, choose arbitrary URL, award Credits, or reveal a secret.
- Electronics, furniture, clothing, and safety scenarios expose different least-privilege tool sets; disabled tools cannot be invoked by name or fuzzy match.
- Malformed/extra/oversize tool inputs and outputs fail strict parsing. Provider/tool errors cannot inject raw internals into the next prompt or UI.
- SSRF suite covers localhost, private/link-local/metadata/reserved IPv4/IPv6, decimal/octal/hex IP, credentials in URL, DNS rebinding, redirect chains, oversized response, non-HTTP scheme, and content-type mismatch.
- Safety veto, source requirement, ranking, verification, and Credits are recomputed deterministically after model output. Scan-only and duplicate claims remain zero/blocked despite adversarial model text.
- Approval digest changes on any action/destination/evidence/safety/method change; expired, altered, consumed, or cross-user approval cannot execute.
- Max 8 turns/12 tools/2 retries, timeout, one-active-run, pause, resume, and abort survive reload without counter reset.
- Canonical and sealed state canaries prove no raw image, prompt, response, chain of thought, tool payload, token, signed URL, or secret. Envelope tamper, replay, wrong owner/environment/version, expiry, oversize, and key rotation fail safely.
- Public event feed contains only allowed enum fields and summaries; private reasoning is absent.

### 18.6 Rate, cost, fraud, logs, and analytics

- Distributed limiter is shared across function instances; concurrency and atomic budget tests prevent parallel overspend and duplicate award.
- Burst/daily thresholds, Retry-After, accessible recovery, limiter outage fail-closed behavior, provider hard quota, and budget alarm are verified without logging raw IP.
- Duplicate exact/perceptual receipt/image tests flag appropriately, do not expose cross-user matches, and do not falsely auto-reject reviewed near-duplicates.
- Log/trace/analytics canary suite seeds API keys, cookies, emails, postal codes, receipt text, filenames, IDs, prompts, responses, source queries, errors, and signed URLs; none appear in Vercel logs, trace exporter, analytics payload, CSP report, build output, or test artifact.
- Analytics rejects unknown/forbidden keys, is no-op when unconfigured, is off before consent, honors GPC/DNT, uses no autocapture/replay, and clears consent/identifier on local deletion.
- Agents tracing is disabled for visual root runs and `traceIncludeSensitiveData=false` for every trace-capable run; test fails if the SDK default changes.

### 18.7 Admin, preview, secrets, and supply chain

- Unauthenticated/ordinary/support roles cannot reach `/admin` or admin APIs; email/client metadata cannot grant admin. Admin role change, offboarding, MFA, JIT expiry, reason, second approval, and audit tests pass.
- Support cannot browse raw evidence or impersonate. Evidence review link is assigned-case/purpose-bound, expires, watermarks/audits access, and cannot list a bucket.
- Every preview is protected and noindexed; random PR preview lacks production secrets/auth callbacks/data. Remote E2E uses OIDC/header bypass and artifacts reveal no bypass value.
- Secret scan covers history/source/env files/build/client/source maps/SW/tests/artifacts/logs. Configured secret canaries are absent from the client and `/api/health` returns booleans only.
- Revocation tests cover permanent OpenAI key, service-role key, anonymous/sealed-state key version, realtime token, signed evidence URL expiry, OAuth state, and preview bypass.
- Lockfile is reproducible; dependency audit/licence/provenance review has no unresolved critical/high issue in runtime, auth, parser, crypto, service worker, or build path. Known exceptions have owner, mitigation, and expiry.

### 18.8 Retention, export, and deletion

- Retention jobs purge every class at expiry, retry idempotently, expose overdue metrics, and preserve only the documented minimal verification fact.
- Delete-one-object/investigation preview and dependency behavior match the data contract; deleted data does not resurrect through offline sync.
- Delete-all-local closes other tabs/writers, removes IndexedDB/evidence/state/outbox/user caches/session/analytics identity, and verifies absence after reload.
- Cloud deletion requires reauth, immediately disables access, revokes sessions/tokens, cancels jobs, purges Storage/Postgres/app records, deletes Auth in safe order, and reports actual job state.
- Default JSON export excludes evidence, auth, analytics, abuse heuristics, prompts/reasoning, traces/logs, signed URLs, and secrets. Optional evidence ZIP rejects path traversal/active content on re-import.
- Privacy UI accurately states actual Vercel, Supabase, OpenAI, analytics, log, and backup retention. No copy promises “never stored” when transient/provider processing applies.

## 19. Release gates and ownership

| Capability | Owner | Security gate |
| --- | --- | --- |
| CSP/headers/PWA/cache | Foundation + Security reviewer | Header/XSS/CSP/SW suites pass in production build and preview |
| Camera/image/HEIC/receipt | Camera agent | Parser corpus, metadata, confirmation, cleanup, privacy-warning suites pass |
| Anonymous API/session | Runtime agent + Security reviewer | CSRF/origin/session/rate/state tests pass; no remote profile created |
| OpenAI agents/realtime/search | Runtime + Sources agents | Tool/injection/SSRF/limits/tracing/vendor-retention gates pass |
| IndexedDB/export/deletion | Auth/Data agent | Repository/raw-image/local-deletion/import suites pass |
| Supabase accounts/sync/Storage | Auth/Data agent | Full RLS/Storage/RPC/realtime/migration matrix passes in deployed project |
| Verification/Credits | Impact agent | Deterministic authority, idempotency, duplicate, cap, ledger tests pass |
| Analytics | Operations agent | Consent, schema exclusion, no-autocapture, retention tests pass; otherwise no-op |
| Admin | Operations agent | SSO/MFA/JIT/RBAC/audit/evidence-access tests pass; otherwise disabled |
| Preview/production | Build Director | Protection, environment isolation, secret scan, dependency audit, remote smoke pass |

No implementation agent may weaken these contracts locally to unblock its feature. Interface conflicts return to the Build Director.

## 20. Known limitations and risk decisions

- Browser-local data is vulnerable to same-origin XSS, malicious extensions, shared-device access, and browser eviction. CSP/minimization/export reduce but do not eliminate this.
- Automated face/address/document detection can miss sensitive material. User confirmation and minimal retention remain necessary.
- Re-encoding removes metadata and active content but does not prevent sensitive pixels from being photographed.
- Vercel and provider infrastructure may retain operational metadata outside Circloora's application tables; the privacy notice must use verified provider facts.
- OpenAI default abuse-monitoring and image safety review can retain submitted content under documented conditions. ZDR availability and feature compatibility cannot be assumed.
- Supabase signed URLs are bearer URLs valid until expiry; authenticated same-origin streaming is safer for especially sensitive evidence.
- Distributed rate limiting needs a provisioned durable control. Live paid routes must stay off if only process memory is available.
- Offline prototype Credits and abuse caps can be altered/reset by a user. They have no value and cannot become authoritative without server recomputation.
- Production administration and durable cloud evidence materially increase breach impact. Both may remain disabled at launch without blocking the useful local/mock product.
- CSP nonces force dynamic rendering and may reduce CDN caching. Security takes precedence; performance should be measured rather than addressed with `'unsafe-inline'`.

## 21. Required integration decisions

Before implementation, the Build Director must lock:

1. The canonical `EvidenceAsset`, `EvidenceRef`, `DeletionRequest`, `AgentStateSnapshot`, sealed `RunEnvelope`, `UserApproval`, `CreditClaim`, security event, analytics event, and API error schemas.
2. Which distributed rate-limit provider/control is available on Vercel; live AI cannot rely on process memory.
3. The image/HEIC/PDF decoder and sanitizer libraries and whether PDF receipt evidence ships enabled.
4. Whether private evidence is always same-origin streamed or sometimes served by five-minute Supabase signed URL.
5. Actual OpenAI project retention/ZDR/tracing configuration and compatible Responses, web search, vision, and Realtime features.
6. Actual Supabase/Vercel/analytics log, backup, artifact, and deletion retention for the production privacy notice.
7. Preview protection method and automation identity; prefer OIDC/Trusted Sources, otherwise header bypass.
8. Whether cloud accounts, durable evidence, analytics, realtime voice, and admin are launch-enabled or explicitly disabled behind verified flags.

## 22. Security references

- [Next.js App Router Content Security Policy guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [OpenAI platform data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint)
- [OpenAI Agents SDK tracing](https://openai.github.io/openai-agents-js/guides/tracing/)
- [OpenAI Agents SDK running agents](https://openai.github.io/openai-agents-js/guides/running-agents/)
- [Vercel Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Vercel Deployment Protection automation bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
