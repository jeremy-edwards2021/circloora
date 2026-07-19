import type { DomainEntity, DomainEntityMap } from "../schemas/registry";
import type { EntityType, OwnerScope } from "../schemas/primitives";
import type { ExportEnvelope, Tombstone } from "../schemas/sync-portability";

export type EntityId = string;

export interface ReadOptions {
  includeDeleted?: boolean;
}

export interface QuerySpec {
  ownerScope?: OwnerScope;
  includeDeleted?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "id";
  direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export type DomainPatch<T> = Partial<
  Omit<
    T,
    | "id"
    | "ownerScope"
    | "schemaVersion"
    | "version"
    | "createdAt"
    | "sourceDeviceId"
  >
>;

export interface WriteOptions {
  idempotencyKey?: string;
  authority?: "local_prototype" | "trusted_server";
}

export interface ExpectedVersion {
  expectedVersion: number;
}

export interface DeleteReason {
  reasonCode: Tombstone["reasonCode"];
}

export type WriteResult<T> =
  | { ok: true; entity: T; replayed: boolean }
  | {
      ok: false;
      conflict: {
        code:
          | "VERSION_CONFLICT"
          | "ALREADY_EXISTS"
          | "APPEND_ONLY"
          | "SERVER_AUTHORITY_REQUIRED";
        expectedVersion: number;
        actualVersion: number | null;
        current: T | null;
      };
    };

export interface EntityRepository<T> {
  get(id: EntityId, options?: ReadOptions): Promise<T | null>;
  list(query?: QuerySpec): Promise<Page<T>>;
  create(entity: T, options?: WriteOptions): Promise<WriteResult<T>>;
  update(
    id: EntityId,
    patch: DomainPatch<T>,
    options: ExpectedVersion & WriteOptions,
  ): Promise<WriteResult<T>>;
  delete(
    id: EntityId,
    options: ExpectedVersion & DeleteReason & WriteOptions,
  ): Promise<WriteResult<Tombstone>>;
}

export interface AppendOnlyRepository<T> {
  get(id: EntityId): Promise<T | null>;
  list(query?: QuerySpec): Promise<Page<T>>;
  append(entity: T, options?: WriteOptions): Promise<WriteResult<T>>;
}

export interface RepositorySet {
  entity<Type extends EntityType>(
    type: Type,
  ): EntityRepository<DomainEntityMap[Type]>;
}

export interface LocalSnapshot {
  records: Array<{ entityType: EntityType; data: DomainEntity }>;
  tombstones: Tombstone[];
}

export interface CirclooraRepository extends RepositorySet {
  transaction<Result>(
    work: (repositories: RepositorySet) => Promise<Result>,
  ): Promise<Result>;
  snapshot(): Promise<LocalSnapshot>;
  importRecords(
    records: LocalSnapshot["records"],
    strategy: "merge" | "replace_local",
  ): Promise<void>;
  export(): Promise<ExportEnvelope>;
  import(payload: unknown): Promise<void>;
  clear(): Promise<void>;
  close(): void;
}

export interface ConfirmedEvidence {
  assetId: EntityId;
  sanitizedBlob: Blob;
  sha256: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
}

export interface EvidenceRetentionConsent {
  location: "device" | "account";
  purpose: "mission" | "verification";
  consentVersion: string;
  retentionUntil: string;
}

export type EvidenceAccessPurpose =
  "analysis" | "verification" | "user_download";

export interface EvidenceRepository {
  putConfirmed(
    input: ConfirmedEvidence,
    consent: EvidenceRetentionConsent,
  ): Promise<{ assetId: EntityId }>;
  getAuthorized(
    assetId: EntityId,
    purpose: EvidenceAccessPurpose,
  ): Promise<Blob>;
  delete(assetId: EntityId): Promise<void>;
}

export interface RepositoryContractFactory {
  create(): Promise<CirclooraRepository>;
  destroy(repository: CirclooraRepository): Promise<void>;
}
