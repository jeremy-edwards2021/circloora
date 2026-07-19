import { z } from "zod";

export const IdSchema = z.string().uuid();
export const TimestampSchema = z.string().datetime({ offset: true });
export const ConfidenceSchema = z.number().finite().min(0).max(1);

export const PathwaySchema = z.enum([
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
  "component_recovery",
  "material_recycling",
  "compost",
  "special_handling",
  "dispose",
]);

export const SafetyFlagSchema = z.enum([
  "swollen_battery",
  "damaged_lithium",
  "chemical",
  "solvent",
  "pressurized_container",
  "medication",
  "sharp",
  "biological",
  "firearm",
  "ammunition",
  "asbestos",
  "recalled",
  "unknown_hazard",
]);

export const EvidenceRefSchema = z
  .object({
    evidenceId: IdSchema,
    kind: z.enum([
      "image",
      "document",
      "partner_confirmation",
      "user_attestation",
    ]),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    capturedAt: TimestampSchema,
    retentionPolicy: z.enum([
      "transient",
      "device_consented",
      "account_consented",
    ]),
  })
  .strict();

export const SourceRefSchema = z
  .object({
    sourceId: IdSchema,
    httpsUrl: z
      .string()
      .url()
      .refine((url) => url.startsWith("https://"), "HTTPS required"),
    title: z.string().min(1).max(240),
    publisher: z.string().min(1).max(160),
    sourceType: z.enum([
      "government",
      "municipal",
      "manufacturer",
      "nonprofit",
      "repair_network",
      "reuse_network",
      "marketplace",
      "partner",
      "other",
    ]),
    retrievedAt: TimestampSchema,
    expiresAt: TimestampSchema.optional(),
    jurisdiction: z.string().max(120).optional(),
    supportedClaims: z.array(z.string().min(1).max(240)).max(20),
    verificationStatus: z.enum([
      "verified",
      "partially_verified",
      "unverified",
      "expired",
    ]),
    isMock: z.boolean(),
    limitations: z.array(z.string().min(1).max(240)).max(20),
  })
  .strict();

export const FeatureSchema = z
  .object({
    text: z.string().min(1).max(300),
    confidence: ConfidenceSchema,
    provenance: z.enum([
      "directly_observed",
      "user_reported",
      "inferred",
      "externally_retrieved",
    ]),
  })
  .strict();

export const MoneyRangeSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/),
    low: z.number().finite().nonnegative(),
    high: z.number().finite().nonnegative(),
  })
  .strict()
  .refine(({ low, high }) => high >= low, {
    message: "high must be at least low",
  });

export type Pathway = z.infer<typeof PathwaySchema>;
