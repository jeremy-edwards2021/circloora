# Circloora Product and UX Architecture

Status: Phase 1 product/UX contract  
Scope: iPhone-first MVP  
Audience: product, design, foundation, camera, agent-runtime, catalog, missions, impact, identity, and QA implementers  

## 1. Product experience decision

Circloora is a persistent circular-ownership utility, not a recycling scanner. The shortest expression of its job is:

> Scan it once. Understand it. Maintain it. Move it forward.

The experience must make four capabilities obvious in the first complete workflow:

1. Circloora remembers an object as a living Passport.
2. The agent asks different questions for different objects and can revise its recommendation.
3. The user receives a ranked, actionable next-life pathway rather than a disposal label.
4. Credits are awarded only after a supported outcome, never for scanning.

The product's emotional arc is utility first, progress second, personal value third, circular outcome fourth, climate context fifth, and Credits last. It should feel like Apple Wallet crossed with a premium home inventory and an intelligent field assistant: calm, precise, tactile, and useful. It must not look like a sustainability dashboard, generic chatbot, crypto product, or municipal recycling finder.

### 1.1 Product principles

- **Value before virtue.** Lead with money recovered or replacement spending avoided, useful life, effort saved, and task completion. Avoid guilt.
- **An object is owned, not scanned.** A confirmed object becomes a Passport with history, current state, sources, missions, and next-life pathways.
- **Evidence changes decisions.** Observations, user reports, inferences, estimates, and externally retrieved facts are visually distinct.
- **One next action at a time.** The interface can preserve competing pathways without asking the user to manage agent complexity.
- **Uncertainty is a feature.** Use ranges, confidence, assumptions, and “unavailable” states rather than false precision.
- **Safety can interrupt everything.** A safety escalation replaces normal recommendation and action CTAs until the issue is resolved.
- **The user stays in control.** Consequential actions require explicit approval; the MVP drafts but does not publish, contact, book, buy, pay, or share an exact address.
- **Anonymous is a complete mode.** The first useful result and a local catalog require no account. Account creation adds backup and sync; it is not a toll gate.
- **Online capability is explicit.** Local records remain useful offline. Live analysis, current-source research, account sync, and remote verification do not pretend to work offline.
- **Environmental claims are subordinate to verified reality.** Circular Action, Circular Value, Climate Impact, and Credits remain four separate ledgers.

## 2. Audience and launch jobs

Primary launch audiences are urban renters, homeowners, college students, families moving, people decluttering or clearing an estate, property occupants preparing for turnover, and people replacing furniture or electronics.

The MVP should optimize for these jobs:

- “Tell me what this is and whether it is worth keeping, repairing, selling, donating, returning, or recovering.”
- “Help me finish dealing with these things before a deadline.”
- “Remember what I own and what it needs.”
- “Give me a specific, current, realistic next step near me.”
- “Help me prove that I finished and show the practical result.”

## 3. Conceptual information architecture

### 3.1 Core nouns

| Noun | User meaning | UX rule |
| --- | --- | --- |
| Thing | A user-confirmed physical object | Never label the catalog as waste. |
| Space | A room or user-defined grouping of Things | A single room image is never presented as a complete inventory. |
| Passport | The living record for one Thing | Always disclose that it is consumer-created, not an official manufacturer Digital Product Passport. |
| Investigation | A resumable agent process pursuing a user goal | Show public activity and decision state, never private chain-of-thought. |
| Pathway | A possible next life for a Thing | Preserve alternatives and explain disqualification or lower-hierarchy choices. |
| Mission | A finite action the user can complete | Has evidence, deadline, approval, completion, and verification states. |
| Move Plan | A deadline-aware schedule coordinating several Missions | Shows dependencies, grouped trips, fallback dates, and deadline risk. |
| Verification | Review of a claimed outcome and supporting evidence | Independent from recommendation generation. |
| Credits | Prototype behavioral reward points | Non-cash, non-transferable, non-redeemable in MVP, and not carbon credits or offsets. |
| Impact | Qualified circular outcomes and environmental estimates | Separate fact, estimate, confidence, and methodology. |

### 3.2 Primary hierarchy

```text
Person or anonymous local profile
├── Spaces
│   └── Things
│       └── Circloora Passport
│           ├── Identity and condition
│           ├── Observations, inferences, assumptions, sources
│           ├── Competing pathways and recommendation revisions
│           ├── Missions and object history
│           ├── Action ledger
│           ├── Value ledger
│           ├── Climate impact ledger
│           └── Credits ledger entries
├── Investigations
│   ├── Single Thing
│   └── Circloora Move
│       ├── Confirmed room inventory (maximum eight detected candidates)
│       └── Coordinated Move Plan
├── Missions
├── Aggregate impact
└── Account, preferences, privacy, export, and deletion
```

### 3.3 Route map

| Route | Role in IA | Primary tab or parent |
| --- | --- | --- |
| `/` | First-visit landing or returning-user Home | Home |
| `/start` | Lightweight goal and capture setup | Home / scan action |
| `/lens/[investigationId]` | Circloora Lens capture | Scan action |
| `/inventory/[investigationId]` | Room inventory confirmation | Investigation flow |
| `/investigate/[investigationId]` | Agent workspace and evidence loop | Investigation flow |
| `/plan/[investigationId]` | Coordinated move-out plan | Missions |
| `/complete/[investigationId]` | Before-and-after investigation summary | Home / History |
| `/catalog` | My Circloora, including All Things and Spaces | Things |
| `/thing/[objectId]` | Circloora Passport | Things |
| `/missions` | Mission list and progress | Missions |
| `/mission/[missionId]` | Mission detail and action packet | Missions |
| `/verify/[missionId]` | Outcome verification | Missions |
| `/history` | Saved and resumable investigations | Profile |
| `/credits` | Credits ledger and disclosure | Profile |
| `/impact` | Circular outcomes, value, and qualified impact | Home / Profile |
| `/profile` | Local/account identity, preferences, data controls | Profile |
| `/install` | iPhone PWA installation help | Profile |
| `/privacy` | Plain-language privacy practices | Profile / public footer |
| `/methodology` | Circular hierarchy, ranking, verification, estimates | Profile / contextual links |

`/profile` is required by the four-tab navigation even though it was omitted from the original required-page list. Authentication may be implemented as a modal/sheet over `/profile` or the save flow; a technical callback route may exist but must not become a navigable product screen.

### 3.4 One route, two Home states

The required landing page and the required Home tab share `/`:

- On a first visit with no local profile or saved work, `/` renders the public landing state.
- After the user starts an investigation, saves a Thing, or explicitly chooses “Explore Circloora,” `/` renders the utility Home state.
- A “What is Circloora?” link can reopen the public explanation without destroying the returning state.
- Deep links do not force users through the landing state.

This avoids a fifth primary destination or an unrequired `/home` route.

## 4. Four-tab navigation and application shell

### 4.1 Bottom navigation

The persistent application shell uses four destinations:

| Tab | Route | Label behavior | Default badge |
| --- | --- | --- | --- |
| Home | `/` | Briefing and next best action | Number of items needing attention, only when nonzero |
| Things | `/catalog` | Catalog and Spaces | None |
| Missions | `/missions` | Action queue and plans | Number awaiting user action, capped at `9+` |
| Profile | `/profile` | Preferences, ledgers, history, privacy | Sync/error dot only; no engagement badge |

A prominent circular camera control sits centrally above the tab bar. It is an action, not a fifth tab. Its accessible label is “Scan something.” Activating it opens a two-option sheet: “Scan one thing” and “Scan a room.” It then creates or resumes a draft at `/start`.

### 4.2 Shell behavior

- The tab bar is present on Home, Things, Missions, and Profile root screens and may remain on subordinate read-only screens when it does not compete with a task CTA.
- It is hidden during Lens capture, inventory confirmation, verification capture, and other focused full-screen tasks.
- Focused screens use a visible Close or Back control that states where unsaved work will go.
- Returning to a tab restores its scroll position and filter state during the session.
- Each tab is a real link with a selected-state label; icon-only navigation is not acceptable.
- The camera control never obscures content, Safari chrome, or the final list item.
- All shell content honors top and bottom safe-area insets and works in standalone PWA mode.

### 4.3 Global header pattern

- Root screens: wordmark or screen title, contextual status, and no more than two utility actions.
- Focused tasks: Back/Close, concise task title, and optional Help; primary action stays thumb-reachable at the bottom.
- Detail screens: object/mission identity, overflow menu for destructive or secondary actions, and a single state-dependent primary CTA.

## 5. iPhone-first interaction contract

### 5.1 Required viewports and geometry

All routes must be accepted at 390×844, 393×852, 402×874, and 430×932 in portrait and remain usable in landscape. Implement `viewport-fit=cover`, dynamic viewport units, safe-area insets, and a keyboard-safe bottom action area.

- Minimum interactive target: 44×44 CSS pixels.
- Primary task controls must be reachable by thumb and not sit beneath browser chrome.
- No horizontal page overflow at 320 CSS pixels or any required viewport.
- No hover-only disclosure or action.
- No critical drag-only behavior; reordering, crop, merge, and split need button alternatives.
- Fixed bottom actions reserve content padding equal to action bar plus safe area.
- Forms use correct `inputmode`, labels, autocomplete, and visible validation associated with the field.

### 5.2 Density and hierarchy

- One primary action per screen state.
- Cards show a maximum of six decision-relevant fields before expansion.
- Object cards show only image, name, current status, recommended action, estimated remaining value, and confidence.
- Long methodology and source detail is progressive disclosure, never a competing dashboard.
- Use warm mineral surfaces, dark carbon typography, one distinctive circular accent, restrained motion, and strong object imagery.
- Avoid leaf/recycling clip art, excessive green, crypto styling, generic AI sparkles, childish badges, and carbon equivalence gimmicks.

### 5.3 Sensory and assistive behavior

- Every haptic or audio signal has simultaneous text and visual feedback.
- Reduced-motion mode replaces movement with opacity or immediate state changes.
- Streaming agent updates are announced through a polite live region no more often than meaningful state changes; tool-by-tool noise is not read aloud automatically.
- Camera framing instructions never rely only on color or vibration.
- Optional voice guidance is push-to-talk and interruptible; denial or unavailability leaves the complete text/camera workflow intact.
- Persistent controls, dialogs, sheets, and progress indicators expose meaningful screen-reader names and state.

## 6. End-to-end flows

### 6.1 First-run onboarding

Onboarding is progressive and embedded in the first job rather than a feature tour.

1. **Landing:** explain the promise and privacy in one viewport; offer “Scan a room” and “Scan one thing.”
2. **Mode and goal:** collect single Thing versus room, then a concrete goal such as understand, maintain, repair, sell, donate, move, declutter, or “not sure.”
3. **Constraints:** collect optional deadline, approximate postal code/area, role/occupancy, and preference mode. Explain why location is useful before asking.
4. **Capture setup:** choose camera, upload, or photo library; voice preference is optional and can be changed later.
5. **Just-in-time permission:** request camera or microphone only after the corresponding user gesture.
6. **Capture and confirm:** the user sees and explicitly confirms every image before it is submitted.
7. **First useful result:** show a confirmed/probable identity, current condition/confidence, a ranked next action, at least one alternative, and any evidence needed. This is the value moment; it cannot be an indefinite loading screen or account wall.
8. **Save:** “Save to My Circloora” creates a local Passport first, then offers account backup and sync.

No account, exact address, demographic profile, notifications, analytics consent, or regeneration preference is required to get the first useful result.

### 6.2 Scan One Thing

```text
Home/landing scan action
→ /start (goal and constraints)
→ /lens/:investigationId (capture, review, confirm)
→ /investigate/:investigationId
→ targeted evidence request if needed
→ Lens follow-up capture and resume
→ ranked recommendation + Next-Life Map
→ Save to My Circloora
→ optional account conversion
→ approve Mission creation
→ /mission/:missionId
→ /verify/:missionId
→ verified reward/result
→ updated /thing/:objectId Passport
```

The investigation may pause without creating a Mission. It must resume to the same active object, unresolved question, and prior evidence state after reload or app switching.

### 6.3 Circloora Move

```text
Home/landing “Scan a room”
→ /start (goal, deadline, constraints)
→ /lens/:investigationId (room capture)
→ /inventory/:investigationId
→ user confirms, renames, removes, adds, merges/splits, and marks keep/needs action
→ /investigate/:investigationId (selected Things only)
→ /plan/:investigationId (ordered schedule, grouped trips, fallbacks)
→ Mission details and completion
→ /complete/:investigationId before-and-after summary
```

Room detection returns no more than eight probable objects. The interface says “Things Circloora noticed” and never “Complete inventory.” Each candidate requires confirmation; detected candidates are not persistent Passport records until confirmed.

### 6.4 Anonymous-to-account conversion

The conversion sequence is deliberately post-value:

```text
Scan
→ useful result
→ Save to My Circloora (local save succeeds)
→ optional “Back up and sync” sheet
→ Sign in with Apple / email magic link / Google if configured
→ migration preview
→ local-to-cloud migration
→ success summary
```

#### Conversion rules

- The primary conversion message is “Keep your Passports backed up and available on your other devices,” not “Create an account to continue.”
- “Keep on this iPhone” is always a visible choice and retains full anonymous local functionality.
- Sign in with Apple is primary on iPhone; email magic link is equal-access fallback. Google appears only when configured.
- The sheet states exactly what will move: Things, Passports, Missions, preferences, ledgers, and investigation history. Raw images are excluded unless the user separately consented to evidence storage.
- Before migration, show counts and any detected duplicates. The user can review conflicts.
- During migration, local records remain intact. Local deletion occurs only after confirmed cloud persistence and never merely because authentication succeeded.
- On conflict, preserve both records or request an explicit merge when identity is uncertain. Never silently overwrite newer local work.
- If authentication or migration fails, the user returns to the saved local Passport with a retry action.
- Account prompts can recur at natural sync/export moments but are dismissible and cannot block local workflows.

### 6.5 Evidence pause, resume, and recommendation revision

1. Investigation reaches an unresolved question.
2. Agent displays one targeted evidence request with reason, target area, framing, prohibited actions, completion criteria, and a non-camera alternative where possible.
3. State changes to `awaiting_evidence` and is serialized without raw images by default.
4. User may capture now, answer in text, choose “I can’t provide this,” or leave.
5. After new evidence, the same investigation resumes; it does not restart.
6. If ranking changes, a “Why this changed” panel compares previous and revised recommendation, identifies the new evidence, shows changed confidence, and records the revision in the Passport.
7. Revised results pass through verification before being shown as final.

### 6.6 Mission, approval, verification, and reward

1. A recommendation proposes a Mission.
2. The user reviews objective, reason, steps, deadline, effort, expected cost/recovery, safety, evidence, and available Credits.
3. Consequential action packet generation enters `awaiting_approval` and requires explicit Approve/Not now. Approval is scoped to the described draft.
4. The user performs the real-world action outside Circloora; the MVP never claims it did so.
5. User submits an outcome claim and evidence at `/verify/:missionId`.
6. Verification returns supported outcome, evidence level, confidence, limitations, and any fraud/duplicate flags.
7. Approved outcomes update the four independent ledgers and Passport history.
8. The reward screen prioritizes user value and useful life before qualified climate estimates and Credits.
9. Insufficient or rejected evidence awards zero Credits and provides a specific next step; it is not a generic failure.

### 6.7 Offline and interruption recovery

- On app switch, route, draft form fields, capture stage, and investigation state are preserved. Camera tracks stop when hidden and restart only after a user gesture where Safari requires it.
- Cached application chrome, catalog, Passports, Missions, History, Credits entries, and impact records remain readable offline.
- Live OpenAI analysis, web research, account sync, remote source validation, and verification are marked unavailable offline.
- A user may save an offline draft. Raw evidence is not stored for later upload unless the user explicitly opts into local evidence storage; otherwise the draft records “photo must be retaken.”
- Pending mutations show “Saved on this device” until sync succeeds. Retry is explicit; no silent duplicate submission.

## 7. Circloora Lens

### 7.1 Lens modes

- **Single Thing:** rear-camera framing for one object, file upload fallback, photo-library fallback, retake, crop, confirm, and category-directed follow-up.
- **Room scan:** one room image, quality check, explicit confirmation, then up to eight editable candidates.
- **Guided evidence:** an agent-directed capture for a label, joint, damage area, powered state, care label, ISBN, material code, or other precise target.
- **Verification capture:** receipt/confirmation or post-action visual evidence with sensitive-content warning and duplicate detection.

### 7.2 Capture state machine

```text
idle
→ requesting_permission
→ previewing
→ captured
→ reviewing
→ confirmed
→ preparing (decode, validate, resize, re-encode, strip metadata)
→ submitting
→ accepted

Recoverable branches:
permission_denied | camera_unavailable | interrupted | invalid_file |
unsupported_heic | poor_quality | upload_failed | offline | cancelled
```

### 7.3 Lens screen contract

- Permission rationale precedes the browser prompt and is triggered only by “Use camera.”
- Preview uses the rear camera when available; camera switching is secondary.
- Framing overlay includes text, not only a colored border.
- Capture feedback is redundant: visual state, short text, and optional audio/haptic.
- Review shows the exact confirmed image with Retake, Crop, and Use photo. Submission cannot happen before confirmation.
- Images are decoded and validated, malformed files rejected, large images resized, metadata stripped where practical, and HEIC handled or given an explicit retake path.
- A sensitive-content check warns about visible faces, addresses, personal documents, or unrelated people and offers crop/retake.
- Leaving the route stops media tracks. Returning initializes cleanly and explains if a fresh gesture is needed.
- At most four images are accepted per object; reaching the limit preserves prior work and explains which evidence is most useful.

### 7.4 Category-directed evidence patterns

| Category | Typical next captures | Unsafe/low-value behavior to avoid |
| --- | --- | --- |
| Electronics | rear label, model, power state, display, cables, exterior battery deformation, damage | Never ask to power a device with possible battery deformation or exposed electrical damage. |
| Furniture | full view, underside, loose joint, maker mark, damage detail, scale/material clues | Do not infer hidden structural integrity or exact material. |
| Clothing | full garment, brand label, care/fiber label, damage, stains, hardware | Do not overstate authenticity or resale value. |
| Books | cover, spine, ISBN, edition, condition | Do not require redundant angles after exact edition is established. |
| Packaging | material code, barcode, contamination, separate components | Local acceptance still requires current sourced rules. |

The evidence request itself must explain why the capture matters and offer “I can’t provide this.” Different categories must not receive the same fixed sequence.

## 8. My Circloora and Circloora Passports

### 8.1 Catalog model

My Circloora defaults to “All Things” with an adjacent Spaces entry point. Saved views are:

- All Things
- Spaces
- In Use
- Needs Attention
- Ready to Repair
- Ready to Sell
- Ready to Donate
- Special Handling
- Leaving
- Circulated
- Awaiting Verification

Search covers confirmed name, probable identity, brand/model, room, and category. Filters cover category, room, condition, pathway, verification status, Credit status, last updated, and safety flags. Active filters remain visible and removable without reopening the sheet.

Catalog cards show only image, name, status, recommended action, estimated remaining value, and confidence. Monetary uncertainty is a range and links to the disclosure “Estimate—not an appraisal.” A placeholder image is used when raw image retention was declined or the image is unavailable.

### 8.2 Passport hierarchy

The Passport detail order is:

1. Confirmed identity and primary image/placeholder
2. Current condition and functionality
3. Agent recommendation and confidence
4. Single best next action
5. Estimated remaining value and useful life
6. Next-Life Map with alternatives
7. Active and completed Missions
8. Circular outcome, Value, Climate Impact, and Credits summaries as separate cards
9. Observation, inference, assumption, uncertainty, and source detail
10. Full object history and recommendation revisions
11. Technical methodology and data controls

The Passport supports identity correction, duplicate merge, space change, archive, delete, and transfer preparation. Destructive actions use confirmation that names the Thing and consequences. Merge shows field-level provenance and never silently discards history.

Every Passport displays:

> Consumer-created Circloora Passport—not an official manufacturer Digital Product Passport.

### 8.3 Next-Life Map

The Next-Life Map is a vertical decision rail or branching pathway, not a chart. It shows current state, recommended pathway, alternatives, circular value retained, effort, completion time, financial recovery range, confidence, and verification state. Safety-vetoed or unavailable pathways remain visible when useful, with the reason they were disqualified. The visualization has a complete text equivalent and does not imply scientific precision.

## 9. Missions and move planning

### 9.1 Mission list organization

Mission list sections are “Needs you,” “In progress,” “Awaiting verification,” and “Done.” Cancelled items are behind a filter. The default sort favors user action and deadlines, not Credit value.

Each mission card contains objective, Thing, state, deadline, next action, effort, and expected cost/recovery. Credits may be shown as “Up to” until verification and must carry the prototype disclosure at the first visible balance/reward context.

### 9.2 Mission state-to-CTA mapping

| State | Primary CTA | Required explanation |
| --- | --- | --- |
| `proposed` | Review mission | Why this pathway is recommended |
| `awaiting_evidence` | Add evidence | What is missing and why |
| `ready` | Start mission | What completion requires |
| `awaiting_approval` | Review approval | Exact action packet scope |
| `approved` | Begin steps | Approval time and scope |
| `in_progress` | Continue | Next incomplete step |
| `awaiting_verification` | Verify outcome | Accepted evidence and privacy note |
| `verified` | View result | Verification level and ledger updates |
| `completed_unverified` | Add supporting evidence | Why Credits remain zero/pending |
| `blocked` | Resolve blocker | Specific blocker and fallback |
| `cancelled` | View history | No reward or impact claim |

### 9.3 Move Plan

The move plan displays deadline, completion count, risk, ordered Missions, daily grouping, grouped trips, dependencies, and fallback dates. It gives higher lead-time pathways an earlier start. Each fallback clearly states its trigger, for example “If not sold by Tuesday at 6 PM, switch to verified donation pickup.”

Changing deadline, travel, effort, availability, or pathway preference reruns deterministic optimization and presents a diff before replacing the plan. The old plan remains in revision history.

## 10. Value, impact, Credits, and regeneration presentation

### 10.0 Ledger content contract

The Action Ledger supports continued use, maintenance, repair, upgrade, refill, sharing, lending, resale, direct transfer, donation for reuse, manufacturer return, refurbishment, component recovery, material recycling, composting, official special handling, disposal, and unknown outcome. Each entry exposes its evidence level and limitations; the UI does not turn an inferred recommendation into a completed action.

The Value Ledger can store money recovered, replacement spending avoided, repair cost, fees, transport cost, remaining value, useful life extended, user time, time saved, trips required/consolidated, Things kept in use/transferred/diverted. Primary screens show only the metrics material to the outcome; full detail remains inspectable. Uncertain money is always a range with “Estimate—not an appraisal.”

The Climate Ledger can store production/lifecycle emissions avoided, embodied carbon retained, operational carbon difference, end-of-life difference, waste mass diverted, virgin material demand avoided, transport emissions, or estimate unavailable. It uses four evidence tiers: Verified, Product-specific estimate, Category estimate, and Insufficient. Tier names never substitute for the actual confidence, boundary, assumptions, date, and limitations.

Credits use the deterministic formula:

```text
Base Action Score
× Verification Multiplier
× Value-Retention Multiplier
× Effort Multiplier
× Environmental Confidence Modifier
```

The environmental modifier remains within 0.80–1.20, Credits are never calculated per kilogram of CO2e, results round to whole points, and safety can veto an award.

| Supported outcome | Base Credits |
| --- | ---: |
| Avoided unnecessary replacement | 650 |
| Verified repair | 600 |
| Maintenance extending use | 550 |
| Verified resale | 500 |
| Verified direct transfer | 475 |
| Verified refill or repeated reuse | 425 |
| Donation for direct reuse | 375 |
| Manufacturer return | 300 |
| Refurbishment | 300 |
| Component recovery | 225 |
| Material recycling | 150 |
| Composting | 125 |
| Scan only, unknown outcome, or disposal | 0 |

| Verification evidence | Multiplier |
| --- | ---: |
| Partner verified | 1.00 |
| Document supported | 0.90 |
| Visually supported | 0.70 |
| User attested | 0.35 |
| Insufficient evidence or rejected | 0 |

Potential Credits are labeled “Up to” until verification. Duplicate, daily-limit, or suspicious-pattern review states are presented as claim status—not as a settled balance.

### 10.1 Four independent ledgers

| Ledger | Primary question | Example | Visual treatment |
| --- | --- | --- | --- |
| Circular Action | What verifiably happened? | Chair repaired; document supported | Factual outcome and evidence level |
| Circular Value | What practical value was retained? | $240–$300 replacement spending potentially avoided | Dominant after outcome, with range and “Estimate—not an appraisal” |
| Climate Impact | What comparative environmental effect is supportable? | 18–42 kg CO2e estimated production and lifecycle emissions avoided | Supporting card with confidence, boundary, assumptions, and date |
| Credits | What prototype incentive points were earned? | +540 Credits | Last in reward hierarchy with mandatory disclosure |

The UI must never combine the ledgers into one score, sum incomparable units, or make Credits visually resemble a currency or carbon asset.

### 10.2 Post-action result hierarchy

1. Verified outcome, such as `REPAIR VERIFIED`
2. Money recovered or replacement spending avoided
3. Estimated useful life extended
4. Task completion and circular pathway
5. Climate-impact range, confidence, and qualification—or “Climate estimate unavailable”
6. Credits earned and verification multiplier
7. One action: “View updated Passport”

Approved climate terminology:

- Ordinary goods: “Estimated production and lifecycle emissions avoided.”
- Building products: “Estimated embodied carbon retained or avoided.”
- Energy-consuming products: “Estimated operational emissions difference.”
- Every avoided-emissions result: “Comparative estimate—not a carbon offset.”
- Insufficient evidence: “Climate estimate unavailable with the current evidence.”

Every quantitative impact result exposes range, confidence tier, baseline, alternative, displacement assumption, data sources, method, calculation date, limitations, and “What could change this result.” No trees/flights equivalences are used.

### 10.3 Credits presentation

Every screen showing a balance or reward must display, inline or via an immediately adjacent disclosure:

> Prototype reward points. No monetary value. Not carbon credits or offsets.

The Credits screen additionally states non-cash, non-transferable, not redeemable in the MVP, not cryptocurrency, not securities, and not environmental commodities. Scanning shows zero Credits without shaming the user. Pending means a submitted claim awaiting review, not a promised award. Rejected or insufficient evidence shows zero awarded and the reason.

### 10.4 Nature preferences

Regeneration Preferences live under Profile, not Impact totals. Options are urban trees, wetland restoration, soil restoration, habitat recovery, community composting, and local reuse infrastructure. MVP copy is fixed:

> Preference only. No restoration action or financial allocation has occurred.

No partner contribution appears unless sponsor, recipient, amount, project, date, and confirmation source exist.

## 11. Global state architecture

### 11.1 State priority

When several states coexist, render them in this order:

1. Safety escalation
2. Destructive-data or account conflict requiring a user decision
3. Permission denial that blocks the chosen mode
4. Offline limitation
5. Recoverable error
6. Loading or queued work
7. Empty state
8. Normal content

Cached content should remain visible beneath nonblocking offline, sync, and retry banners. A partial error should not replace healthy data.

### 11.2 Loading states

- Use a skeleton shaped like the destination after a short delay; do not flash a spinner for near-instant local loads.
- Preserve previous content during refresh and label it “Updating.”
- For agent work, show concise public event stages and an indeterminate progress rail. Do not invent a percentage.
- Long work always offers Cancel; cancelling preserves completed work.
- Image processing distinguishes preparing on device from submitting online.
- Screen readers receive a concise start update, meaningful stage changes, and completion/failure—not every animation.
- If tool/turn/retry limits are reached, preserve state and offer a specific next step rather than looping.

### 11.3 Empty states

Every empty state contains a concrete title, one sentence of value/meaning, one primary action, and at most one secondary action. It uses an object-oriented neutral illustration or typography, never a sad bin, guilt, confetti, or an environmental claim.

| Context | Required empty copy/action |
| --- | --- |
| Home, no saved work | “Start with something you own.” → Scan something |
| Catalog | “Your things will live here.” → Scan something; secondary Import data |
| Search/filter | “No things match these filters.” → Clear filters |
| Spaces | “No spaces yet.” → Add a space or Scan a room |
| Missions | “No active missions.” → Find a next action |
| History | “No investigations yet.” → Start an investigation |
| Credits | “Complete a supported circular action to earn Credits.” → View Missions |
| Impact | “Verified outcomes will appear here.” → View Missions |
| Move plan | “Choose at least one leaving Thing.” → Review inventory |
| Sources | “No current source could be verified.” → Check official municipal guidance |
| Recommendation revision | Do not render an empty panel; hide the section until a revision exists |

### 11.4 Error taxonomy and recovery

| Error | User presentation | Recovery |
| --- | --- | --- |
| Validation | Inline, attached to the field | Correct input; entered values persist |
| Not found/deleted | Calm page with record type named | Go to parent list; never fabricate fallback data |
| Stale/conflict | “This changed on another device.” with summary | Review both, keep newer, keep both, or merge |
| Timeout/agent limit | Completed stages and exact pause reason remain visible | Retry stage or continue with available evidence |
| Rate limit | State retained with retry timing where known | Retry later; avoid duplicate requests |
| Server/tool failure | Localized error with request ID behind Details | Retry failed step or use mock only when explicitly selected and disclosed |
| Upload/file error | File-specific reason: type, size, malformed, HEIC support, network | Retake, choose another file, or retry |
| Storage quota/private browsing | Explain local persistence may be unavailable | Export current work, free space, sign in for cloud if available |
| Authentication | Local work remains available | Retry provider or use local mode |
| Migration/sync | Show records successfully moved and those pending | Retry pending; never delete local source automatically |
| Verification rejected | Evidence-level result, not generic error | Show accepted evidence or appeal/retry path |
| Safety escalation | High-priority instruction with official-source requirement | Stop unsafe step; use verified official guidance |

Errors never erase form input, captures under current explicit session consent, investigation state, or previously loaded local data. Production errors do not reveal secrets, prompts, or raw provider output.

### 11.5 Offline states

Global offline copy: “Offline. Your saved Circloora records are available; live analysis and current local guidance need a connection.”

| Capability | Offline behavior |
| --- | --- |
| Home/catalog/Passport/history | Read cached local data; local edits queue and show “Saved on this device.” |
| Mission steps | Check off locally; claims remain unverified until online. |
| Lens | Camera/upload preview may work; analysis cannot start. Save metadata-only draft or explicitly opt into local evidence storage. |
| Investigation | Show cached plan/events and unresolved request; disable resume with clear connection requirement. |
| Current local pathways/sources | Show last retrieval date as stale; do not claim current verification. |
| Verification | Save a draft checklist; queue only with explicit evidence-storage consent. No Credits awarded offline. |
| Credits/impact | Read settled ledger entries; pending local actions are not added to verified totals. |
| Authentication/sync/export to cloud | Explain connection requirement; local JSON export may still work. |

### 11.6 Permission-denied states

Permissions are requested just in time and only after an explanatory user gesture.

| Permission/capability | Denied state | Complete fallback |
| --- | --- | --- |
| Camera | “Camera access is off for Circloora.” with Safari Settings help | Upload a photo or choose from library; all later flows remain available |
| Microphone/voice | “Voice guidance is unavailable.” | Text instructions and camera controls; do not reprompt repeatedly |
| Approximate location | Location is never mandatory; no exact-location prompt by default | Enter postal code or general area; skip and receive nonlocal pathways |
| Notifications | Explain reminders stay in the app | In-app mission due list and downloadable/copyable reminder text |
| Photo library/file picker cancelled | Treat as a user cancellation, not an error | Return to Lens with camera and upload choices |
| Persistent storage unavailable | Explain browser storage limitation | Continue ephemeral session, export, or sign in; warn before leaving |

The UI never instructs users to grant a permission without also providing a route forward when technically possible.

## 12. Screen-level contracts and acceptance criteria

The criteria below are product acceptance requirements. QA may translate them into unit, integration, accessibility, visual, and Playwright checks.

### 12.1 `/` — Landing and Home

**Purpose:** explain the promise before first use; become the concise command center after use begins.

**First-visit content:** eyebrow “Your circular agent”; headline “Give everything another life.”; subheadline “Scan what you own. Circloora catalogs it, helps you care for it, finds what should happen next, and rewards verified circular action.”; primary “Scan a room”; secondary “Scan one thing”; trust line “Images are analyzed privately and are not stored by default.”; steps Scan it, Understand it, Circulate it.

**Returning Home content:** only Scan Something, agent briefing, My Circloora summary, current Missions, and a compact impact/Credits summary. The summary may include Things count, retained-value range, active Missions, Things kept in use, verified transfers, and Credits, but not a grid of charts.

**Acceptance criteria:**

- A first-time anonymous visitor can start either mode in one tap without seeing an account prompt.
- Required landing copy and both CTAs are visible and semantically ordered.
- Returning users see at most one briefing headline and one strongest next action.
- Home totals distinguish estimated value, verified circular outcomes, climate estimates, and Credits.
- Any visible Credits balance has the prototype disclosure immediately available.
- Empty Home uses “Start with something you own” and Scan something.
- Loading uses local-summary skeletons; a failed remote briefing does not hide local summaries.
- Offline Home shows cached records and disables only online actions with explanatory copy.
- No permission is requested on page load; camera permission follows the scan gesture.

### 12.2 `/start` — Goal and setup

**Purpose:** create an Investigation and collect only the constraints needed to choose the first agent action.

**Acceptance criteria:**

- User can choose Single Thing or Room, goal, optional deadline, postal code/approximate area, occupancy/role, preference mode, camera/upload, and optional voice.
- Preference modes are Balanced, Maximize money, Minimize waste, Finish fastest, Minimize travel, and Minimize effort, with Balanced default.
- Optional fields are visibly optional and can be skipped; exact address is never requested.
- Deadline controls accept “No deadline” and use the device timezone.
- Explanatory copy precedes any request related to camera, microphone, or location.
- Submission creates one resumable draft and routes to Lens; repeated taps do not create duplicates.
- Validation errors are inline and preserve inputs; server failure retains the local draft.
- Offline submission creates a metadata-only draft and explains that analysis/current pathways require a connection.
- Returning to an existing draft restores choices and offers Resume or Start over; Start over requires confirmation if work exists.

### 12.3 `/lens/[investigationId]` — Circloora Lens

**Purpose:** acquire explicitly confirmed visual evidence for a single Thing, room, or targeted follow-up.

**Acceptance criteria:**

- Route loads the correct mode and target request from the Investigation; missing/deleted IDs route safely to History.
- “Use camera” triggers a rationale then rear-camera request. Upload and photo-library options remain visible.
- Live preview, capture, retake, crop, and explicit Use photo are operable at every required iPhone viewport and by keyboard/screen reader where applicable.
- Media tracks stop on leave/background and reinitialize cleanly on return.
- The route validates, resizes, re-encodes where practical, strips metadata, and shows file-specific failures without silent loss.
- HEIC either converts successfully or gives a clear in-app camera retake instruction.
- Sensitive-content warning offers crop/retake before submission.
- Room mode says detection is partial and routes confirmed capture to inventory review; single/evidence mode routes to investigation resume.
- Poor quality identifies the actionable issue—blur, darkness, obstruction, or framing—and permits use anyway unless evidence is unusable or unsafe.
- Camera denial presents Safari recovery plus fully functional upload/library fallbacks.
- Voice denial leaves concise text guidance and no repeated permission loop.
- Offline mode allows capture review but does not imply analysis; evidence persists only with explicit local-storage consent.
- App switching, interruption, and upload retry preserve the current stage and Investigation ID.

### 12.4 `/inventory/[investigationId]` — Room inventory confirmation

**Purpose:** let the user establish the authoritative room inventory before agents investigate selected Things.

**Acceptance criteria:**

- Displays no more than eight detected candidates under “Things Circloora noticed,” with confidence and editable cards.
- User can confirm, rename, remove, add, merge, split, mark keeping, and mark needs action.
- Every critical drag operation has button controls; merge/split is reversible before confirmation.
- No candidate becomes a persistent Passport until user confirmation.
- At least one leaving/needs-action Thing is required for a Move Plan; all-keeping is allowed but routes to a useful room summary rather than an error.
- Low-confidence candidates are called probable, not identified facts.
- Empty detection invites manual add or retake; it does not claim the room is empty.
- Loading shows candidate-card skeletons and permits Cancel.
- Partial detection failure preserves any candidates already found and offers manual completion.
- Offline cached candidates remain editable; new AI detection waits for connection.
- Confirmation is idempotent and routes selected Things to investigation.

### 12.5 `/investigate/[investigationId]` — Agent workspace

**Purpose:** make adaptive investigation, evidence gaps, competing pathways, approvals, and revision visible without becoming a chatbot.

**Acceptance criteria:**

- Shows active Thing, user goal, overall progress, current public agent action, and next user action.
- Distinguishes direct observations, user reports, external facts, inferences, estimates, and assumptions by labels and accessible text—not color alone.
- Shows concise tool activity, sources with retrieval dates, competing pathways, confidence, and disqualification reasons.
- Never streams private chain-of-thought, prompts, or provider internals.
- An evidence request includes reason, target, framing, prohibited actions, completion criteria, accessibility alternative, and “I can’t provide this.”
- The investigation pauses and serializes at evidence/approval boundaries and resumes the same run state after reload.
- Recommendation revision shows previous and new pathway, evidence that changed it, confidence change, and “Why this changed.”
- Next-Life Map has a text equivalent and deterministic factor detail available on demand.
- Safety escalation suppresses resale/donation/power-test CTAs and requires official current guidance where applicable.
- Consequential action generation uses an approval card with Approve and Not now; no third-party action is represented as completed.
- Loading uses real public event stages and Cancel. Timeout/tool limits preserve progress and offer retry or proceed with current evidence.
- Offline shows cached events/recommendation as dated, blocks live resume/current-source claims, and preserves user responses locally.
- Missing sources for a current local recommendation produce the required “could not verify” limitation rather than an invented option.

### 12.6 `/catalog` — My Circloora

**Purpose:** provide a persistent, searchable living catalog of Things and Spaces.

**Acceptance criteria:**

- Supports every required saved view plus All Things and Spaces.
- Search and filters cover all required fields; filter state is visible, removable, and restored on Back.
- Each card contains only the six prescribed fields; unavailable images use a neutral placeholder.
- Confidence and estimated range labels are visible without opening the Passport.
- Empty catalog offers Scan something and Import data; empty results offer Clear filters.
- Loading uses local card skeletons; refresh leaves existing cards visible.
- One corrupt record does not prevent other Things from rendering and offers export/recovery detail.
- Offline catalog remains searchable and editable with local-save status.
- Anonymous local mode is treated as normal; account backup prompt is secondary and dismissible.
- Delete/archive actions are not exposed as accidental one-tap card actions.

### 12.7 `/thing/[objectId]` — Circloora Passport

**Purpose:** provide the source-aware, evolving record and best next action for one Thing.

**Acceptance criteria:**

- Renders the Passport hierarchy in section 8.2 and includes every required Passport field when available.
- Shows observations separately from inferences/assumptions and includes source provenance, confidence, and last-updated dates.
- Shows current recommendation first, alternatives in Next-Life Map, and any safety veto before value/reward content.
- Displays the consumer-created Passport disclaimer.
- Estimated monetary values are ranges with “Estimate—not an appraisal.”
- Climate and Credits are separate cards with their required qualifications/disclosure.
- Recommendation revisions and verification results are immutable history entries; corrections append provenance.
- User can correct identity, change space, prepare transfer, archive, delete, or merge a duplicate with safe confirmation.
- Empty sections use truthful field-level copy such as “No warranty information added,” not invented defaults.
- Loading keeps header/known local identity visible; source refresh is localized.
- Offline shows cached source dates and disables current recall/local-pathway refresh with explicit connection copy.
- Not-found/deleted state links to Catalog and offers local import recovery where applicable.

### 12.8 `/missions` — Mission list

**Purpose:** show exactly what needs user action and what is progressing.

**Acceptance criteria:**

- Groups Missions into Needs you, In progress, Awaiting verification, and Done; state labels map to the defined mission state machine.
- Default ordering favors blockers and deadlines; user can filter by Thing, state, deadline, and pathway.
- Cards show objective, Thing, state, deadline, next action, effort, and expected cost/recovery.
- Available Credits are “Up to” until verified and carry the disclosure in context.
- Empty state says “No active missions” and offers Find a next action.
- Loading retains cached missions and shows Updating.
- A failed mission does not block other cards; its retry/action appears inline.
- Offline checkoffs save locally, and unverified work is not added to Credits/impact totals.
- Mission badge count equals items requiring user action, not all active missions.

### 12.9 `/mission/[missionId]` — Mission detail

**Purpose:** turn a recommendation into a finite, safe, verifiable action.

**Acceptance criteria:**

- Displays objective, Thing, reason, required evidence, ordered steps, deadline, effort, expected cost/recovery range, safety notes, approval, completion, verification, and potential Credits.
- One primary CTA follows the state-to-CTA mapping; completed steps remain visible.
- Action packet drafts are clearly drafts and cannot imply publishing, contact, booking, purchase, payment, or reward issuance.
- Approval identifies the exact draft/action scope and can be declined without losing the Mission.
- Safety notes remain pinned above affected steps and cannot be dismissed as complete without resolution.
- Deadline/fallback changes show their effect before update.
- “Mark done” leads to verification or `completed_unverified`; it never directly awards Credits.
- Empty/missing action packet offers Generate after approval, not placeholder content.
- Loading and API failure preserve checked steps and notes.
- Offline steps are usable; online/current-source steps are marked unavailable, and completion remains unverified.

### 12.10 `/plan/[investigationId]` — Coordinated Move Plan

**Purpose:** coordinate multi-Thing work against a deadline.

**Acceptance criteria:**

- Shows deadline, completed/total count, deadline risk, ordered daily plan, grouped trips, dependencies, fallback pathways, and expected completion date.
- Slower high-value pathways start earlier; fallback triggers are expressed as dates/times and conditions.
- Each plan item links to its Mission and identifies the Thing unambiguously.
- Preference/deadline changes rerun optimization and show an explainable diff before replacing the plan.
- Empty selection routes to inventory with “Choose at least one leaving Thing.”
- Loading shows plan-stage progress without fabricated percentages.
- Optimization failure keeps current Missions and offers retry or manual ordering.
- Offline shows cached plan and permits local progress; route/current-source data is dated and not called current.
- The plan never claims an appointment, pickup, or route is booked.

### 12.11 `/verify/[missionId]` — Outcome verification

**Purpose:** collect a claim and minimal evidence, then return an independent verification decision.

**Acceptance criteria:**

- Shows claimed outcome, Thing, previous recommendation, accepted evidence types, privacy warning, and why verification matters.
- Supports document/receipt, visual evidence, partner confirmation where configured, and user attestation; unsupported partner options are absent.
- User reviews/crops confirmed evidence before upload; duplicate image/document warnings appear before submission where possible.
- Submission is idempotent and one active claim exists per Mission.
- Results use only approved decisions and verification levels; insufficient evidence and rejected claims award zero Credits.
- Safety and duplicate/fraud flags can block or route to review without accusing the user in unsupported language.
- A request for more evidence is specific and resumable.
- Loading states name preparation, submission, and review; Cancel preserves a draft where consent permits.
- Offline mode can save a text checklist; it cannot verify or award Credits. Evidence queues only with explicit storage consent.
- Permission denial for camera leaves file upload and user-attestation options when appropriate.

### 12.12 `/credits` — Circloora Credits

**Purpose:** provide a transparent prototype reward ledger, not a marketplace or carbon instrument.

**Acceptance criteria:**

- Displays current settled balance, pending claims, verified Credits, Credits by pathway, recent activity, verification level, and circular actions completed.
- Displays the complete prototype disclosure prominently before activity/reward detail.
- Every entry links to its Mission and verification result and explains base action, multiplier/modifiers at an understandable level, and rounded award.
- Scan-only, unknown, disposal, insufficient, and rejected outcomes show zero and reason; they are not hidden to inflate perception.
- No cash value, redemption, transfer, wallet, exchange, token, offset, or marketplace UI appears.
- Future reward categories are labeled unavailable unless a real partner/redemption path is configured.
- Empty state guides to Missions, not more scans.
- Loading preserves settled balance; a pending refresh cannot change verified totals optimistically.
- Offline displays settled local ledger and marks pending sync; it never creates an award.
- Ledger error exposes affected entry only and retains audit history.

### 12.13 `/complete/[investigationId]` — Before-and-after summary

**Purpose:** close an investigation with an honest progress and outcome summary.

**Acceptance criteria:**

- Compares initial goal/inventory with current states: kept, moved forward, pending, blocked, or unknown.
- Separates verified outcomes from completed-unverified and pending Missions.
- Orders result information as outcome, user value, useful life/task progress, circular pathway, climate estimate, Credits.
- Provides one primary action: View My Circloora or View updated Passport when one Thing; unresolved work has a secondary Continue Missions.
- Climate unavailable/low-confidence results remain honest and do not suppress the completed practical outcome.
- Credits total includes only settled awarded entries and carries the disclosure.
- Empty/incomplete state explains which Mission must finish rather than rendering celebratory completion.
- Loading composes from persisted local ledgers; a failed remote refresh retains the saved summary.
- Offline shows cached verified results and does not verify new outcomes.

### 12.14 `/history` — Saved investigations

**Purpose:** find, resume, export, or delete past and paused Investigations.

**Acceptance criteria:**

- Groups active/paused and completed investigations and shows mode, goal, updated date, object count, deadline, and status.
- Status labels match the required Investigation state machine.
- Resume opens the exact saved stage and unresolved question; it does not create a new investigation.
- Export JSON, delete one Investigation, and import are available with clear image-retention exclusions.
- Delete explains whether linked Passports/Missions remain and requires confirmation.
- Empty state offers Start an investigation.
- Loading is local-first; corrupt/import-incompatible entries are isolated and exportable for recovery.
- Offline resume works for local-edit stages but clearly blocks live analysis/current-source stages.
- Anonymous history remains fully usable; sync prompt is secondary.

### 12.15 `/impact` — Verified circular outcomes and qualified estimates

**Purpose:** summarize what happened and what can responsibly be estimated without becoming a carbon dashboard.

**Acceptance criteria:**

- Default view leads with Circular Action and Circular Value; Climate Impact is a separate section and Credits link is separate.
- Aggregates only compatible units and clearly separates verified, user-attested, pending, and unknown outcomes.
- Climate estimates show ranges, confidence tier, boundaries, dates, assumptions, and comparison disclaimer; unavailable estimates remain visible as unavailable.
- Energy-consuming products show operational tradeoff/crossover where calculated and never assume repair is superior.
- Source/methodology detail is accessible for every quantitative claim.
- No offset, carbon-credit, neutralization, tree/flight equivalence, habitat-area, or false regeneration claim appears.
- Empty state says “Verified outcomes will appear here” and links to Missions.
- Loading does not optimistically add pending outcomes; errors isolate the affected aggregate.
- Offline uses settled ledger entries and marks methodology/source freshness.

### 12.16 `/profile` — Profile, account, preferences, and data controls

**Purpose:** manage functional preferences, anonymous/account state, privacy, notifications, regeneration preferences, and data lifecycle.

**Acceptance criteria:**

- Anonymous state clearly says “Saved on this iPhone” and offers optional Back up and sync without degrading local use.
- Account choices are Sign in with Apple, email magic link, and Google only when configured.
- Profile collects only required functional fields: first name, general location/postal code, household/occupancy, transportation, travel radius, repair comfort, resale threshold, donation, accessibility, reward, regeneration, privacy, and notification settings.
- It does not solicit or infer sensitive personal characteristics.
- Data controls support JSON export/import, delete one investigation/Thing through relevant screens, delete all local data, account export, account deletion, and optional evidence-storage consent.
- Delete-all/account-delete confirmation names consequences and does not conflate local and cloud deletion.
- Regeneration Preferences show the required preference-only disclosure and no impact credit.
- Notification denial presents in-app reminders; location denial/manual postal code remains functional.
- Auth/migration loading shows counts and keeps local data; failure returns to local mode intact.
- Offline allows local preference edits/export and marks sync/account actions unavailable.

### 12.17 `/install` — iPhone installation

**Purpose:** provide accurate Safari PWA installation and standalone guidance.

**Acceptance criteria:**

- Shows the required instruction: “Install Circloora on iPhone: open the Share menu in Safari, choose Add to Home Screen, enable Open as Web App, and tap Add.”
- Uses ordered steps with text alternatives; screenshots, if present, are supplemental and version-qualified.
- Detects standalone mode and replaces install CTA with “Circloora is installed.”
- Does not claim programmatic installation on iOS or that analysis works offline.
- Explains offline shell/local catalog versus online analysis/current pathways.
- Unsupported browser state suggests opening in Safari without blocking the rest of the app.
- Page is fully useful offline once cached and requests no permissions.

### 12.18 `/privacy` — Privacy practices

**Purpose:** explain data handling in plain language before or after use.

**Acceptance criteria:**

- Covers what is processed, why, what is stored locally, what may be sent to OpenAI, raw-image default, deletion, optional storage, analytics, and MVP limitations.
- States that raw images are not permanently stored by default, images are not placed in analytics or public access, exact address is not required, facial/biometric identification is prohibited, receipt contents are not used for ads, and personal data is not sold.
- Links directly to local delete/export and account deletion when signed in.
- Distinguishes Circloora retention from third-party processing without unsupported promises.
- Uses a dated/versioned summary and accessible headings.
- Page remains available offline and requests no permission.

### 12.19 `/methodology` — Methodology

**Purpose:** make decisions, claims, and limits inspectable without overwhelming primary workflows.

**Acceptance criteria:**

- Explains the circular hierarchy, safety/legal veto, deterministic pathway weights, preference modes, observations versus inferences, current-source priority, value ranges, verification decisions, four ledgers, Credits formula, impact confidence tiers, operational carbon, and unavailable estimates.
- States that the hierarchy is not absolute and gives the deadline/fallback example.
- States language-model intuition is not an emissions factor and deterministic code performs quantitative calculation.
- Includes the required Credits and carbon-offset disclaimers.
- Methodology is versioned so Passport calculations can link to the applicable version/date.
- Page remains readable offline if cached and requests no permission.

## 13. Cross-screen content and claim rules

### 13.1 Confidence vocabulary

- Identity/pathway confidence: High, Medium, Low, or Needs evidence.
- Climate evidence: Tier A Verified, Tier B Product-specific estimate, Tier C Category estimate, Tier D Insufficient.
- Verification: Partner verified, Document supported, Visually supported, User attested, Insufficient evidence, Rejected.
- Avoid ambiguous use of “verified”: identify what is verified—identity, source, outcome, or calculation input.

### 13.2 Source presentation

- Every current local recommendation has source name, source class, URL, retrieval date/time, eligibility, and limitations.
- Official municipal/government sources rank first, followed by manufacturer, established nonprofit, verified network, established marketplace, and reputable secondary sources.
- Stale sources are marked with the retrieval date and cannot be called current offline.
- If no pathway is verified, use exactly: “Circloora could not verify a current local pathway. Confirm with your municipal sanitation or waste authority before traveling.”

### 13.3 Safety language

- State observed sign and uncertainty: “The battery area appears deformed” rather than diagnosing a swollen battery as fact.
- Replace unsafe steps immediately and prohibit power testing, puncture/opening, charging, energized disassembly, smelling/tasting, mixing chemicals, asbestos handling, unsafe disposal, or hazardous donation.
- Official current guidance is required before transport/disposal instructions for regulated or hazardous materials.

### 13.4 Mock mode

Every mock workflow persistently displays:

> Demo analysis—OpenAI is not currently connected.

Mock current-source data is also labeled mock at the item level. No control or copy implies live analysis, a real partner, booking, reward redemption, or environmental outcome.

## 14. Analytics and UX observability contract

The defined analytics events should capture stage, mode, route, coarse category, status, duration, and anonymous session identifiers only as needed. They must never include raw images, precise location, receipt contents, personal notes, prompts, full model responses, or secrets.

Additional product-quality measures derived from the required events:

- Time to first useful result
- Capture permission denial recovery rate
- Evidence-request completion versus “I can’t provide this”
- Paused investigation resume success
- Recommendation revision comprehension (“Why this changed” opened)
- Mission creation-to-verification conversion
- Verification level distribution
- Duplicate claim block rate
- Anonymous save-to-account conversion, without nag impressions becoming a success metric
- Offline/local-storage failures

Analytics failure is never user-facing and never blocks a workflow.

## 15. Accessibility and release acceptance

Every screen-level criterion above is additionally subject to these cross-route gates:

- Semantic landmarks, heading order, named controls, visible focus, keyboard operation, and screen-reader state announcements pass automated and manual checks.
- Text and interactive controls meet contrast requirements in normal, error, disabled, and selected states.
- 200% text zoom does not clip critical content or hide actions.
- Reduced-motion preference is honored.
- All essential touch targets are at least 44×44 CSS pixels.
- Every required iPhone viewport has no horizontal overflow; bottom actions remain above Safari chrome/safe area.
- Keyboard-open forms keep the active input and error visible.
- Camera, voice, audio, haptic, gesture, and color all have complete alternatives.
- No critical task has an inaccessible time limit.
- Back, reload, app switch, and offline transitions do not silently lose user work.

## 16. Implementation interfaces created by this architecture

The following UX contracts should be shared before implementation agents work in parallel:

1. **App shell contract:** four routes, scan action behavior, focused-task shell, safe-area layout, and badge semantics.
2. **View-state contract:** `initial | loading | refreshing | ready | empty | offline | permission_denied | partial_error | blocking_error | safety_escalation`, with cached data allowed in all noninitial states where available.
3. **Public agent-event contract:** concise stage, agent/tool label, object, status, and user-action-required flag; never private reasoning.
4. **Evidence-request contract:** question, reason, target, framing, capture mode, optional physical test, prohibited actions, completion criteria, and accessibility alternative.
5. **Confidence/source contract:** domain-specific confidence label plus origin, retrieval/calculation date, assumptions, limitations, and link.
6. **Approval contract:** exact proposed action, consequences, data shared, expiry/scope, Approve, Not now, and resulting state.
7. **Ledger-card contract:** Action, Value, Climate, and Credits cards may coexist but never merge units or visual meaning.
8. **Local/cloud status contract:** Saved on this device, Syncing, Synced, Needs attention, and Local only, with migration never deleting local source before confirmed cloud persistence.
9. **Route-not-found contract:** name missing entity, preserve shell, link to parent collection, and avoid fabricated substitutes.
10. **Sensitive-image contract:** warning, crop/retake, confirm, retention choice, and no analytics payload.

## 17. Product risks and decisions requiring Build Director resolution

1. **Landing/Home route duality:** conditional `/` is recommended. A separate `/home` would simplify implementation but violates the provided route set and creates unnecessary navigation ambiguity.
2. **Local save versus conversion wording:** “Save to My Circloora” must succeed locally before the account offer. Gating the save would contradict anonymous local mode and damage trust.
3. **Passport image expectation:** raw images are not stored by default, yet catalog cards require an image. The implementation needs an explicit privacy-approved derived-thumbnail policy or must reliably use a placeholder. A thumbnail is still image data and must not be treated as exempt by assumption.
4. **Offline evidence queues:** queuing images conflicts with no-default-retention. Default should be metadata-only draft plus recapture; storage requires explicit consent.
5. **Credits disclosure density:** the full disclosure belongs on `/credits`; compact contexts need an adjacent disclosure affordance with the fixed core sentence. Hiding it only in Terms is not acceptable.
6. **Climate methodology maturity:** aggregate impact UI must be capable of “unavailable” at launch. Product pressure to fill every card with a number is a claims risk.
7. **Current-source freshness:** exact freshness windows need methodology/security/data agreement by source/pathway type. UX can show retrieval date but cannot define legal currency alone.
8. **Account provider availability:** Google is optional and must not appear as a dead control. Apple/email must have fully tested callback and migration failure states before launch.
9. **Notification scope:** MVP can prepare in-app/copyable reminders without claiming calendar or push integration. Any actual push/calendar behavior requires an explicit interface and permission review.
10. **Room inventory scale:** the eight-object limit is a launch constraint. The UI must help users choose/add rather than implying omitted objects were not detected or do not exist.

## 18. Phase-1 definition of ready

Product/UX architecture is ready for Build Director integration when:

- The Build Director reconciles this route/state contract with identity, data, agent, methodology, security, and QA reports.
- Shared names for Investigation, Thing/ObjectPassport, Mission, verification, ledger entries, evidence requests, source records, and UI states are locked before implementation.
- The derived-thumbnail/privacy decision is documented.
- Conditional `/` behavior and `/profile` addition are accepted or replaced by an explicit route ADR.
- Every implementation workstream accepts the state, permission, offline, disclosure, and accessibility responsibilities relevant to its owned screens.
