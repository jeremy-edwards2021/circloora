import { z } from "zod";

export const DOMAIN_SCHEMA_VERSION = 1 as const;
export const EXPORT_FORMAT_VERSION = 1 as const;

export const EntityIdSchema = z.string().uuid();
export const TimestampSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value) => Number.isFinite(Date.parse(value)), "Invalid timestamp");

export const HlcSchema = z
  .string()
  .min(18)
  .max(96)
  .regex(/^\d{13}:\d{1,10}:[0-9a-f-]{36}$/i, "Invalid hybrid logical clock");

export const boundedText = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .refine((value) => !/[<>]/.test(value), "HTML-like text is not accepted")
    .transform((value) => value.normalize("NFC"));

export const OptionalBoundedTextSchema = boundedText(1, 500).optional();

export const OwnerScopeSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("local"),
      localProfileId: EntityIdSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("account"),
      userId: EntityIdSchema,
    })
    .strict(),
]);

export const syncMetaShape = {
  id: EntityIdSchema,
  ownerScope: OwnerScopeSchema,
  schemaVersion: z.literal(DOMAIN_SCHEMA_VERSION),
  version: z.number().int().nonnegative(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  deletedAt: TimestampSchema.optional(),
  sourceDeviceId: EntityIdSchema,
  hlc: HlcSchema,
} as const;

export const SyncMetaSchema = z.object(syncMetaShape).strict();

export const ConfidenceSchema = z
  .object({
    score: z.number().min(0).max(1),
    level: z.enum(["low", "medium", "high"]).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.level) return;
    const expected =
      value.score < 0.5 ? "low" : value.score < 0.8 ? "medium" : "high";
    if (value.level !== expected) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["level"],
        message: `Confidence level must be ${expected} for this score`,
      });
    }
  });

export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export const MoneyRangeSchema = z
  .object({
    lowMinor: z.number().int().nonnegative(),
    highMinor: z.number().int().nonnegative(),
    currency: CurrencyCodeSchema,
    confidence: ConfidenceSchema,
    disclaimer: z.literal("estimate_not_appraisal"),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.lowMinor > value.highMinor) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["highMinor"],
        message: "High estimate must be greater than or equal to low estimate",
      });
    }
  });

export const QuantityRangeSchema = z
  .object({
    low: z.number().finite(),
    high: z.number().finite(),
    unit: boundedText(1, 32),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.low > value.high) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["high"],
        message: "High quantity must be greater than or equal to low quantity",
      });
    }
  });

export const EvidenceKindSchema = z.enum([
  "image",
  "document",
  "user_answer",
  "safe_visual_check",
  "partner_confirmation",
]);

export const EvidenceRefSchema = z
  .object({
    assetId: EntityIdSchema,
    kind: EvidenceKindSchema,
    capturedAt: TimestampSchema,
    redactionStatus: z.enum(["not_required", "pending", "redacted"]),
    validationStatus: z.enum(["pending", "accepted", "rejected", "purged"]),
  })
  .strict();

export const SourceRefSchema = z
  .object({
    sourceId: EntityIdSchema,
    canonicalUrl: z.string().url().startsWith("https://").max(2_048),
    title: boundedText(1, 200),
    publisher: boundedText(1, 160),
    retrievedAt: TimestampSchema,
    verificationStatus: z.enum(["verified", "unverified", "expired"]),
    freshnessStatus: z.enum(["current", "stale", "unknown"]),
  })
  .strict();

export const SafetyFlagSchema = z
  .object({
    code: boundedText(1, 64),
    severity: z.enum(["notice", "caution", "blocking"]),
    observationBasis: boundedText(1, 500),
    prohibitedActions: z.array(boundedText(1, 160)).max(20),
    officialSourceRequired: z.boolean(),
    resolutionState: z.enum(["open", "resolved", "not_applicable"]),
  })
  .strict();

export const StructuredValueSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), value: boundedText(1, 500) }).strict(),
  z
    .object({
      kind: z.literal("number"),
      value: z.number().finite(),
      unit: boundedText(1, 32).optional(),
    })
    .strict(),
  z.object({ kind: z.literal("boolean"), value: z.boolean() }).strict(),
  z.object({ kind: z.literal("date"), value: TimestampSchema }).strict(),
  z.object({ kind: z.literal("range"), value: QuantityRangeSchema }).strict(),
]);

export const EntityTypeSchema = z.enum([
  "preferenceProfile",
  "space",
  "investigation",
  "objectPassport",
  "observation",
  "hypothesis",
  "evidenceRequest",
  "evidenceAsset",
  "pathway",
  "pathwayScore",
  "agentRun",
  "agentEvent",
  "investigationSnapshot",
  "userApproval",
  "mission",
  "recommendationRevision",
  "verificationResult",
  "circularActionEntry",
  "circularValueEntry",
  "climateImpactEntry",
  "creditClaim",
  "creditLedgerEntry",
  "localPathwaySource",
  "movePlan",
]);

export type OwnerScope = z.infer<typeof OwnerScopeSchema>;
export type SyncMeta = z.infer<typeof SyncMetaSchema>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
