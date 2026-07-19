import { z } from "zod";

import { PreferenceModeSchema } from "./profile-catalog";
import {
  ConfidenceSchema,
  EntityIdSchema,
  EvidenceKindSchema,
  EvidenceRefSchema,
  SafetyFlagSchema,
  SourceRefSchema,
  StructuredValueSchema,
  TimestampSchema,
  boundedText,
  syncMetaShape,
} from "./primitives";

export const InvestigationStatusSchema = z.enum([
  "draft",
  "inventory_review",
  "investigating",
  "awaiting_evidence",
  "evaluating_pathways",
  "awaiting_approval",
  "action_ready",
  "awaiting_verification",
  "completed",
  "blocked",
  "cancelled",
]);

export const InvestigationSchema = z
  .object({
    ...syncMetaShape,
    mode: z.enum(["single_object", "room_move"]),
    goal: boundedText(1, 500),
    deadline: TimestampSchema.optional(),
    approximateArea: z
      .object({
        locality: boundedText(1, 120).optional(),
        postalCode: z.string().trim().min(3).max(12).optional(),
      })
      .strict()
      .optional(),
    preferenceMode: PreferenceModeSchema,
    status: InvestigationStatusSchema,
    confirmedObjectIds: z.array(EntityIdSchema).max(8),
    activeObjectId: EntityIdSchema.optional(),
    unresolvedQuestionIds: z.array(EntityIdSchema).max(100),
    pendingApprovalIds: z.array(EntityIdSchema).max(50),
    runId: EntityIdSchema.optional(),
    blockedReason: boundedText(1, 500).optional(),
    completedAt: TimestampSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.mode === "room_move" && !value.deadline) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline"],
        message: "Room move investigations require a deadline",
      });
    }
    if (
      value.status === "awaiting_evidence" &&
      value.unresolvedQuestionIds.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unresolvedQuestionIds"],
        message: "Awaiting evidence requires an unresolved question",
      });
    }
    if (value.status === "completed") {
      if (!value.completedAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["completedAt"],
          message: "Completion time is required",
        });
      }
      if (
        value.unresolvedQuestionIds.length > 0 ||
        value.pendingApprovalIds.length > 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["status"],
          message:
            "Completed investigations cannot have unresolved evidence or approvals",
        });
      }
    }
    if (value.status === "blocked" && !value.blockedReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blockedReason"],
        message: "Blocked state requires a reason",
      });
    }
  });

export const ObservationSchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    investigationId: EntityIdSchema,
    origin: z.enum([
      "directly_observed",
      "user_reported",
      "externally_retrieved",
      "inferred",
      "estimated",
    ]),
    statement: boundedText(1, 1_000),
    structuredValue: StructuredValueSchema.optional(),
    confidence: ConfidenceSchema,
    evidenceRefs: z.array(EvidenceRefSchema).max(20),
    sourceRefs: z.array(SourceRefSchema).max(20),
    observedAt: TimestampSchema,
    actorType: z.enum([
      "user",
      "deterministic_tool",
      "model",
      "external_source",
    ]),
    modelOrToolVersion: boundedText(1, 80).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.origin === "directly_observed" &&
      value.evidenceRefs.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidenceRefs"],
        message: "Direct observations require evidence",
      });
    }
    if (
      value.origin === "externally_retrieved" &&
      value.sourceRefs.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceRefs"],
        message: "Externally retrieved observations require a source",
      });
    }
  });

export const HypothesisSchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    investigationId: EntityIdSchema,
    kind: z.enum([
      "identity",
      "brand",
      "model",
      "material",
      "condition",
      "safety",
      "pathway",
      "other",
    ]),
    claim: boundedText(1, 1_000),
    confidence: ConfidenceSchema,
    status: z.enum([
      "active",
      "supported",
      "contradicted",
      "rejected",
      "superseded",
    ]),
    supportingObservationIds: z.array(EntityIdSchema).max(100),
    contradictingObservationIds: z.array(EntityIdSchema).max(100),
    missingEvidence: z.array(boundedText(1, 240)).max(20),
    resolvedAt: TimestampSchema.optional(),
    supersedingHypothesisId: EntityIdSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "superseded" && !value.supersedingHypothesisId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supersedingHypothesisId"],
        message: "A superseding hypothesis is required",
      });
    }
  });

export const EvidenceRequestSchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    investigationId: EntityIdSchema,
    unresolvedQuestion: boundedText(1, 500),
    reason: boundedText(1, 500),
    evidenceType: EvidenceKindSchema,
    currentConfidence: ConfidenceSchema,
    safetyContext: z.array(SafetyFlagSchema).max(20),
    instruction: boundedText(1, 600),
    targetArea: boundedText(1, 200),
    framingGuidance: boundedText(1, 500),
    captureMode: z.enum([
      "photo",
      "document",
      "text_answer",
      "visual_check",
      "partner_confirmation",
    ]),
    physicalTest: boundedText(1, 240).optional(),
    prohibitedActions: z.array(boundedText(1, 200)).max(20),
    completionCriteria: z.array(boundedText(1, 240)).min(1).max(12),
    accessibilityAlternative: boundedText(1, 500),
    status: z.enum([
      "requested",
      "fulfilled",
      "declined",
      "expired",
      "cancelled",
    ]),
    fulfilledEvidenceIds: z.array(EntityIdSchema).max(12),
    fulfilledAt: TimestampSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const blocked = value.safetyContext.some(
      (flag) => flag.severity === "blocking" && flag.resolutionState === "open",
    );
    if (blocked && value.physicalTest) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["physicalTest"],
        message:
          "Physical tests are forbidden while a blocking safety flag is open",
      });
    }
    if (
      value.status === "fulfilled" &&
      (value.fulfilledEvidenceIds.length === 0 || !value.fulfilledAt)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fulfilledEvidenceIds"],
        message: "Fulfilled requests require evidence and a completion time",
      });
    }
  });

export const PathwayTypeSchema = z.enum([
  "avoid_replacement",
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

export const PathwaySchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema,
    investigationId: EntityIdSchema,
    pathwayType: PathwayTypeSchema,
    state: z.enum([
      "candidate",
      "eligible",
      "selected",
      "disqualified",
      "completed",
    ]),
    title: boundedText(1, 160),
    reason: boundedText(1, 700),
    requirements: z.array(boundedText(1, 240)).max(30),
    sourceIds: z.array(EntityIdSchema).max(30),
    estimatedValueMinor: z
      .object({
        low: z.number().int().nonnegative(),
        high: z.number().int().nonnegative(),
        currency: z.string().regex(/^[A-Z]{3}$/),
      })
      .strict()
      .refine((value) => value.low <= value.high, "Invalid value range")
      .optional(),
    effortMinutes: z
      .object({
        low: z.number().int().nonnegative(),
        high: z.number().int().nonnegative(),
      })
      .strict()
      .refine((value) => value.low <= value.high, "Invalid effort range"),
    travelMeters: z
      .object({
        low: z.number().int().nonnegative(),
        high: z.number().int().nonnegative(),
      })
      .strict()
      .refine((value) => value.low <= value.high, "Invalid travel range"),
    completionDays: z
      .object({
        low: z.number().int().nonnegative(),
        high: z.number().int().nonnegative(),
      })
      .strict()
      .refine((value) => value.low <= value.high, "Invalid time range"),
    deadlineFit: z.enum(["fits", "at_risk", "misses", "unknown"]),
    confidence: ConfidenceSchema,
    disqualifiers: z.array(boundedText(1, 240)).max(30),
    scoreId: EntityIdSchema.optional(),
    rank: z.number().int().positive().max(100).nullable(),
    rankChangingEvidence: z.array(boundedText(1, 240)).max(20),
  })
  .strict();

const PathwayFactorSchema = z.number().min(0).max(100);
const PathwayWeightSchema = z.number().min(0).max(1);

export const PathwayScoreSchema = z
  .object({
    ...syncMetaShape,
    pathwayId: EntityIdSchema,
    rankingRunId: EntityIdSchema,
    factors: z
      .object({
        circularValueRetained: PathwayFactorSchema,
        completionProbability: PathwayFactorSchema,
        evidenceConfidence: PathwayFactorSchema,
        deadlineFit: PathwayFactorSchema,
        localAvailability: PathwayFactorSchema,
        financialRecovery: PathwayFactorSchema,
        effortFit: PathwayFactorSchema,
        travelFit: PathwayFactorSchema,
        preferenceMatch: PathwayFactorSchema,
      })
      .strict(),
    weights: z
      .object({
        circularValueRetained: PathwayWeightSchema,
        completionProbability: PathwayWeightSchema,
        evidenceConfidence: PathwayWeightSchema,
        deadlineFit: PathwayWeightSchema,
        localAvailability: PathwayWeightSchema,
        financialRecovery: PathwayWeightSchema,
        effortFit: PathwayWeightSchema,
        travelFit: PathwayWeightSchema,
        preferenceMatch: PathwayWeightSchema,
      })
      .strict(),
    safetyLegalVeto: z.boolean(),
    totalScore: z.number().min(0).max(100),
    rank: z.number().int().positive().max(100).nullable(),
    disqualifyingFactors: z.array(boundedText(1, 240)).max(30),
    explanation: boundedText(1, 700),
    preferenceMode: PreferenceModeSchema,
    methodologyVersion: boundedText(1, 40),
  })
  .strict()
  .superRefine((value, context) => {
    const keys = Object.keys(value.weights) as Array<
      keyof typeof value.weights
    >;
    const weightTotal = keys.reduce((sum, key) => sum + value.weights[key], 0);
    if (Math.abs(weightTotal - 1) > 0.000_001) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weights"],
        message: "Pathway weights must sum to one",
      });
    }
    const computed = keys.reduce(
      (sum, key) => sum + value.weights[key] * value.factors[key],
      0,
    );
    if (Math.abs(computed - value.totalScore) > 0.000_001) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalScore"],
        message: "Total score must match the deterministic weighted sum",
      });
    }
    if (
      value.safetyLegalVeto &&
      (value.rank !== null || value.disqualifyingFactors.length === 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["safetyLegalVeto"],
        message:
          "A vetoed pathway must be unranked and explain its disqualification",
      });
    }
  });

export const AgentNameSchema = z.enum([
  "CirclooraOrchestrator",
  "ObjectIntelligenceAgent",
  "CircularPathwayAgent",
  "LocalPathwayAgent",
  "ValueAgent",
  "ActionAgent",
  "VerificationAgent",
]);

export const AgentToolNameSchema = z.enum([
  "analyze_visual_evidence",
  "request_additional_evidence",
  "search_current_pathways",
  "estimate_remaining_value",
  "rank_next_life_pathways",
  "generate_action_packet",
  "optimize_move_plan",
  "verify_outcome",
]);

export const AgentEventSchema = z
  .object({
    ...syncMetaShape,
    runId: EntityIdSchema,
    investigationId: EntityIdSchema,
    sequence: z.number().int().positive().max(100_000),
    timestamp: TimestampSchema,
    agent: AgentNameSchema,
    eventType: z.enum([
      "run_started",
      "agent_selected",
      "tool_started",
      "tool_completed",
      "evidence_requested",
      "approval_requested",
      "recommendation_revised",
      "run_paused",
      "run_resumed",
      "run_completed",
      "run_failed",
      "run_cancelled",
    ]),
    summary: boundedText(1, 280),
    toolName: AgentToolNameSchema.optional(),
    objectId: EntityIdSchema.optional(),
    status: z.enum([
      "started",
      "progress",
      "paused",
      "completed",
      "failed",
      "cancelled",
    ]),
    userActionRequired: z.boolean(),
  })
  .strict();

export const AgentRunSchema = z
  .object({
    ...syncMetaShape,
    investigationId: EntityIdSchema,
    status: z.enum([
      "queued",
      "running",
      "paused",
      "completed",
      "failed",
      "cancelled",
    ]),
    turnCount: z.number().int().min(0).max(8),
    toolCount: z.number().int().min(0).max(12),
    retryCount: z.number().int().min(0).max(2),
    modelAlias: boundedText(1, 80),
    promptBundleVersion: boundedText(1, 40),
    agentGraphVersion: boundedText(1, 40),
    methodologyVersion: boundedText(1, 40),
    isMock: z.boolean(),
    startedAt: TimestampSchema,
    pausedAt: TimestampSchema.optional(),
    completedAt: TimestampSchema.optional(),
    safeErrorCode: z
      .string()
      .regex(/^[A-Z0-9_]{2,64}$/)
      .optional(),
  })
  .strict();

export const InvestigationSnapshotSchema = z
  .object({
    ...syncMetaShape,
    runId: EntityIdSchema,
    investigationId: EntityIdSchema,
    sequence: z.number().int().nonnegative(),
    stateGraphVersion: boundedText(1, 40),
    stateHash: z.string().regex(/^[a-f0-9]{64}$/i),
    previousStateHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/i)
      .optional(),
    pauseReason: z.enum(["evidence", "approval", "limit", "offline", "none"]),
    expiresAt: TimestampSchema,
    observationIds: z.array(EntityIdSchema).max(300),
    hypothesisIds: z.array(EntityIdSchema).max(200),
    evidenceRequestIds: z.array(EntityIdSchema).max(100),
    pathwayIds: z.array(EntityIdSchema).max(100),
    sourceIds: z.array(EntityIdSchema).max(100),
    approvalIds: z.array(EntityIdSchema).max(50),
    publicEventCursor: z.number().int().nonnegative(),
    turnCount: z.number().int().min(0).max(8),
    toolCount: z.number().int().min(0).max(12),
    retryCount: z.number().int().min(0).max(2),
    methodologyVersion: boundedText(1, 40),
    modelAlias: boundedText(1, 80),
  })
  .strict();

export type Investigation = z.infer<typeof InvestigationSchema>;
export type InvestigationStatus = z.infer<typeof InvestigationStatusSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type EvidenceRequest = z.infer<typeof EvidenceRequestSchema>;
export type Pathway = z.infer<typeof PathwaySchema>;
export type PathwayScore = z.infer<typeof PathwayScoreSchema>;
export type AgentEvent = z.infer<typeof AgentEventSchema>;
export type AgentRun = z.infer<typeof AgentRunSchema>;
export type InvestigationSnapshot = z.infer<typeof InvestigationSnapshotSchema>;
