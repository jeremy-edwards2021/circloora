import { z } from "zod";

import {
  ConfidenceSchema,
  EntityIdSchema,
  EvidenceRefSchema,
  MoneyRangeSchema,
  SafetyFlagSchema,
  SourceRefSchema,
  TimestampSchema,
  boundedText,
  syncMetaShape,
} from "./primitives";

export const PreferenceModeSchema = z.enum([
  "maximize_money",
  "minimize_waste",
  "finish_fastest",
  "minimize_travel",
  "minimize_effort",
  "balanced",
]);

export const PreferenceProfileSchema = z
  .object({
    ...syncMetaShape,
    firstName: boundedText(1, 80).optional(),
    generalLocation: boundedText(1, 120).optional(),
    postalCode: z.string().trim().min(3).max(12).optional(),
    householdType: z
      .enum([
        "single_person",
        "multi_person",
        "family",
        "other",
        "prefer_not_to_say",
      ])
      .optional(),
    occupancyType: z
      .enum(["rent", "own", "temporary", "other", "prefer_not_to_say"])
      .optional(),
    transportationOptions: z
      .array(
        z.enum([
          "walk",
          "bicycle",
          "public_transit",
          "car",
          "rideshare",
          "delivery",
          "other",
        ]),
      )
      .max(7),
    preferredTravelRadiusMeters: z.number().int().nonnegative().max(200_000),
    repairComfortLevel: z.enum(["none", "basic", "intermediate", "advanced"]),
    minimumResaleThreshold: MoneyRangeSchema.optional(),
    donationPreferences: z.array(boundedText(1, 80)).max(20),
    accessibilityPreferences: z.array(boundedText(1, 120)).max(20),
    rewardPreferences: z.array(boundedText(1, 80)).max(20),
    regenerationPreferences: z
      .object({
        topics: z.array(boundedText(1, 80)).max(20),
        preferenceOnly: z.literal(true),
      })
      .strict(),
    privacySettings: z
      .object({
        analyticsConsent: z.boolean(),
        durableLocalEvidence: z.boolean(),
        durableCloudEvidence: z.boolean(),
        consentVersion: boundedText(1, 32),
      })
      .strict(),
    notificationSettings: z
      .object({
        missionReminders: z.boolean(),
        deadlineReminders: z.boolean(),
      })
      .strict(),
    rankingMode: PreferenceModeSchema,
    agentMemoryConsent: z.boolean(),
    agentMemoryConsentVersion: boundedText(1, 32).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.agentMemoryConsent && !value.agentMemoryConsentVersion) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["agentMemoryConsentVersion"],
        message: "A consent version is required when agent memory is enabled",
      });
    }
  });

export const SpaceSchema = z
  .object({
    ...syncMetaShape,
    name: boundedText(1, 80),
    nameNormalized: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[^<>]+$/),
    kind: z.enum(["room", "storage", "office", "outdoor", "other"]),
    sortOrder: z.number().int().min(0).max(10_000),
    archivedAt: TimestampSchema.optional(),
  })
  .strict();

export const LifecycleStatusSchema = z.enum([
  "active",
  "archived",
  "transferred",
  "deleted",
]);

const ProbableAttributeSchema = z
  .object({
    value: boundedText(1, 160),
    confidence: ConfidenceSchema,
    evidenceAssetIds: z.array(EntityIdSchema).max(12),
  })
  .strict();

export const ObjectPassportSchema = z
  .object({
    ...syncMetaShape,
    investigationId: EntityIdSchema,
    userConfirmedName: boundedText(1, 120),
    primaryEvidence: EvidenceRefSchema.optional(),
    category: boundedText(1, 80),
    subcategory: boundedText(1, 80).optional(),
    probableIdentity: ProbableAttributeSchema.optional(),
    probableBrand: ProbableAttributeSchema.optional(),
    probableModel: ProbableAttributeSchema.optional(),
    probableMaterials: z.array(ProbableAttributeSchema).max(20),
    spaceId: EntityIdSchema.optional(),
    ownershipStatus: z.enum([
      "owned",
      "borrowed",
      "rented",
      "shared",
      "unknown",
    ]),
    acquisitionDate: z.string().date().optional(),
    estimatedAge: z
      .object({
        lowYears: z.number().nonnegative(),
        highYears: z.number().nonnegative(),
      })
      .strict()
      .refine((value) => value.lowYears <= value.highYears, "Invalid age range")
      .optional(),
    condition: z.enum([
      "excellent",
      "good",
      "fair",
      "poor",
      "unsafe",
      "unknown",
    ]),
    functionality: z.enum([
      "working",
      "partially_working",
      "not_working",
      "not_applicable",
      "unknown",
    ]),
    repairability: z.enum(["high", "medium", "low", "unknown"]),
    maintenanceNeeds: z.array(boundedText(1, 180)).max(20),
    warrantyInformation: boundedText(1, 500).optional(),
    manualSources: z.array(SourceRefSchema).max(12),
    replacementPartSources: z.array(SourceRefSchema).max(12),
    recallSources: z.array(SourceRefSchema).max(12),
    estimatedRemainingValue: MoneyRangeSchema.optional(),
    currentRecommendedPathwayId: EntityIdSchema.optional(),
    alternativePathwayIds: z.array(EntityIdSchema).max(20),
    observationIds: z.array(EntityIdSchema).max(200),
    hypothesisIds: z.array(EntityIdSchema).max(100),
    assumptions: z.array(boundedText(1, 280)).max(30),
    uncertainty: z.array(boundedText(1, 280)).max(30),
    safetyFlags: z.array(SafetyFlagSchema).max(20),
    sourceRefs: z.array(SourceRefSchema).max(40),
    recommendationRevisionIds: z.array(EntityIdSchema).max(100),
    completedMissionIds: z.array(EntityIdSchema).max(100),
    verificationIds: z.array(EntityIdSchema).max(100),
    creditsEarnedProjection: z.number().int(),
    lifecycleStatus: LifecycleStatusSchema,
    catalogViewFlags: z
      .array(
        z
          .enum([
            "needs_action",
            "best_for_reuse",
            "repairable",
            "safety_attention",
          ])
          .or(boundedText(1, 40)),
      )
      .max(12),
    passportDisclaimerVersion: boundedText(1, 32),
  })
  .strict();

export const EvidenceAssetSchema = z
  .object({
    ...syncMetaShape,
    objectId: EntityIdSchema.optional(),
    missionId: EntityIdSchema.optional(),
    verificationId: EntityIdSchema.optional(),
    kind: z.enum([
      "sanitized_image",
      "sanitized_document",
      "user_attestation",
      "partner_receipt",
    ]),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/i)
      .optional(),
    mimeType: z
      .enum(["image/jpeg", "image/png", "image/webp", "application/pdf"])
      .optional(),
    byteSize: z
      .number()
      .int()
      .positive()
      .max(12 * 1024 * 1024)
      .optional(),
    width: z.number().int().positive().max(12_000).optional(),
    height: z.number().int().positive().max(12_000).optional(),
    redactionStatus: z.enum(["not_required", "pending", "redacted"]),
    validationStatus: z.enum(["pending", "accepted", "rejected", "purged"]),
    consent: z
      .object({
        basis: z.enum([
          "transient_analysis",
          "local_retention",
          "cloud_retention",
        ]),
        version: boundedText(1, 32),
        grantedAt: TimestampSchema,
      })
      .strict(),
    retentionUntil: TimestampSchema.optional(),
    purgedAt: TimestampSchema.optional(),
    storageLocator: z
      .object({
        kind: z.enum(["none", "local_consent", "cloud_private"]),
        opaqueAssetKey: z.string().min(16).max(240).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.consent.basis !== "transient_analysis" && !value.retentionUntil) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["retentionUntil"],
        message: "Durable evidence requires an explicit retention deadline",
      });
    }
    if (value.validationStatus === "purged" && !value.purgedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purgedAt"],
        message: "Purged evidence requires a purge timestamp",
      });
    }
  });

export type PreferenceProfile = z.infer<typeof PreferenceProfileSchema>;
export type Space = z.infer<typeof SpaceSchema>;
export type ObjectPassport = z.infer<typeof ObjectPassportSchema>;
export type EvidenceAsset = z.infer<typeof EvidenceAssetSchema>;
