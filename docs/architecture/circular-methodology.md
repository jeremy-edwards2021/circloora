# Circloora circular methodology architecture

Status: Phase 1 architecture contract  
Scope: circular hierarchy, deterministic pathway ranking, the four ledgers, climate estimates, verification, Credits, abuse controls, future sponsor rewards, regeneration, and claim language  
Audience: Build Director; agent-runtime, data, catalog, missions, impact/Credits, sources, operations, security, product, and QA implementers  
Non-goal: production application code or a product-level life-cycle assessment

## 1. Architecture decision

Circloora must preserve four independent ledgers. No aggregate “sustainability score” may combine them.

| Ledger | Canonical question | May contain estimates? | User-facing priority |
| --- | --- | --- | --- |
| Circular Action | What happened to the object? | Only confidence in the outcome; the claimed action itself is categorical | Source of truth |
| Circular Value | What practical, functional, or economic value was retained? | Yes, as ranges | Lead with this on completion |
| Climate Impact | What is the estimated difference between explicit life-cycle scenarios? | Yes; quantitative only at climate tiers A–C | Supporting context |
| Circloora Credits | What prototype behavior points were earned under the incentive rules? | Formula inputs are recorded; points are deterministic | Last in the reward hierarchy |

These ledgers may reference the same `objectId`, `missionId`, and verified action, but one ledger must never be used as a substitute for another. In particular:

- Credits are behavioral reward points, not carbon credits, offsets, renewable-energy certificates, securities, cryptocurrency, money, or environmental commodities.
- A climate estimate is a comparative scenario result, not proof of an action and not an emissions-inventory reduction.
- A drop-off, listing, or user statement is not proof that a product was reused, recycled, or composted.
- A sponsor contribution is an externally funded transaction, not a physical consequence of the user's object action.
- Economic value and carbon impact may point in different directions. Preserve both results rather than collapsing them.

The user-facing outcome order is:

1. supported action and its verification level;
2. money recovered or replacement spending potentially avoided;
3. estimated useful life extended and mission completion;
4. circular pathway reached;
5. qualified climate range or “estimate unavailable”;
6. Circloora Credits.

## 2. Circular hierarchy

### 2.1 Default hierarchy and circular-value prior

The hierarchy is a decision prior, not an absolute instruction. `hierarchyRank` is used for tie-breaking and explanations. `defaultCircularValueScore` is the balanced-mode input to the 25% circular-value factor; it is not a percentage impact claim.

| Rank | Pathway | Canonical key | Default circular-value score |
| ---: | --- | --- | ---: |
| 1 | Avoid unnecessary replacement | `avoid_replacement` | 100 |
| 2 | Continue using | `continued_use` | 98 |
| 3 | Maintain | `maintenance` | 96 |
| 4 | Repair | `repair` | 93 |
| 5 | Upgrade while preserving the product | `upgrade` | 89 |
| 6 | Share or lend | `share` or `lend` | 86 |
| 7 | Resell for continued use | `resell` | 84 |
| 8 | Transfer directly for continued use | `direct_transfer` | 82 |
| 9 | Donate for direct reuse | `donate_for_reuse` | 78 |
| 10 | Return to manufacturer | `manufacturer_return` | 70 |
| 11 | Refurbish | `refurbish` | 68 |
| 12 | Recover reusable components | `components_recovery` | 52 |
| 13 | Recycle materials | `material_recycling` | 35 |
| 14 | Compost appropriate biological material | `compost` | 32 |
| 15 | Use official special-waste handling | `special_handling` | 15 |
| 16 | Dispose | `dispose` | 0 |

The numeric prior is versioned configuration, not model output. It expresses preservation of function, product integrity, and material value. It does not claim that one pathway always has a lower carbon footprint.

When the destination of a manufacturer return or special-waste program is known, score the verified downstream outcome rather than the collection label. For example, a take-back program that demonstrably refurbishes the product uses the `refurbish` circular-value score; one that only accepts the item but gives no downstream information remains `manufacturer_return`. A special-handling event that demonstrably recycles material may use `material_recycling`; safe disposal remains `special_handling` or `dispose` and receives no invented recovery benefit.

“Avoid unnecessary replacement” is a counterfactual pathway, not a synonym for owning or continuing to use an object. It may be selected only when an imminent, functionally comparable replacement was credibly under consideration and the supported action actually removed that need. Otherwise the pathway is `continued_use`, `maintenance`, or `repair`.

### 2.2 Eligibility gates

Every candidate passes gates before scoring. A failed hard gate produces `disqualified`, a reason code, evidence, and the evidence that could permit reconsideration. Disqualified pathways are shown only when the explanation is useful; they are never presented as actionable recommendations.

Hard gates are:

1. **Safety:** the proposed use, handling, transport, recipient, repair, or disposal must not conflict with a safety flag or prohibited action.
2. **Legality:** the pathway must be lawful for the object, jurisdiction, owner, transport mode, and recipient.
3. **Ownership and authority:** the user must have authority to sell, donate, transfer, modify, or discard the object.
4. **Condition and functionality:** the object must meet the pathway's minimum supported condition; unknown safety-critical condition is not assumed safe.
5. **Recall and eligibility:** a recalled, regulated, contaminated, or program-ineligible object cannot enter an incompatible pathway.
6. **Current local reality:** a provider-dependent path requires a current, source-backed route; no organization, acceptance rule, event, or pickup may be invented.
7. **Hard deadline:** if even the conservative low completion time falls after a non-negotiable deadline, the pathway cannot be the primary plan. It may remain a documented pre-deadline attempt only when a feasible fallback has an explicit switch date.
8. **Evidence sufficiency:** missing identity or condition evidence that could change safety or legal eligibility pauses ranking instead of being filled by model intuition.

### 2.3 Safety vetoes

Safety overrides hierarchy, score, convenience, money, preference, climate estimates, and Credits. At minimum, the following conditions trigger a veto or an official-guidance-only state:

- visibly swollen, leaking, hot, punctured, or otherwise damaged lithium batteries;
- chemicals, paint, solvents, pressurized containers, medication, sharps, biological waste, firearms, ammunition, suspected asbestos, and unknown hazardous material;
- verified recalls whose remedy prohibits continued use, resale, donation, or ordinary disposal;
- suspected structural, electrical, fire, child-product, food-contact, or contamination hazards where the intended pathway depends on safety;
- any handling step that would require opening a battery, puncturing it, charging a visibly damaged battery, disassembling energized equipment, smelling or tasting a substance, mixing chemicals, handling suspected asbestos, or transporting regulated material contrary to official guidance.

The result is pathway-specific. A damaged battery may veto continued use, power testing, repair instructions, resale, ordinary donation, ordinary recycling, and ordinary disposal while allowing only a current official battery-handling pathway. If current official guidance cannot be verified, the app pauses action and directs the user to the relevant municipal, manufacturer, or emergency authority without fabricating instructions.

Safety also vetoes Credits when the claimed completion used a prohibited method, moved an unsafe product into reuse, evaded a recall, or lacks the safety-critical evidence required for the outcome. Safe special handling is recorded in the Action Ledger even when its Credits base is zero.

### 2.4 Exception logic

After hard gates, eligible candidates are scored. A lower-hierarchy pathway may be primary only when one of these conditions is recorded:

- every higher pathway is disqualified;
- its deterministic score exceeds the best higher pathway by at least 5.0 points;
- a hard deadline requires a time-boxed attempt plus a lower-path fallback;
- the user explicitly selects a lower path after seeing the tradeoff, provided safety and legality still pass.

If the difference is under 5.0 points, choose the higher-hierarchy pathway. Exact ties resolve by: higher hierarchy, higher evidence confidence, lower user burden, shorter travel, then stable pathway key. The model may explain this result but cannot reorder it.

Every lower-hierarchy recommendation must state:

- the highest feasible path considered;
- why it lost or was disqualified;
- the factors and source facts responsible;
- what new evidence could change the result;
- the fallback and switch date when time is the reason.

## 3. Deterministic pathway scoring

### 3.1 Formula

The methodology is displayed as factor points from 0 to 100 and weight percentages summing to 100. The canonical persistence/wire representation uses equivalent decimals from 0 to 1 so it aligns with the shared `PathwayScoreSchema` and avoids scale ambiguity.

```text
rawScore     = Σ(canonicalFactor × canonicalWeight)          // 0..1
displayScore = rawScore × 100                                // 0..100

equivalently:
displayScore = Σ(displayFactor × weightPercent) / 100
```

The result is rounded to one decimal for display, while comparison uses the unrounded decimal. Safety and legality are gates, never positive weighted factors. A language model may identify facts, propose candidates, and explain results; deterministic code owns normalization, weights, gates, score, sort, and tie-breaking.

### 3.2 Balanced factors

| Factor | Balanced weight | Deterministic meaning |
| --- | ---: | --- |
| Circular value retained | 25 | Versioned pathway prior, adjusted only by supported downstream outcome and condition |
| Probability of completion | 18 | Rule-based likelihood that this user can complete this available pathway; excludes deadline and travel, which have their own factors |
| Evidence confidence | 12 | Composite confidence in identity, condition/function, and pathway facts |
| Deadline fit | 12 | Fit of the completion-time range to the user's deadline |
| Local availability | 10 | Current, source-backed availability and eligibility |
| Financial recovery | 9 | Conservative net practical value, including avoided spending where supported |
| User effort fit | 6 | Lower safe burden scores higher, adjusted for the user's stated capabilities |
| Travel fit | 5 | Fit to radius and available transportation |
| User preference match | 3 | Match to explicit, non-sensitive preferences not already represented by the selected mode |

### 3.3 Preference modes

No mode may change a hard gate or add an unbounded “preference bonus.”

| Mode | Circular | Success | Evidence | Deadline | Availability | Financial | Effort | Travel | Preference |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Balanced | 25 | 18 | 12 | 12 | 10 | 9 | 6 | 5 | 3 |
| Maximize money | 18 | 15 | 10 | 8 | 8 | 25 | 5 | 4 | 7 |
| Minimize waste | 40 | 18 | 12 | 8 | 8 | 3 | 3 | 3 | 5 |
| Finish fastest | 15 | 20 | 10 | 25 | 12 | 4 | 5 | 5 | 4 |
| Minimize travel | 18 | 15 | 10 | 10 | 10 | 5 | 8 | 20 | 4 |
| Minimize effort | 18 | 15 | 10 | 10 | 10 | 5 | 20 | 8 | 4 |

### 3.4 Factor normalization

All normalization tables and thresholds carry a `methodologyVersion`. Inputs that are ranges use the conservative bound identified below.

**Circular value retained.** Start from the table in section 2.1. A verified downstream outcome may replace a collection-path prior. Condition may reduce the score only when it reduces retained function: full function `+0`; repairable or refurbishable `-5`; restricted/partial function `-10`; component-only condition uses the component pathway rather than a large ad hoc penalty. Clamp to `[0, 100]`.

**Probability of completion.** Use rule bands, not a model-provided probability:

- 95: accepted appointment, confirmed pickup, committed recipient, or partner reservation;
- 85: current official/partner pathway, user eligibility met, capacity not individually reserved;
- 65: current established pathway with a material capacity, demand, or scheduling uncertainty;
- 40: marketplace or person-to-person path with no committed recipient;
- 0: provider-dependent pathway with no current verifiable route.

Deterministic condition and user-capability rules may adjust a band by at most 15 points. The reason codes and source facts must be stored. Deadline and distance do not adjust this factor.

**Evidence confidence.** Map the prospective identity, condition, and pathway evidence separately to `official_or_partner=100`, `document=90`, `direct_visual=70`, `user_report=40`, and `insufficient=0`, then calculate:

```text
evidenceConfidence = 0.40(identity) + 0.30(condition) + 0.30(pathwayFacts)
```

Missing safety-critical evidence triggers a gate rather than merely lowering this score. This prospective score is distinct from outcome verification and climate evidence tier.

**Deadline fit.** Let `A` be usable time remaining, and `L`/`H` the candidate's low/high completion-time estimate in the same unit.

```text
no deadline                  -> 100
A >= H                       -> 100
L <= A < H                   -> 20 + 80 × (A - L) / (H - L)
A < L, soft deadline         -> 0, fallback-only
A < L, hard deadline         -> disqualified as primary
```

Zero-width ranges use `100` when `A >= H`, otherwise `0`. Completion-time sources and assumptions are stored.

**Local availability.** Use `100` for an accepted/confirmed local appointment or no-provider path; `90` for a current official or partner route whose eligibility is met; `75` for a current established nonprofit/network/marketplace route; `50` for a verified mail-in or nonlocal route that fits constraints; `0` when a provider-dependent route cannot be verified. A zero does not authorize inventing a local recommendation.

**Financial recovery.** Calculate a conservative net range:

```text
net practical value = money recovered
                    + supported replacement spending avoided
                    - repair cost
                    - transaction fees
                    - transportation cost
```

Use the low bound for ranking. Convert to `[0, 100]` through a versioned, currency/locale-specific table, with 50 representing approximately cost-neutral. Respect the user's stated minimum resale threshold and budget, but do not infer income. All user-facing money remains a range and says “Estimate—not an appraisal.”

**Effort fit.** Score predeclared safe mission burden: 100 for at most 10 minutes/no coordination; 85 for at most 30 minutes; 70 for at most 60 minutes; 50 for at most two hours or one appointment; 25 for more than two hours or multiple coordination steps; 0 when it conflicts with the user's stated accessibility or capability constraint. Never treat hazardous handling as commendable effort.

**Travel fit.** No trip or confirmed pickup is 100. Otherwise use the conservative high distance and the user's stated radius `R`:

```text
within radius: max(20, 100 - 80 × distance / R)
outside radius or incompatible transportation: 0
```

When no radius is provided, use a disclosed locale default. Distance uncertainty is stored; an exact route is not claimed from approximate distance.

**User preference match.** Use only explicit functional preferences: 100 direct match, 50 neutral, 0 conflict. Examples are repair comfort, pickup preference, reward category, or speed-versus-environment priority. Sensitive inferred characteristics are prohibited.

### 3.5 Output contract and fallbacks

A ranked result contains the raw factor inputs, normalized scores, active weights, unrounded total, display total, eligibility, disqualifying reasons, hierarchy rank, sources, limitations, and `evidenceThatCouldChangeRanking`. The score is reproducible from persisted inputs and a methodology version.

A move plan ranks pathways per object first, then optimizes schedule, grouped travel, dependencies, and switch dates. Route optimization must not mutate pathway scores. If current information expires or a deadline changes, re-run the score, store a recommendation revision, and explain the changed inputs.

## 4. Evidence systems

Circloora has three distinct concepts that must not share one `confidence` field:

1. prospective evidence confidence used in pathway ranking;
2. action verification level used to support a completed outcome and Credits;
3. climate evidence tier used to determine whether a climate estimate is quantitative.

### 4.1 Action verification levels

| Level | Meaning | Credits multiplier | Claim language |
| --- | --- | ---: | --- |
| `partner_verified` | Authenticated partner evidence supports the claimed event | 1.00 | “Partner verified” |
| `document_supported` | Receipt, confirmation, service record, or other document supports the event | 0.90 | “Document supported” |
| `visually_supported` | Visual evidence supports observable completion, with stated limits | 0.70 | “Visually supported” |
| `user_attested` | The user's statement is the only supporting outcome evidence | 0.35 | “User attested” — never shorten to “verified” |
| `insufficient_evidence` | Evidence cannot support the claimed outcome | 0 | “More evidence needed” |
| `rejected` | Evidence contradicts the claim, is ineligible, duplicate, unsafe, or invalid | 0 | “Claim not approved” with a non-accusatory reason |

A receipt from a collection program supports delivery or acceptance, not necessarily downstream reuse or recycling. Verification records the narrowest outcome actually supported.

### 4.2 Climate evidence tiers

| Tier | Entry requirements | Quantitative behavior | Display |
| --- | --- | --- | --- |
| A — Verified | Applicable manufacturer PCF, EPD, official DPP data, audited LCA, or verified product-specific energy data; boundary, geography, age, and functional unit are compatible | Product/scenario range; never assume zero uncertainty | “Higher-confidence comparative range” plus exact source and limitations |
| B — Product-specific estimate | Exact/probable model, supported weight and materials, trusted lifecycle dataset, geographic assumptions, and compatible functional unit | Product-specific range with sensitivity | “Product-specific estimate” and medium/high confidence as justified |
| C — Category estimate | Supported category, approximate weight, probable composition, generic category factors, and geographic/time assumptions | Broad range only | “Category estimate” and low/medium confidence |
| D — Insufficient | Identity, weight, composition, baseline, operational data, displacement, or compatible factor is missing or contradictory | No quantitative climate result | “Climate estimate unavailable with the current evidence.” |

Tier A verifies the source quality; it does not turn the comparative result into an audited carbon asset. A model cannot promote a tier, invent a factor, or treat a marketing claim as lifecycle data. If a nominally high-quality source has an incompatible boundary or functional unit, downgrade it or use tier D.

## 5. Climate Impact Ledger

### 5.1 When Circloora calculates

Quantitative climate calculation is optional. It is allowed only when all of these are explicit:

- a functionally equivalent baseline and alternative;
- a common service quantity and analysis horizon;
- supported product identity/category and mass or energy inputs appropriate to the tier;
- lifecycle factors from approved source families, never language-model intuition;
- geography, date, unit, boundary, and source provenance;
- a supported displacement assumption for avoided production claims;
- intervention, transport, operational, refrigerant, and end-of-life stages included or explicitly excluded;
- uncertainty broad enough to reflect the inputs.

If a decision-relevant input is absent, the result is tier D. The app may still show the factual circular outcome.

Approved source families are manufacturer PCFs, EPDs, official Digital Product Passports, audited LCAs, Product Environmental Footprint/category rules, government conversion factors, trusted lifecycle databases, region-specific energy factors, and EPA WARM for high-level materials-management comparisons. Source version, publication/retrieval date, jurisdiction, and boundary are required. WARM is a screening comparison and must not be presented as a product-specific LCA.

### 5.2 Functional unit, baseline, horizon, and sign

Every comparison defines a functional unit such as “provide refrigerated storage of the stated usable capacity for five years” or “provide one functional chair for the user's expected use period.” Compare the same service, quality, location, and time horizon.

Past production emissions of the existing object are sunk and are not subtracted as though they can be undone. “Embodied carbon retained or avoided” is consumer shorthand for future replacement-related embodied emissions that the scenario may avoid; the methodology view must say this.

For stage totals represented as intervals:

```text
baselineTotal    = production + intervention + transport + operation + refrigerant + endOfLife
alternativeTotal = production + intervention + transport + operation + refrigerant + endOfLife

comparativeDelta = baselineTotal - alternativeTotal
deltaLow         = baselineLow - alternativeHigh
deltaHigh        = baselineHigh - alternativeLow
```

Positive delta means the alternative is estimated to emit less. If the interval crosses zero, display “Direction uncertain under current assumptions,” not “emissions avoided.” If the interval is fully negative, state that the alternative is estimated to increase emissions under the stated scenario. Never hide a negative result.

### 5.3 Non-operational products

For furniture, clothing, books, packaging, and other products with no material use-phase energy or fuel, compare:

- replacement production and upstream stages adjusted by a supported displacement range;
- maintenance, repair, refurbishment, or transfer intervention materials and services;
- transport for both scenarios;
- timing and method of end-of-life treatment;
- any use-phase impacts that are material and supported, such as care or laundering, rather than assuming they are always zero.

Do not assume a resale or donation causes one-for-one displacement. `displacementAssumption` is a range supported by category methodology, study, or strong case evidence. If no defensible assumption exists, do not calculate avoided production emissions.

For ordinary consumer products, display “Estimated production and lifecycle emissions avoided” only when the result is wholly positive. For building products and construction materials, “Estimated embodied carbon retained or avoided” is permitted with the sunk-emissions explanation and a compatible building-material methodology.

### 5.4 Operational products and decision boundary

Operational comparison is required when electricity, fuel, refrigerant, or another operational resource may materially change the result. Examples include refrigerators, air conditioners, heating equipment, lighting, computers, televisions, appliances, vehicles, and building systems.

Compare at least `continue`, `repair`, `upgrade`, and `replace` where safe and plausible. Include:

- measured or source-backed existing consumption and utilization;
- local marginal or otherwise methodology-approved energy/fuel factor, identified explicitly;
- replacement efficiency under the same service level;
- replacement production, shipping, installation, and immediate disposal of the existing object;
- repair/upgrade parts, service, transport, and expected life;
- expected remaining life and common horizon;
- refrigerant charge, leakage/service scenarios, and recovery where material;
- end-of-horizon residual life or allocation so one scenario is not charged a full end-of-life stage unfairly.

If existing energy use, new-product efficiency, usage, lifetime, or a material refrigerant assumption is unavailable, do not issue a directional quantitative recommendation. Safety, reliability, cost, and circular value may still support a non-climate recommendation.

### 5.5 Carbon crossover

For a constant annual operational comparison over a common horizon, define:

```text
replacementUpfront = new production + delivery + installation + dispose-existing-now
keepUpfront        = repair/upgrade + its transport + near-term service
upfrontAdvantageOfKeeping = replacementUpfront - keepUpfront

oldAnnualOperation = existing resource use × applicable emissions factor + refrigerant allowance
newAnnualOperation = replacement resource use × applicable emissions factor + refrigerant allowance
annualPenaltyOfKeeping = oldAnnualOperation - newAnnualOperation
```

When `upfrontAdvantageOfKeeping > 0` and `annualPenaltyOfKeeping > 0`:

```text
carbonCrossoverYears = upfrontAdvantageOfKeeping / annualPenaltyOfKeeping
```

- analysis horizon entirely before the crossover: keeping/repairing is estimated lower-carbon;
- horizon entirely after the crossover: replacement is estimated lower-carbon on the climate comparison;
- crossover interval overlaps the horizon: direction is uncertain;
- `annualPenaltyOfKeeping <= 0`: there is no operational crossover favoring replacement under the scenario;
- `upfrontAdvantageOfKeeping <= 0` with a positive operational penalty: replacement is lower from the start under the scenario.

Inputs are ranges. Compute a crossover interval only when the entire denominator range is positive. If it spans zero, display “No stable crossover estimate.” Time-varying grid factors, degradation, changing use, staged replacement, and end-of-life timing require a year-by-year deterministic scenario rather than the simple formula.

The climate crossover informs the climate factor and explanation; it does not by itself bypass safety, affordability, user approval, or the pathway scorer.

### 5.6 End-of-life and waste boundaries

End-of-life comparison distinguishes collection, sorting, processing, recovery yield, composting, combustion, landfill, and special handling when the source methodology supports them. Include transport and timing consistently. Do not simultaneously claim both full production avoidance and full recycling substitution if that double-counts the same displaced virgin material.

`estimatedWasteMassDiverted` is a mass comparison, not a carbon result. “Diverted from disposal” requires evidence of an alternative destination; delivery to a collection point alone should be phrased as “delivered for processing” unless downstream completion is supported.

## 6. Calculation and ledger contracts

The following are language-agnostic domain contracts, not production TypeScript. The Data and Identity Architect owns the final storage representation; implementations must preserve these semantics and stable identifiers.

The canonical Action Ledger outcome union is:

```text
continued_use | maintenance_completed | repair_completed | upgrade_completed |
refill_completed | shared | lent | resold | directly_transferred |
donated_for_reuse | manufacturer_return | refurbished | components_recovered |
material_recycled | composted | special_handling_completed | disposed | outcome_unknown
```

`avoid_unnecessary_replacement` is a Credit claim classification corresponding to the ranked `avoid_replacement` counterfactual and supported by one of these real outcomes; it is not a second physical action entry.

```text
Range<T> {
  low: number
  high: number
  unit: T
  centralMethod?: "midpoint" | "median" | "none"
}

MoneyRange {
  lowMinor: integer
  highMinor: integer
  currency: ISO4217
}

MethodologySource {
  sourceId: UUID
  publisher: string
  title: string
  url: string
  sourceType: "PCF" | "EPD" | "DPP" | "LCA" | "PEF" | "government_factor" |
              "WARM" | "energy_factor" | "partner_record" | "other"
  publicationDate?: ISODate
  retrievedAt: ISODateTime
  validFrom?: ISODate
  validUntil?: ISODate
  expiresAt?: ISODateTime
  jurisdiction?: string
  geography?: string
  version?: string
  lifecycleBoundary?: string
  functionalUnit?: string
  qualityNotes: string[]
  verificationStatus: "verified" | "partially_verified" | "unverified" | "expired"
}

CircularActionEntry {
  actionId: UUID
  objectId: UUID
  missionId: UUID
  pathway: SupportedOutcome
  claimedAt: ISODateTime
  startedAt?: ISODateTime
  completedAt?: ISODateTime
  verificationLevel: ActionVerificationLevel
  evidenceRefs: UUID[]
  verifier: { kind: "partner" | "system" | "user"; id?: string }
  supportedOutcome: string
  confidence: number
  sourceIds: UUID[]
  limitations: string[]
  safetyReview: "passed" | "escalated" | "blocked"
  auditVersion: string
}

CircularValueEntry {
  valueEntryId: UUID
  actionId: UUID
  objectId: UUID
  missionId: UUID
  currency: ISO4217
  moneyRecovered?: MoneyRange
  replacementSpendingAvoided?: MoneyRange
  repairCost?: MoneyRange
  transactionFees?: MoneyRange
  transportationCost?: MoneyRange
  estimatedRemainingValue?: MoneyRange
  estimatedUsefulLifeExtended?: Range<"days" | "months" | "years">
  userTimeSpent?: Range<"minutes" | "hours">
  estimatedTimeSaved?: Range<"minutes" | "hours">
  tripsRequired?: number
  tripsConsolidated?: number
  itemsKeptInUse?: number
  itemsTransferred?: number
  itemsDivertedFromDisposal?: number
  assumptions: string[]
  sourceIds: UUID[]
  confidence: number
  calculatedAt: ISODateTime
  methodologyVersion: string
  limitations: string[]
}

ImpactScenario {
  scenarioId: UUID
  name: string
  role: "baseline" | "alternative"
  functionalUnit: string
  horizon: Range<"years">
  geography: string
  displacementAssumption?: Range<"fraction">
  stages: {
    production?: Range<"kgCO2e">
    intervention?: Range<"kgCO2e">
    transport?: Range<"kgCO2e">
    operation?: Range<"kgCO2e">
    refrigerant?: Range<"kgCO2e">
    endOfLife?: Range<"kgCO2e">
  }
  exclusions: string[]
  assumptions: string[]
}

ClimateImpactEntry {
  impactEntryId: UUID
  actionId?: UUID
  objectId: UUID
  missionId?: UUID
  impactCategory: "production_avoided" | "embodied_retained_or_avoided" |
                  "operational_delta" | "end_of_life_delta" | "waste_mass_diverted" |
                  "virgin_material_demand_avoided" | "transport_emissions" | "unavailable"
  evidenceTier: "A" | "B" | "C" | "D"
  lowEstimate?: number
  highEstimate?: number
  unit?: "kgCO2e" | "kg" | "kWh" | string
  impactBoundary: string
  baselineScenario: ImpactScenario
  alternativeScenario: ImpactScenario
  displacementAssumption?: Range<"fraction">
  comparativeDirection: "positive" | "negative" | "uncertain" | "unavailable"
  carbonCrossoverYears?: Range<"years">
  sourceIds: UUID[]
  calculationMethod: string
  calculationDate: ISODateTime
  methodologyVersion: string
  confidence: number
  uncertainty: string[]
  limitations: string[]
  unavailableReason?: string
}

PathwayScoreRecord {
  pathwayId: UUID
  objectId: UUID
  eligibility: "eligible" | "fallback_only" | "disqualified"
  safetyLegalVeto: boolean
  disqualifyingFactors: ReasonCode[]
  factorInputs: Record<FactorKey, unknown>
  factorScores: Record<FactorKey, number>  // each canonical 0..1
  activeWeights: Record<FactorKey, number> // each canonical 0..1; sum 1
  rawTotal?: number                         // 0..1
  displayTotal?: number                     // 0..100
  hierarchyRank: number
  methodologyVersion: string
  sourceIds: UUID[]
  evidenceThatCouldChangeRanking: string[]
  limitations: string[]
}

CreditCalculation {
  claimId: UUID
  actionId: UUID
  objectId: UUID
  missionId: UUID
  baseActionScore: number
  verificationMultiplier: number
  valueRetentionMultiplier: number
  effortMultiplier: number
  environmentalConfidenceModifier: number
  rawCredits: number
  roundedCredits: number
  capApplied: number
  awardedCredits: number
  status: "pending" | "awarded" | "rejected" | "reversed"
  eligibilityReasons: ReasonCode[]
  safetyVeto: boolean
  duplicateRiskFlags: ReasonCode[]
  methodologyVersion: string
  calculatedAt: ISODateTime
}
```

All ranges require finite values and `low <= high`. Money uses integer minor units plus an ISO 4217 code. Climate calculations use decimal values with explicit units and never infer unit conversion from a label. Tier D requires `unavailableReason` and forbids `lowEstimate`, `highEstimate`, and crossover values. A–C require at least one compatible source, explicit scenarios, and a methodology version.

Every calculation is immutable after award or publication. Corrections append a superseding entry or reversal linked to the previous entry. The persisted public explanation is generated from stored inputs; private chain-of-thought is never stored.

## 7. Circloora Credits methodology

### 7.1 Eligibility and formula

An action is credit-eligible only after an outcome verification decision. A scan, candidate pathway, listing draft, mission creation, intention, unknown outcome, ordinary disposal, or unsupported claim earns zero.

```text
Raw Credits = Base Action Score
            × Verification Multiplier
            × Value Retention Multiplier
            × Effort Multiplier
            × Environmental Confidence Modifier

Awarded Credits = safety/abuse gate passes
                AND rounded Credits fit within the remaining daily allowance
                ? round-half-up(Raw Credits)
                : 0
```

Credits are not calculated per kilogram of CO2e, per pound of material, per dollar, or per mile. A missing climate estimate does not make an otherwise supported circular action ineligible.

### 7.2 Base action scores

| Eligible outcome | Base |
| --- | ---: |
| Avoided unnecessary replacement | 650 |
| Repair completed | 600 |
| Maintenance extending use | 550 |
| Resold for continued use | 500 |
| Direct transfer, share, or lend resulting in use | 475 |
| Refill or repeated reuse completed | 425 |
| Donated for direct reuse | 375 |
| Manufacturer return accepted | 300 |
| Refurbishment completed | 300 |
| Reusable components recovered | 225 |
| Material recycling supported | 150 |
| Appropriate composting supported | 125 |
| Scan, listing, intent, unknown outcome, special handling without recovery, or disposal | 0 |

Only one base action score applies to one claim. Do not stack “repair,” “continued use,” and “avoided replacement” for the same event. The highest base is used only when its distinct evidence requirements are met, not because it yields more points.

Ambiguous action mappings are normative:

- `continued_use` earns zero by itself. It maps to avoided unnecessary replacement only when the pre-existing mission, imminent replacement counterfactual, functional evidence, and continued-use evidence support that claim.
- `upgrade_completed` maps to maintenance, repair, refurbishment, or avoided replacement according to the narrow supported outcome; it has no independent base.
- `shared` and `lent` map to direct transfer only after evidence of actual use, not when merely offered.
- `special_handling_completed` earns zero unless evidence supports a listed recovery outcome. This avoids incentivizing acquisition or risky handling of hazardous material.
- a manufacturer-return receipt supports the 300 base when acceptance is proven; the value-retention multiplier reflects the known or unknown downstream outcome.

### 7.3 Verification multiplier

| Level | Multiplier |
| --- | ---: |
| Partner verified | 1.00 |
| Document supported | 0.90 |
| Visually supported | 0.70 |
| User attested | 0.35 |
| Insufficient evidence | 0 |
| Rejected | 0 |

“Verified repair” in the base table means a supported completed repair, not exclusively `partner_verified`. A user-attested repair can earn reduced points as required by the build brief, but its UI label remains “User attested.”

### 7.4 Value-retention multiplier

This multiplier is based on the supported physical outcome, not resale price, brand, user wealth, object weight, or estimated carbon magnitude. It is bounded to `[0.85, 1.15]` for eligible outcomes.

| Supported retention state | Multiplier |
| --- | ---: |
| Whole product retains intended function for the same user, including supported replacement avoidance, maintenance, repair, or refill | 1.15 |
| Whole product enters actual use by another user through share, lend, resale, direct transfer, or donation | 1.10 |
| Whole product is restored/upgraded for use through a supported refurbishment outcome | 1.05 |
| Accepted manufacturer return with downstream outcome not yet supported | 1.00 |
| Reusable components recovered | 0.90 |
| Materials recycled or appropriate biological material composted | 0.85 |

If downstream evidence is absent, use the lower supported state. Do not assume a collection program retained the whole product.

### 7.5 Effort multiplier

Effort recognizes completion barriers without rewarding danger, unnecessary travel, expense, inaccessible processes, or self-reported hardship. The band is fixed when the mission is prepared and may be lowered if the completed action differs materially. It is bounded to `[0.95, 1.10]`.

| Safe predeclared burden | Multiplier |
| --- | ---: |
| Passive/minimal: at most 10 minutes, no coordination | 0.95 |
| Standard: up to 30 minutes or one simple preparation step | 1.00 |
| Moderate: 30–60 minutes, several safe steps, or one coordination event | 1.05 |
| Substantial: more than 60 minutes or multiple coordination steps within the user's stated capability | 1.10 |

No band above 1.00 is awarded for opening equipment, handling hazards, heavy lifting contrary to guidance, exceeding a travel constraint, spending more money, or taking a longer route when a simpler verified path existed.

### 7.6 Environmental Confidence Modifier

This is the “Impact-Confidence Modifier” named in the first Credits narrative and the “Environmental Confidence Modifier” named in the replacement prompt. They are one field. It is bounded to `[0.80, 1.20]`, never uses kilograms as a rate, and cannot exceed a ±20% change.

| Comparative climate result | Tier A | Tier B | Tier C | Tier D |
| --- | ---: | ---: | ---: | ---: |
| Wholly positive range under supported scenarios | 1.20 | 1.10 | 1.00 | 1.00 |
| Uncertain, immaterial, not calculated, or unavailable | 1.00 | 1.00 | 1.00 | 1.00 |
| Wholly negative range under supported scenarios | 0.80 | 0.90 | 1.00 | 1.00 |

Tier C uncertainty is too broad to alter behavior points. Tier D is neutral so categories with sparse lifecycle data are not penalized. A climate estimate is not required for Credits. If safety is at issue, use the safety veto rather than an environmental modifier.

### 7.7 Rounding, caps, and example vectors

- Multiply unrounded decimal values, then round once, half up, to the nearest whole point.
- The MVP default daily award cap is 2,000 Credits per owner scope per UTC day; make it server-configured and methodology-versioned.
- The user-attested subset cap is 500 Credits per owner scope per UTC day.
- A valid claim beyond a cap is `pending` for review, not silently shifted to another date and not displayed as awarded.
- Reversals subtract the awarded entry through a linked ledger record; history remains visible.

Normative examples:

| Case | Calculation | Award before daily cap |
| --- | --- | ---: |
| Document-supported repair, same function, standard effort, climate unavailable | `600 × .90 × 1.15 × 1.00 × 1.00` | 621 |
| User-attested material recycling, standard effort, climate unavailable | `150 × .35 × .85 × 1.00 × 1.00` | 45 |
| Partner repair, same function, moderate effort, tier-A positive comparison | `600 × 1 × 1.15 × 1.05 × 1.20` | 869 |
| Any scan-only event | base `0` | 0 |
| Any action with a safety veto | gate fails | 0 |

All Credits surfaces display: **“Prototype reward points. No monetary value. Not carbon credits or offsets.”** The points are non-cash, non-transferable, and not redeemable in the MVP.

## 8. Anti-abuse and audit controls

Anti-abuse controls protect the incentive ledger without converting suspicion into a user accusation.

1. One active claim per `(objectId, missionId)`; a completed or rejected claim is immutable.
2. One awarded claim per canonical outcome event. A dedupe key combines owner scope, object, action family, completion window, partner transaction ID where available, and privacy-preserving evidence fingerprints.
3. Compute cryptographic file hashes and perceptual image hashes before discarding bytes. Store only the minimum fingerprint/provenance needed under the evidence-retention policy.
4. Normalize document fingerprints from non-sensitive fields such as issuer, date, transaction identifier, and line-item signature. Receipt contents are not analytics data. Cross-user matches create a review flag, not automatic fraud language.
5. Record client capture time, server receipt time, claimed completion time, evidence creation metadata when available, and clock anomalies.
6. Enforce the 2,000 daily total and 500 daily user-attested caps before award.
7. Repeated refill/reuse is limited in the prototype to one credited event per object per UTC day and four per object in a rolling 30-day period. Additional events may be recorded in the Action Ledger with zero new Credits.
8. Avoided-replacement claims cannot stack with the repair/maintenance event that supports them and require a pre-existing mission plus counterfactual evidence.
9. User-attested claims cannot be upgraded by repeated submission of the same evidence. New evidence creates a superseding verification review, not a second reward.
10. Partner transaction IDs, receipt hashes, and evidence hashes are unique where applicable. A duplicate claim is `pending_review` or `rejected_duplicate` with an appeal path.
11. Suspicious patterns include impossible timestamps, repeated near-identical images, cross-object or cross-account evidence reuse, implausible action velocity, repeated reversals, altered documents, and partner-ID reuse. Rules are versioned and observable in an internal audit view only.
12. Safety, eligibility, and duplicate gates run before the Credits formula. No multiplier can recover a vetoed claim.
13. The Credits Ledger is append-only, records rule version and reason codes, and supports reversal without deleting history.
14. No cash, token, automatic redemption, or external value is issued in the MVP.

Development tooling may expose synthetic/debug claims. It must be excluded from production and must never share a balance namespace with user records.

## 9. Future sponsor rewards interface

Future rewards remove barriers to circular action: repair discounts, parts, tool rental, donation pickup, transit, moving supplies, resale fee waivers, refill discounts, manufacturer incentives, utility incentives, municipal programs, and sponsor-funded ecological programs. These are interfaces, not promised MVP availability.

```text
PartnerRewardProgram {
  programId: UUID
  sponsorId: UUID
  sponsorDisplayName: string
  status: "draft" | "configured" | "active" | "paused" | "ended"
  rewardCategory: RewardCategory
  jurisdictions: string[]
  validFrom: ISODateTime
  validUntil?: ISODateTime
  fundingModel: "sponsor_funded" | "discount" | "in_kind"
  budgetOrInventoryStatus: "verified_available" | "limited" | "unavailable" | "unknown"
  eligibilityRuleVersion: string
  termsUrl: string
  privacyNoticeUrl: string
  supportContact: string
  redemptionAdapter: string
  lastIntegrationCheckAt: ISODateTime
}

RewardOffer {
  offerId: UUID
  programId: UUID
  title: string
  costInCredits?: number
  userPaymentRequired?: Range<currency>
  eligibilityInputs: string[]
  fulfillmentMethod: "code" | "booking_handoff" | "partner_confirmation" | "manual"
  availability: "eligible" | "ineligible" | "sold_out" | "expired" | "unverified"
  limitations: string[]
}

RewardRedemption {
  redemptionId: UUID
  offerId: UUID
  ownerScope: OwnerScope
  creditDebitEntryId?: UUID
  userApprovalId: UUID
  status: "requested" | "approved" | "fulfilled" | "failed" | "cancelled" | "reversed"
  partnerConfirmationId?: string
  fulfillmentEvidenceRef?: UUID
  createdAt: ISODateTime
  completedAt?: ISODateTime
}
```

An offer may be displayed as available only when the program is `active`, jurisdiction and dates match, funding/inventory is verified, deterministic eligibility passes, terms and privacy disclosure are present, the redemption adapter has passed a recent integration check, and a real fulfillment pathway exists. External booking, contact, payment, or data sharing requires explicit user approval. Until those conditions and legal review are complete, show the reward category as future-facing, not redeemable.

Credits and sponsor funding remain separate accounting systems. A sponsor may fund a discount without buying Credits, and a user earning Credits does not create a sponsor liability unless an active reward program explicitly defines it.

## 10. Regeneration separation

Regeneration Preferences are non-transactional user preferences for urban trees, wetland restoration, soil restoration, habitat recovery, community composting, or local reuse infrastructure. In the MVP the exact disclosure is:

> “Preference only. No restoration action or financial allocation has occurred.”

A future sponsor-funded contribution uses a separate contribution record:

```text
SponsorContribution {
  contributionId: UUID
  sponsorId: UUID
  sponsorDisplayName: string
  recipientOrganizationId: UUID
  recipientDisplayName: string
  amount: number
  currency: ISO4217
  projectId: string
  projectName: string
  contributionDate: ISODate
  confirmationSourceId: UUID
  status: "pledged" | "confirmed" | "failed" | "reversed"
  relatedMissionId?: UUID
  claimsAllowed: string[]
  limitations: string[]
}
```

Only `confirmed` contributions may be shown as completed, with sponsor, recipient, amount, project, date, and confirmation source. A contribution is not added to the Climate Impact Ledger, is not presented as caused physically by the object action, and does not increase a circular action's Credits unless a separately published reward rule does so prospectively.

Circloora must never say “your repair regenerated nature,” “your Credits offset emissions,” or “you restored an area of habitat.” It must not call a sponsor contribution a carbon offset unless an appropriate independently verified carbon-credit instrument, retirement evidence, ownership/anti-double-counting controls, and jurisdiction-specific legal review exist. The MVP prohibits that claim entirely.

## 11. Claims and mandatory qualifications

| Claim class | Minimum evidence and qualification | Prohibited shorthand or implication |
| --- | --- | --- |
| Object identity, brand, model | Separate direct observation, user report, and inference; show confidence and missing evidence | Exact identity from appearance alone |
| Ownership, provenance, authenticity | User-provided record or appropriate external evidence, with its limits | Ownership proof, title, or authenticity from possession or an image |
| Material composition | “Probable” unless label, specification, DPP, or testing supports it | Hidden or exact composition from an image |
| Condition/function | State what was observed or user-reported and what was not tested | Electrical, battery, structural, or internal safety certification |
| Warranty, manual, part compatibility | Current manufacturer/authorized source, exact model applicability, date, and limitations | Warranty coverage, safe compatibility, or manufacturer authorization from a generic link |
| Safety flag | “Possible” or “suspected” unless an authoritative result exists; provide official guidance | Hazardous-material identification service or assurance of safety |
| Recall | Current official source, retrieval date, model/serial applicability | Recall status from memory, image intuition, or stale secondary source |
| Legal/local handling | Current official jurisdictional source and eligibility | Universal municipal rule or invented legal advice |
| Local organization, hours, acceptance, price, pickup | Source URL, retrieved time, freshness/expiration, jurisdiction, limitations; advise confirmation before travel when appropriate | Invented or stale availability |
| Distance and travel | Approximate area, transport mode, distance range/confidence | Exact route or accessibility without verification |
| Pathway score/recommendation | Active preference mode, factor scores, sources, vetoes, and methodology version | Universal environmental ranking, certification, or guarantee of completion |
| Confidence | Name the subject and evidence basis; use “probability” only for a calibrated probability | One confidence number applied to identity, action, climate, and source quality |
| Resale/remaining value | Conservative monetary range, assumptions, source basis, confidence; “Estimate—not an appraisal.” | Guaranteed sale, appraisal, or single exact price |
| Repair cost | Range, included/excluded labor/parts, geography, date | Quote or guaranteed price without provider confirmation |
| Money recovered | Actual only with transaction support; otherwise expected range | Gross list price as recovered money |
| Replacement spending avoided | Range and explicit counterfactual; “potentially avoided” unless actual decision evidence is strong | Guaranteed savings or stacking with money recovered |
| Useful life extended | Range and assumed usage/condition | Guaranteed service life |
| Time saved, effort, trips | Estimate, baseline, user context, and range where uncertain | Universal convenience claim |
| “Kept in use,” “transferred,” “resold,” “donated” | Action verification level and narrow supported outcome | Listing, intent, or drop-off as end-user reuse |
| Verification | Name the level and the exact narrow event supported | Product safety certification, downstream processing proof, or climate verification by implication |
| “Recycled” or “composted” | Evidence of the supported processing outcome; otherwise “delivered/accepted for processing” | Bin placement or receipt as proof of final processing |
| Waste diverted | Mass range and supported alternative destination | Waste mass as climate benefit or landfill diversion without destination evidence |
| Production/lifecycle emissions avoided | A–C tier, wholly positive range, baseline, alternative, displacement, boundary, sources, assumptions, date; “Comparative estimate—not a carbon offset.” | Exact saving, emissions-inventory reduction, or offset |
| Embodied carbon retained/avoided | Building-product context, compatible methodology, range, and explanation that past emissions are sunk | Claim that historic emissions were removed or reversed |
| Operational emissions difference | Same service/horizon, supported consumption, local factor, replacement efficiency, production, refrigerant and end-of-life assumptions | “Efficient replacement is always better” or “repair is always better” |
| Carbon crossover | Range, horizon, constant-vs-dynamic method, and sensitivity | Exact universal replacement year |
| End-of-life emissions difference | Source methodology, collection/processing assumptions, transport and boundary | Product-specific LCA when based only on WARM screening |
| Virgin material demand avoided | Range and no-double-counting displacement methodology | Direct measured avoidance without supply-chain evidence |
| Climate tier A / “verified” | Identify what source was verified and its compatible boundary | Verified environmental outcome, carbon asset, or certified saving |
| Tier D | “Climate estimate unavailable with the current evidence.” | Model-generated number to fill the gap |
| Environmental equivalents | Only with separately documented, current, compatible methodology and qualification | Trees planted, flights offset, homes powered, or similar by default |
| Credits balance/award | “Prototype reward points. No monetary value. Not carbon credits or offsets.” plus verification level | Cash, security, token, asset, offset, environmental commodity, or redemption promise |
| Partner reward | Real active program, deterministic eligibility, availability, terms, and fulfillment | “Available” from a draft or hypothetical interface |
| Sponsor contribution | Confirmed sponsor, recipient, amount, project, date, source | User performed restoration; contribution is an offset |
| Regeneration preference | “Preference only. No restoration action or financial allocation has occurred.” | Pledge, allocation, project impact, or habitat area |
| Circloora Passport | “Consumer-created Circloora Passport—not an official manufacturer Digital Product Passport.” | Official DPP, warranty, provenance certificate, or ownership proof |
| Mock/demo result | Prominent “Demo analysis—OpenAI is not currently connected,” synthetic-source label, and no real-world transaction implication | Live source, actual partner, real reward, or completed environmental outcome |

The interface must also expose “How this was calculated” and “What could change this result” for every estimate. Sources, calculation date, methodology version, assumptions, boundary, confidence, and limitations remain accessible from the result.

Any material consumer claim not covered by the table must be classified as a direct observation, user report, externally retrieved fact, inference, or estimate; it must carry the corresponding evidence, date, confidence, and limitation. An unclassified environmental marketing claim is prohibited until circular-claims and legal review approve exact wording.

## 12. Reconciliation of the two product briefs

The “CIRCLoORA VALUE, IMPACT, PROFILE, CATALOG, AND INCENTIVE SYSTEM” section says it replaces the build prompt's credit and impact sections. It therefore controls where the attachments differ. The remaining build brief controls hierarchy, pathway ranking, safety, source quality, agent behavior, and test expectations.

| Ambiguity | Architecture resolution |
| --- | --- |
| Build brief lists only base scores and verification multipliers; replacement attachment requires five factors | Implement the five-factor formula. Value retention, effort, and environmental tables in this document fill the previously unspecified deterministic values. |
| Initial narrative mentions “completion quality” as a sixth idea; final formula omits it | Do not create a sixth multiplier. Completion quality is represented by narrow outcome eligibility and the verification multiplier. |
| “Impact-Confidence Modifier” vs “Environmental Confidence Modifier” | They are one field with the matrix in section 7.6 and a hard `[0.80, 1.20]` bound. |
| Four climate tiers vs six action verification levels | They are orthogonal. Climate tier never determines whether an action occurred; action verification never upgrades climate data. |
| “Verified repair” base vs required user-attested repair test | “Verified” in the base table means a completed supported claim. `user_attested` is eligible at 0.35 but must be labeled user-attested, not verified. |
| `continued_use`, `upgrade_completed`, `shared`, `lent`, and `special_handling_completed` exist as outcomes but lack base rows | Use the mappings in section 7.2. No new unstated base score is invented. |
| Avoid unnecessary replacement is both highest hierarchy path and hard-to-prove counterfactual | Require a pre-existing mission, credible imminent replacement baseline, non-stacking, and continued-function evidence. Otherwise use the narrower action. |
| Manufacturer return precedes refurbishment in hierarchy but downstream retention varies | Rank collection as manufacturer return only when downstream is unknown; use the supported downstream pathway when known. Credits keep the listed base and use the retention multiplier to reflect supported outcome. |
| Build brief favors broad MVP categories; replacement attachment allows quantitative A–C estimates | Always show factual broad outcomes. Show numeric ranges only at A–C; tier D explicitly shows unavailable. No screen requires a carbon number. |
| Ordinary-goods label appears once as “production emissions avoided” and later as “production and lifecycle emissions avoided” | Use the fuller “Estimated production and lifecycle emissions avoided,” because the calculation includes disclosed non-production stages. |
| Sponsor-funded nature restoration appears in future rewards but regeneration must be separate | Share partner infrastructure if useful, but use a distinct contribution record and ledger. It never becomes Credits or Climate Impact automatically. |
| “Material diverted” may be shown broadly while verification can support only drop-off | Record and display the narrowest supported state: delivered/accepted for processing unless downstream recovery is supported. |
| Daily cap is required but unspecified | Default to 2,000 total and 500 user-attested Credits per UTC day as versioned MVP controls; calibrate before any real redemption. |

## 13. Deterministic acceptance invariants

Implementation and QA must enforce at least these invariants:

1. Repair outranks recycling when both are safe, feasible, similarly available, and within deadline.
2. Continued use outranks replacement when functional service and operational comparison support it.
3. A functioning product cannot rank recycling above a feasible resale/donation path solely because recycling is easier by fewer than the 5-point exception margin.
4. A safety veto removes incompatible reuse pathways regardless of score or user preference.
5. A hard short deadline may produce a time-boxed resale attempt only with a feasible fallback date.
6. Every displayed factor weight set sums to 100 and every displayed normalized factor is in `[0, 100]`; canonical stored equivalents sum to 1 and remain in `[0, 1]`.
7. Replaying stored inputs and methodology version produces the same ordering and Credits.
8. Missing current local source data produces no invented provider pathway.
9. A climate range crossing zero never displays “emissions avoided.”
10. Operational products include production and use-phase differences; non-operational objects are not assigned fabricated operational emissions.
11. A crossover denominator that spans zero produces no stable crossover number.
12. Tier D produces no quantitative climate value and a neutral environmental Credits modifier.
13. Scans, listing drafts, intents, unknown outcomes, and disposal award zero.
14. User-attested repair earns less than document-supported repair with identical other multipliers.
15. A duplicate or safety-vetoed claim awards zero and leaves an auditable reason.
16. Sponsor preferences and unconfirmed sponsor pledges never appear as completed regeneration.
17. No Credits or climate screen uses offset, asset, cash, crypto, or redemption language outside the required negating disclosure.

## 14. Integration requirements

- **Build Director:** lock pathway keys, reason codes, methodology versioning, and the normative multiplier tables before implementation branches diverge.
- **Data/Identity:** align stable IDs and append-only entries with the canonical schema; keep action verification, climate tier, and ranking confidence separate; preserve evidence privacy and deletion/export requirements.
- **Agent runtime:** models propose facts and explanations only. Deterministic tools own gates, normalization, ranking, crossover arithmetic, interval math, Credits, caps, and duplicate decisions. Pause for missing safety-critical evidence.
- **Sources:** provide source type, publisher, URL, publication/retrieval date, validity, jurisdiction, geography, boundary, functional unit, and freshness. No factor can be sourced from model intuition.
- **Catalog/Passport:** store recommendation revisions and the four ledgers separately; use the consumer-created Passport disclaimer.
- **Missions:** set effort band before completion, preserve switch dates/fallbacks, and prohibit base-score stacking.
- **Impact/Credits:** implement interval arithmetic, sign rules, tier gates, the exact formula, audit entries, daily caps, reversals, and the required disclosure.
- **Security/Privacy:** threat-model receipt/image hashing, cross-user duplicate matching, partner callbacks, admin review, and minimal evidence retention. Never send evidence contents to analytics.
- **Product/UX:** lead with practical value, show verification and climate confidence independently, place Credits last, and surface qualifications without dense dashboards.
- **Operations:** provide methodology/rule versioning, suspicious-claim review, partner program health, source expiry, calculation replay, and reversal audit.
- **QA:** turn section 13 and Credits examples into unit tests; add boundary tests for factor clamps, caps, rounding, interval sign, crossover special cases, source expiry, and sponsor status gates.

## 15. Methodological references

These sources define supported source families and claim posture; they do not make Circloora calculations certified:

- [GHG Protocol — Estimating and Reporting Avoided Emissions](https://ghgprotocol.org/estimating-and-reporting-avoided-emissions): comparative positive and negative product impacts require explicit, credible scenario disclosure.
- [US EPA — Waste Reduction Model](https://www.epa.gov/waste-reduction-model): WARM provides high-level comparisons among materials-management practices.
- [US FTC — Environmental Claims: Summary of the Green Guides](https://www.ftc.gov/business-guidance/resources/environmental-claims-summary-green-guides): carbon-offset claims require competent and reliable scientific evidence and appropriate accounting.
- [European Commission — Recommendation on Environmental Footprint methods](https://environment.ec.europa.eu/publications/recommendation-use-environmental-footprint-methods_en): lifecycle claims depend on reliable, verifiable, comparable information and category rules.

Before launch, a circular-claims reviewer and qualified legal reviewer must reassess consumer language, jurisdictional environmental-marketing rules, sponsor terms, and any change that introduces redemption or third-party environmental claims.
