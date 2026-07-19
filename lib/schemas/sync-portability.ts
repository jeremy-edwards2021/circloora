import { z } from "zod";

import {
  DOMAIN_SCHEMA_VERSION,
  EXPORT_FORMAT_VERSION,
  EntityIdSchema,
  EntityTypeSchema,
  HlcSchema,
  OwnerScopeSchema,
  TimestampSchema,
  boundedText,
} from "./primitives";

export const TombstoneSchema = z
  .object({
    entityType: EntityTypeSchema,
    entityId: EntityIdSchema,
    ownerScope: OwnerScopeSchema,
    causalVersion: z.number().int().positive(),
    hlc: HlcSchema,
    deletedAt: TimestampSchema,
    reasonCode: z.enum([
      "user_requested",
      "parent_deleted",
      "retention_expired",
      "account_deleted",
      "merged",
    ]),
  })
  .strict();

export const SyncOperationSchema = z
  .object({
    operationId: EntityIdSchema,
    entityType: EntityTypeSchema,
    entityId: EntityIdSchema,
    operation: z.enum(["create", "update", "delete", "append"]),
    baseVersion: z.number().int().nonnegative(),
    entity: z.record(z.string(), z.unknown()).optional(),
    changedFields: z
      .array(z.string().regex(/^[A-Za-z][A-Za-z0-9.]{0,119}$/))
      .max(100),
    tombstone: TombstoneSchema.optional(),
    hlc: HlcSchema,
    deviceId: EntityIdSchema,
    idempotencyKey: z
      .string()
      .min(16)
      .max(160)
      .regex(/^[A-Za-z0-9:_-]+$/),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.operation === "delete" && !value.tombstone) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tombstone"],
        message: "Delete operations require a tombstone",
      });
    }
    if (value.operation !== "delete" && !value.entity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entity"],
        message: "Non-delete operations require an entity payload",
      });
    }
  });

export const SyncConflictSchema = z
  .object({
    conflictId: EntityIdSchema,
    entityType: EntityTypeSchema,
    entityId: EntityIdSchema,
    baseVersion: z.number().int().nonnegative(),
    localVersion: z.number().int().nonnegative(),
    remoteVersion: z.number().int().nonnegative(),
    conflictingFieldPaths: z
      .array(z.string().regex(/^[A-Za-z][A-Za-z0-9.]{0,119}$/))
      .min(1)
      .max(100),
    policy: z.enum([
      "set_union",
      "three_way",
      "monotonic_state",
      "server_recompute",
      "immutable_keep_both",
      "deletion_wins",
    ]),
    resolutionState: z.enum([
      "pending",
      "auto_resolved",
      "user_required",
      "resolved",
      "quarantined",
    ]),
    resolutionReason: boundedText(1, 500).optional(),
  })
  .strict();

export const MigrationManifestSchema = z
  .object({
    exportFormatVersion: z.literal(EXPORT_FORMAT_VERSION),
    domainSchemaVersion: z.literal(DOMAIN_SCHEMA_VERSION),
    localProfileId: EntityIdSchema,
    deviceId: EntityIdSchema,
    recordCounts: z.record(EntityTypeSchema, z.number().int().nonnegative()),
    dependencyOrder: z
      .array(EntityTypeSchema)
      .min(1)
      .max(EntityTypeSchema.options.length),
    orderedContentHashes: z
      .array(z.string().regex(/^[a-f0-9]{64}$/i))
      .max(20_000),
    evidenceChoices: z
      .object({
        includeMetadata: z.boolean(),
        includeDurableBytes: z.literal(false),
      })
      .strict(),
    createdAt: TimestampSchema,
  })
  .strict();

export const ExportRecordSchema = z
  .object({
    entityType: EntityTypeSchema,
    data: z.record(z.string(), z.unknown()),
  })
  .strict();

export const ExportEnvelopeSchema = z
  .object({
    product: z.literal("circloora"),
    exportFormatVersion: z.literal(EXPORT_FORMAT_VERSION),
    domainSchemaVersion: z.literal(DOMAIN_SCHEMA_VERSION),
    generatedAt: TimestampSchema,
    scope: OwnerScopeSchema,
    records: z.array(ExportRecordSchema).max(20_000),
    tombstones: z.array(TombstoneSchema).max(20_000),
    recordCounts: z.record(EntityTypeSchema, z.number().int().nonnegative()),
    redactions: z
      .object({
        rawEvidenceExcluded: z.literal(true),
        authExcluded: z.literal(true),
        providerMetadataExcluded: z.literal(true),
        privateAgentStateExcluded: z.literal(true),
      })
      .strict(),
    checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  })
  .strict();

export const DeletionRequestSchema = z
  .object({
    scope: z.enum(["investigation", "object", "local_all", "cloud_account"]),
    targetId: EntityIdSchema.optional(),
    reauthenticationProofReference: z.string().min(16).max(240).optional(),
    exportOffered: z.literal(true),
    exportAccepted: z.boolean(),
    confirmationPhrase: boundedText(1, 80),
    idempotencyKey: z
      .string()
      .min(16)
      .max(160)
      .regex(/^[A-Za-z0-9:_-]+$/),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      (value.scope === "investigation" || value.scope === "object") &&
      !value.targetId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetId"],
        message: "This deletion scope requires a target",
      });
    }
    if (
      value.scope === "cloud_account" &&
      !value.reauthenticationProofReference
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reauthenticationProofReference"],
        message: "Cloud account deletion requires fresh reauthentication",
      });
    }
  });

export type Tombstone = z.infer<typeof TombstoneSchema>;
export type SyncOperation = z.infer<typeof SyncOperationSchema>;
export type SyncConflict = z.infer<typeof SyncConflictSchema>;
export type MigrationManifest = z.infer<typeof MigrationManifestSchema>;
export type ExportEnvelope = z.infer<typeof ExportEnvelopeSchema>;
export type ExportRecord = z.infer<typeof ExportRecordSchema>;
export type DeletionRequest = z.infer<typeof DeletionRequestSchema>;
