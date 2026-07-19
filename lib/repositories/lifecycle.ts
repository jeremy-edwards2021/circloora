import {
  EntityTypeSchema,
  type EntityType,
  type OwnerScope,
} from "../schemas/primitives";
import { parseDomainEntity } from "../schemas/registry";
import {
  ExportEnvelopeSchema,
  type ExportEnvelope,
  type ExportRecord,
  type Tombstone,
} from "../schemas/sync-portability";
import type { CirclooraRepository, LocalSnapshot } from "./types";

const FORBIDDEN_PORTABLE_KEYS = new Set([
  "rawimage",
  "imagebytes",
  "rawbytes",
  "dataurl",
  "signedurl",
  "accesstoken",
  "refreshtoken",
  "cookie",
  "secret",
  "prompt",
  "reasoning",
  "chainofthought",
  "rawresponse",
  "receiptext",
  "fullocr",
]);

const OMITTED_PROVIDER_KEYS = new Set(["storageLocator"]);

export class PortabilityValidationError extends Error {
  readonly code = "PORTABILITY_VALIDATION_FAILED";

  constructor(
    message: string,
    readonly path: readonly (string | number)[] = [],
  ) {
    super(message);
    this.name = "PortabilityValidationError";
  }
}

function normalizedKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function sanitizePortableValue(
  value: unknown,
  path: readonly (string | number)[] = [],
): unknown {
  if (
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  ) {
    throw new PortabilityValidationError(
      "Binary evidence is excluded from default portability",
      path,
    );
  }
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.startsWith("data:") ||
      /[?&](token|signature|x-amz-signature)=/i.test(value)
    ) {
      throw new PortabilityValidationError(
        "Inline or signed evidence access is excluded from portability",
        path,
      );
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizePortableValue(item, [...path, index]),
    );
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (OMITTED_PROVIDER_KEYS.has(key)) continue;
      if (FORBIDDEN_PORTABLE_KEYS.has(normalizedKey(key))) {
        throw new PortabilityValidationError(
          `Forbidden portable field: ${key}`,
          [...path, key],
        );
      }
      output[key] = sanitizePortableValue(nested, [...path, key]);
    }
    return output;
  }
  return value;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256Hex(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle)
    throw new PortabilityValidationError(
      "Web Crypto is required for export checksums",
    );
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function checksumMaterial(
  envelope: Omit<ExportEnvelope, "checksumSha256">,
): string {
  return stableJson(envelope);
}

function sameOwner(left: OwnerScope, right: OwnerScope): boolean {
  if (left.kind !== right.kind) return false;
  return left.kind === "local"
    ? left.localProfileId ===
        (right as Extract<OwnerScope, { kind: "local" }>).localProfileId
    : left.userId ===
        (right as Extract<OwnerScope, { kind: "account" }>).userId;
}

export async function createExportEnvelope(
  snapshot: LocalSnapshot,
  scope: OwnerScope,
  generatedAt = new Date().toISOString(),
): Promise<ExportEnvelope> {
  const counts = Object.fromEntries(
    EntityTypeSchema.options.map((type) => [type, 0]),
  ) as Record<EntityType, number>;
  const records: ExportRecord[] = snapshot.records.map(
    ({ entityType, data }) => {
      if (!sameOwner(data.ownerScope, scope))
        throw new PortabilityValidationError(
          "Mixed-owner exports are forbidden",
        );
      const sanitized = sanitizePortableValue(data);
      const parsed = parseDomainEntity(entityType, sanitized);
      counts[entityType] += 1;
      return { entityType, data: parsed };
    },
  );
  const tombstones: Tombstone[] = snapshot.tombstones.map((item) => {
    if (!sameOwner(item.ownerScope, scope))
      throw new PortabilityValidationError(
        "Mixed-owner tombstones are forbidden",
      );
    return item;
  });
  const withoutChecksum: Omit<ExportEnvelope, "checksumSha256"> = {
    product: "circloora",
    exportFormatVersion: 1,
    domainSchemaVersion: 1,
    generatedAt,
    scope,
    records,
    tombstones,
    recordCounts: counts,
    redactions: {
      rawEvidenceExcluded: true,
      authExcluded: true,
      providerMetadataExcluded: true,
      privateAgentStateExcluded: true,
    },
  };
  return ExportEnvelopeSchema.parse({
    ...withoutChecksum,
    checksumSha256: await sha256Hex(checksumMaterial(withoutChecksum)),
  });
}

export interface ImportPreview {
  envelope: ExportEnvelope;
  records: LocalSnapshot["records"];
  counts: Record<EntityType, number>;
  conflicts: Array<{
    entityType: EntityType;
    entityId: string;
    reason: "existing_id";
  }>;
  rawEvidenceExcluded: true;
}

export async function previewImport(
  payload: unknown,
  repository?: CirclooraRepository,
): Promise<ImportPreview> {
  const envelope = ExportEnvelopeSchema.parse(payload);
  const { checksumSha256, ...withoutChecksum } = envelope;
  const calculated = await sha256Hex(checksumMaterial(withoutChecksum));
  if (calculated !== checksumSha256)
    throw new PortabilityValidationError(
      "Export checksum does not match its contents",
    );

  const counts = Object.fromEntries(
    EntityTypeSchema.options.map((type) => [type, 0]),
  ) as Record<EntityType, number>;
  const records: LocalSnapshot["records"] = [];
  const conflicts: ImportPreview["conflicts"] = [];
  for (const record of envelope.records) {
    sanitizePortableValue(record.data);
    const parsed = parseDomainEntity(record.entityType, record.data);
    if (!sameOwner(parsed.ownerScope, envelope.scope))
      throw new PortabilityValidationError(
        "Record owner does not match export scope",
      );
    counts[record.entityType] += 1;
    records.push({ entityType: record.entityType, data: parsed });
    if (
      repository &&
      (await repository
        .entity(record.entityType)
        .get(parsed.id, { includeDeleted: true }))
    ) {
      conflicts.push({
        entityType: record.entityType,
        entityId: parsed.id,
        reason: "existing_id",
      });
    }
  }
  for (const type of EntityTypeSchema.options) {
    if ((envelope.recordCounts[type] ?? 0) !== counts[type]) {
      throw new PortabilityValidationError(`Record count mismatch for ${type}`);
    }
  }
  return { envelope, records, counts, conflicts, rawEvidenceExcluded: true };
}

export async function importEnvelope(
  repository: CirclooraRepository,
  payload: unknown,
  strategy: "merge" | "replace_local" = "merge",
): Promise<ImportPreview> {
  const preview = await previewImport(payload, repository);
  await repository.importRecords(preview.records, strategy);
  return preview;
}

export interface LocalDeletionResult {
  repositoryCleared: boolean;
  cachesCleared: string[];
  storageKeysCleared: string[];
  broadcastSent: boolean;
}

export async function deleteAllLocalData(
  repository: CirclooraRepository,
  options: { cachePrefix?: string; localStorageKeys?: string[] } = {},
): Promise<LocalDeletionResult> {
  const cachePrefix = options.cachePrefix ?? "circloora-user-";
  let broadcastSent = false;
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("circloora-data-lifecycle");
    channel.postMessage({ type: "delete_all_requested" });
    channel.close();
    broadcastSent = true;
  }
  await repository.clear();
  repository.close();

  const cachesCleared: string[] = [];
  if (typeof caches !== "undefined") {
    for (const key of await caches.keys()) {
      if (key.startsWith(cachePrefix) && (await caches.delete(key)))
        cachesCleared.push(key);
    }
  }
  const storageKeysCleared: string[] = [];
  if (typeof localStorage !== "undefined") {
    for (const key of options.localStorageKeys ?? [
      "circloora-analytics-consent",
      "circloora-analytics-session",
    ]) {
      localStorage.removeItem(key);
      storageKeysCleared.push(key);
    }
  }
  return {
    repositoryCleared: true,
    cachesCleared,
    storageKeysCleared,
    broadcastSent,
  };
}
