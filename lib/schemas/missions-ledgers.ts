import { z } from "zod";

import { PathwayTypeSchema } from "./investigation-agent";
import {
  ConfidenceSchema,
  EntityIdSchema,
  EvidenceRefSchema,
  MoneyRangeSchema,
  QuantityRangeSchema,
  SafetyFlagSchema,
  SourceRefSchema,
  TimestampSchema,
  boundedText,
  syncMetaShape,
} from "./primitives";

export const MissionStatusSchema = z.enum([
  "proposed",
  "awaiting_evidence",
  "ready",
  "awaiting_approval",
  "approved",
  "in_progress",
  "awaiting_verification",
  "verified",
  "completed_unverified",
  "blocked",
  "cancelled",
]);

const MissionStepSchema = z
  .object({
    id: EntityIdSchema,
    order: z.number().int().nonnegative().max(100),
    label: boundedText(1, 240),
    kind: z.enum([
      "prepare",
      "research",
      "travel",
      "handoff",
      "repair",
      "verify",
      "follow_up",
    ]),
    state: z.enum([
      "pending",
      "in_progress",
      "completed",
      "blocked",
      "skipped",
    ]),
    requiresOnline: z.boolean(),
  })
  .strict();

export const MissionSchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    investigationId: EntityIdSchema,
    objective: boundedText(1, 500),
    reason: boundedText(1, 700),
    requiredEvidence: z.array(boundedText(1, 240)).max(20),
    steps: z.array(MissionStepSchema).min(1).max(40),
    deadline: TimestampSchema.optional(),
    estimatedEffortMinutes: z
      .object({
        low: z.number().int().nonnegative(),
        high: z.number().int().nonnegative(),
      })
      .strict()
      .refine((value) => value.low <= value.high, "Invalid effort range"),
    estimatedCost: MoneyRangeSchema.optional(),
    estimatedRecovery: MoneyRangeSchema.optional(),
    safetyNotes: z.array(SafetyFlagSchema).max(20),
    approvalState: z.enum([
      "not_required",
      "requested",
      "approved",
      "rejected",
      "expired",
      "revoked",
    ]),
    state: MissionStatusSchema,
    verificationRequirement: z.enum([
      "required",
      "recommended",
      "not_required",
    ]),
    verificationResultId: EntityIdSchema.optional(),
    availablePrototypeCredits: z.number().int().nonnegative().max(100_000),
    selectedPathwayId: EntityIdSchema,
    fallbackPathwayId: EntityIdSchema.optional(),
    dependencyMissionIds: z.array(EntityIdSchema).max(50),
    completedAt: TimestampSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const orders = value.steps.map((step) => step.order);
    if (new Set(orders).size !== orders.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["steps"],
        message: "Mission step order values must be unique",
      });
    }
    if (value.state === "verified" && !value.verificationResultId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verificationResultId"],
        message:
          "Verified missions require an authoritative verification result",
      });
    }
    if (value.state === "completed_unverified" && !value.completedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completedAt"],
        message: "Completion time is required",
      });
    }
    if (
      (value.state === "approved" || value.state === "in_progress") &&
      value.approvalState === "requested"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["approvalState"],
        message: "The requested approval has not been resolved",
      });
    }
  });

export const UserApprovalSchema = z
  .object({
    ...syncMetaShape,
    investigationId: EntityIdSchema,
    missionId: EntityIdSchema,
    runId: EntityIdSchema,
    stateRevision: z.number().int().nonnegative(),
    actionType: z.enum([
      "prepare_listing",
      "prepare_donation",
      "prepare_repair",
      "prepare_transfer",
      "prepare_plan",
      "other",
    ]),
    toolName: z.enum(["generate_action_packet", "optimize_move_plan"]),
    scopeSummary: boundedText(1, 500),
    payloadSummary: boundedText(1, 1_000),
    argumentDigest: z.string().regex(/^[a-f0-9]{64}$/i),
    riskAndSideEffects: z.array(boundedText(1, 240)).max(20),
    status: z.enum(["requested", "approved", "rejected", "expired", "revoked"]),
    requestedAt: TimestampSchema,
    resolvedAt: TimestampSchema.optional(),
    expiresAt: TimestampSchema,
    actor: z.enum(["local_user", "account_user"]),
    decisionReason: boundedText(1, 500).optional(),
    idempotencyKey: z
      .string()
      .min(16)
      .max(160)
      .regex(/^[A-Za-z0-9:_-]+$/),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status !== "requested" && !value.resolvedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resolvedAt"],
        message: "Resolved approvals require a timestamp",
      });
    }
  });

export const RecommendationRevisionSchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    investigationId: EntityIdSchema,
    previousPathwayId: EntityIdSchema,
    newPathwayId: EntityIdSchema,
    triggeringEvidenceIds: z.array(EntityIdSchema).min(1).max(20),
    explanation: boundedText(1, 700),
    previousConfidence: ConfidenceSchema,
    newConfidence: ConfidenceSchema,
    previousRankingRunId: EntityIdSchema,
    newRankingRunId: EntityIdSchema,
    rankingMethodologyVersion: boundedText(1, 40),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.previousPathwayId === value.newPathwayId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPathwayId"],
        message: "A revision must change the pathway",
      });
    }
  });

export const VerificationLevelSchema = z.enum([
  "partner_verified",
  "document_supported",
  "visually_supported",
  "user_attested",
  "insufficient_evidence",
  "rejected",
]);

export const CircularActionOutcomeSchema = z.enum([
  "continued_use",
  "maintenance",
  "repair",
  "upgrade",
  "share",
  "lend",
  "resell",
  "direct_transfer",
  "donate_for_reuse",
  "manufacturer_return",
  "refurbish",
  "components_recovery",
  "material_recycling",
  "compost",
  "special_handling",
  "dispose",
  "unknown",
]);

const ZERO_CREDIT_OUTCOMES = new Set([
  "special_handling",
  "dispose",
  "unknown",
]);

export const VerificationResultSchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    missionId: EntityIdSchema,
    claimId: EntityIdSchema,
    claimedOutcome: CircularActionOutcomeSchema,
    decision: z.enum([
      "approved",
      "approved_with_reduced_confidence",
      "revision_required",
      "additional_evidence_required",
      "safety_escalation",
      "blocked",
    ]),
    supportedOutcome: CircularActionOutcomeSchema.optional(),
    verificationLevel: VerificationLevelSchema,
    evidenceSummary: boundedText(1, 700),
    evidenceRefs: z.array(EvidenceRefSchema).max(20),
    verifier: z.enum([
      "deterministic_mock",
      "deterministic_server",
      "verification_agent",
      "partner",
    ]),
    confidence: ConfidenceSchema,
    sourceRefs: z.array(SourceRefSchema).max(20),
    limitations: z.array(boundedText(1, 240)).max(20),
    fraudFlags: z
      .array(
        z.enum([
          "exact_duplicate",
          "probable_duplicate",
          "claim_reuse",
          "cadence",
          "manual_review",
        ]),
      )
      .max(10),
    creditEligible: z.boolean(),
    creditAmount: z.number().int().nonnegative(),
    creditExplanation: boundedText(1, 500),
    followUpRequest: boundedText(1, 500).optional(),
    methodologyVersion: boundedText(1, 40),
    modelVersion: boundedText(1, 80).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const ineligibleLevel =
      value.verificationLevel === "insufficient_evidence" ||
      value.verificationLevel === "rejected";
    const ineligibleOutcome =
      !value.supportedOutcome ||
      ZERO_CREDIT_OUTCOMES.has(value.supportedOutcome);
    if (
      (ineligibleLevel || ineligibleOutcome) &&
      (value.creditEligible || value.creditAmount !== 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creditAmount"],
        message:
          "Insufficient, rejected, unknown, special-handling, or disposal outcomes award zero Credits",
      });
    }
  });

export const CircularActionEntrySchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    missionId: EntityIdSchema,
    verificationId: EntityIdSchema,
    outcome: CircularActionOutcomeSchema,
    pathwayType: PathwayTypeSchema,
    startedAt: TimestampSchema.optional(),
    completedAt: TimestampSchema,
    verificationLevel: VerificationLevelSchema,
    evidenceIds: z.array(EntityIdSchema).max(20),
    verifier: boundedText(1, 80),
    confidence: ConfidenceSchema,
    sourceRefs: z.array(SourceRefSchema).max(20),
    limitations: z.array(boundedText(1, 240)).max(20),
    supersedesId: EntityIdSchema.optional(),
  })
  .strict();

export const CircularValueEntrySchema = z
  .object({
    ...syncMetaShape,
    actionEntryId: EntityIdSchema,
    objectId: EntityIdSchema,
    financialValue: MoneyRangeSchema.optional(),
    lifeExtensionMonths: QuantityRangeSchema.optional(),
    effortMinutes: QuantityRangeSchema,
    travelMeters: QuantityRangeSchema,
    itemsKeptInUse: z.number().int().nonnegative(),
    assumptions: z.array(boundedText(1, 240)).max(30),
    confidence: ConfidenceSchema,
    sourceRefs: z.array(SourceRefSchema).max(20),
    methodologyVersion: boundedText(1, 40),
    calculatedAt: TimestampSchema,
    supersedesId: EntityIdSchema.optional(),
  })
  .strict();

export const ClimateImpactEntrySchema = z
  .object({
    ...syncMetaShape,
    actionEntryId: EntityIdSchema,
    objectId: EntityIdSchema,
    impactCategory: z.enum(["ordinary", "building", "operational"]),
    tier: z.enum(["A", "B", "C", "D"]),
    estimate: QuantityRangeSchema.optional(),
    boundary: boundedText(1, 700),
    baseline: boundedText(1, 500),
    alternative: boundedText(1, 500),
    displacementAssumption: boundedText(1, 500),
    sourceRefs: z.array(SourceRefSchema).max(30),
    method: boundedText(1, 500),
    methodologyVersion: boundedText(1, 40),
    confidence: ConfidenceSchema,
    uncertainty: z.array(boundedText(1, 240)).min(1).max(30),
    calculatedAt: TimestampSchema,
    limitations: z.array(boundedText(1, 240)).min(1).max(30),
    unavailableReason: boundedText(1, 500).optional(),
    supersedesId: EntityIdSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.tier === "D") {
      if (value.estimate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["estimate"],
          message: "Tier D forbids a numeric estimate",
        });
      }
      if (!value.unavailableReason) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["unavailableReason"],
          message: "Tier D requires an unavailable reason",
        });
      }
    } else if (!value.estimate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["estimate"],
        message: "Tiers A-C require a comparative range",
      });
    }
  });

export const CreditClaimSchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    missionId: EntityIdSchema,
    verificationId: EntityIdSchema.optional(),
    claimKey: z
      .string()
      .min(16)
      .max(160)
      .regex(/^[A-Za-z0-9:_-]+$/),
    evidenceHashes: z.array(z.string().regex(/^[a-f0-9]{64}$/i)).max(20),
    status: z.enum([
      "pending",
      "under_review",
      "awarded",
      "rejected",
      "reversed",
      "legacy_local_unverified",
    ]),
    fraudFlags: z
      .array(
        z.enum([
          "exact_duplicate",
          "probable_duplicate",
          "claim_reuse",
          "cadence",
          "manual_review",
        ]),
      )
      .max(10),
    dailyCapDateUtc: z.string().date(),
    submittedAt: TimestampSchema,
  })
  .strict();

function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

export const CreditLedgerEntrySchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    missionId: EntityIdSchema,
    actionEntryId: EntityIdSchema,
    verificationId: EntityIdSchema,
    claimId: EntityIdSchema,
    entryType: z.enum(["award", "reversal", "adjustment", "expiry"]),
    outcome: CircularActionOutcomeSchema,
    baseScore: z.number().int().nonnegative().max(100_000),
    verificationMultiplier: z.union([
      z.literal(1),
      z.literal(0.9),
      z.literal(0.7),
      z.literal(0.35),
      z.literal(0),
    ]),
    valueRetentionMultiplier: z.number().min(0.85).max(1.15),
    effortMultiplier: z.number().min(0.95).max(1.1),
    environmentalConfidenceModifier: z.number().min(0.8).max(1.2),
    amount: z.number().int(),
    verificationLevel: VerificationLevelSchema,
    idempotencyKey: z
      .string()
      .min(16)
      .max(160)
      .regex(/^[A-Za-z0-9:_-]+$/),
    methodologyVersion: boundedText(1, 40),
    explanation: boundedText(1, 500),
    disclosureVersion: boundedText(1, 40),
    supersedesId: EntityIdSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.entryType !== "award") return;
    const ineligible =
      ZERO_CREDIT_OUTCOMES.has(value.outcome) ||
      value.verificationLevel === "insufficient_evidence" ||
      value.verificationLevel === "rejected";
    const computed = ineligible
      ? 0
      : roundHalfUp(
          value.baseScore *
            value.verificationMultiplier *
            value.valueRetentionMultiplier *
            value.effortMultiplier *
            value.environmentalConfidenceModifier,
        );
    if (value.amount !== computed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Credit amount does not match the deterministic formula",
      });
    }
  });

export const LocalPathwaySourceSchema = z
  .object({
    ...syncMetaShape,
    pathwayId: EntityIdSchema,
    sourcePriority: z.enum([
      "official",
      "primary_provider",
      "reputable_directory",
      "other",
    ]),
    sourceType: z.enum([
      "municipal",
      "manufacturer",
      "retailer",
      "repair",
      "resale",
      "donation",
      "special_handling",
      "other",
    ]),
    organization: boundedText(1, 160),
    title: boundedText(1, 200),
    canonicalUrl: z.string().url().startsWith("https://").max(2_048),
    publisher: boundedText(1, 160),
    jurisdiction: boundedText(1, 160),
    coarseLocation: boundedText(1, 160).optional(),
    hours: boundedText(1, 240).optional(),
    eligibility: z.array(boundedText(1, 240)).max(20),
    retrievedAt: TimestampSchema,
    publishedAt: TimestampSchema.optional(),
    expiresAt: TimestampSchema,
    verificationStatus: z.enum(["verified", "unverified", "expired"]),
    limitations: z.array(boundedText(1, 240)).max(20),
    confidence: ConfidenceSchema,
    contentFingerprint: z.string().regex(/^[a-f0-9]{64}$/i),
    isMock: z.boolean(),
  })
  .strict();

const MovePlanItemSchema = z
  .object({
    missionId: EntityIdSchema,
    objectId: EntityIdSchema,
    scheduledFor: TimestampSchema,
    order: z.number().int().nonnegative(),
  })
  .strict();

export const MovePlanSchema = z
  .object({
    ...syncMetaShape,
    investigationId: EntityIdSchema,
    deadline: TimestampSchema,
    orderedPlan: z.array(MovePlanItemSchema).max(80),
    dailyPlan: z
      .array(
        z
          .object({
            date: z.string().date(),
            missionIds: z.array(EntityIdSchema).max(40),
          })
          .strict(),
      )
      .max(90),
    groupedTrips: z
      .array(
        z
          .object({
            id: EntityIdSchema,
            missionIds: z.array(EntityIdSchema).min(1).max(8),
            label: boundedText(1, 160),
          })
          .strict(),
      )
      .max(20),
    urgentMissionIds: z.array(EntityIdSchema).max(20),
    dependencies: z
      .array(
        z
          .object({
            beforeMissionId: EntityIdSchema,
            afterMissionId: EntityIdSchema,
          })
          .strict(),
      )
      .max(80),
    fallbackPathways: z
      .array(
        z
          .object({
            missionId: EntityIdSchema,
            pathwayId: EntityIdSchema,
            activateAt: TimestampSchema,
          })
          .strict(),
      )
      .max(40),
    expectedCompletionAt: TimestampSchema,
    deadlineRisk: z.enum(["low", "medium", "high", "misses"]),
    availabilityNotes: z.array(boundedText(1, 240)).max(20),
    travelConstraints: z.array(boundedText(1, 240)).max(20),
    planVersion: z.number().int().positive(),
    approvalState: z.enum([
      "draft",
      "awaiting_approval",
      "approved",
      "rejected",
    ]),
  })
  .strict()
  .superRefine((value, context) => {
    const objectIds = new Set(value.orderedPlan.map((item) => item.objectId));
    if (objectIds.size > 8) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["orderedPlan"],
        message: "Move plans are limited to eight objects",
      });
    }
    const graph = new Map<string, string[]>();
    for (const dependency of value.dependencies) {
      const next = graph.get(dependency.beforeMissionId) ?? [];
      next.push(dependency.afterMissionId);
      graph.set(dependency.beforeMissionId, next);
    }
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const hasCycle = (node: string): boolean => {
      if (visiting.has(node)) return true;
      if (visited.has(node)) return false;
      visiting.add(node);
      for (const child of graph.get(node) ?? [])
        if (hasCycle(child)) return true;
      visiting.delete(node);
      visited.add(node);
      return false;
    };
    if ([...graph.keys()].some(hasCycle)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dependencies"],
        message: "Move plan dependencies cannot contain cycles",
      });
    }
  });

export { EvidenceRefSchema } from "./primitives";

export type Mission = z.infer<typeof MissionSchema>;
export type MissionStatus = z.infer<typeof MissionStatusSchema>;
export type UserApproval = z.infer<typeof UserApprovalSchema>;
export type RecommendationRevision = z.infer<
  typeof RecommendationRevisionSchema
>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
export type CircularActionEntry = z.infer<typeof CircularActionEntrySchema>;
export type CircularValueEntry = z.infer<typeof CircularValueEntrySchema>;
export type ClimateImpactEntry = z.infer<typeof ClimateImpactEntrySchema>;
export type CreditClaim = z.infer<typeof CreditClaimSchema>;
export type CreditLedgerEntry = z.infer<typeof CreditLedgerEntrySchema>;
export type LocalPathwaySource = z.infer<typeof LocalPathwaySourceSchema>;
export type MovePlan = z.infer<typeof MovePlanSchema>;
export type VerificationLevel = z.infer<typeof VerificationLevelSchema>;
export type CircularActionOutcome = z.infer<typeof CircularActionOutcomeSchema>;
