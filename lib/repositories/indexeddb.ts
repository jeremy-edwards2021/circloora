import { deleteDB, openDB, type IDBPDatabase, type IDBPTransaction } from "idb";

import type { DomainEntity, DomainEntityMap } from "../schemas/registry";
import {
  APPEND_ONLY_ENTITY_TYPES,
  SERVER_AUTHORITATIVE_ENTITY_TYPES,
  parseDomainEntity,
} from "../schemas/registry";
import {
  EntityTypeSchema,
  type EntityType,
  type OwnerScope,
} from "../schemas/primitives";
import { TombstoneSchema, type Tombstone } from "../schemas/sync-portability";
import { createExportEnvelope, importEnvelope } from "./lifecycle";
import type {
  CirclooraRepository,
  DomainPatch,
  EntityRepository,
  LocalSnapshot,
  QuerySpec,
  RepositorySet,
  WriteOptions,
  WriteResult,
} from "./types";

export const CIRCLOORA_DATABASE_NAME = "circloora";
export const CIRCLOORA_DATABASE_VERSION = 2;

export const STORE_BY_ENTITY = {
  preferenceProfile: "profiles",
  space: "spaces",
  investigation: "investigations",
  objectPassport: "objects",
  observation: "observations",
  hypothesis: "hypotheses",
  evidenceRequest: "evidenceRequests",
  evidenceAsset: "evidenceAssets",
  pathway: "pathways",
  pathwayScore: "pathwayScores",
  agentRun: "agentRuns",
  agentEvent: "agentEvents",
  investigationSnapshot: "agentState",
  userApproval: "approvals",
  mission: "missions",
  recommendationRevision: "recommendationRevisions",
  verificationResult: "verifications",
  circularActionEntry: "actionLedger",
  circularValueEntry: "valueLedger",
  climateImpactEntry: "climateLedger",
  creditClaim: "creditClaims",
  creditLedgerEntry: "creditLedger",
  localPathwaySource: "sources",
  movePlan: "movePlans",
} as const satisfies Record<EntityType, string>;

export const DOMAIN_STORE_NAMES = Object.values(STORE_BY_ENTITY);
export const OPERATIONAL_STORE_NAMES = [
  "meta",
  "evidenceBlobs",
  "outbox",
  "tombstones",
  "migrationBatches",
] as const;
export const ALL_STORE_NAMES = [
  ...DOMAIN_STORE_NAMES,
  ...OPERATIONAL_STORE_NAMES,
] as const;

export const INDEXED_DB_MIGRATIONS = [
  {
    version: 1,
    description:
      "Create canonical domain stores and metadata without durable evidence bytes",
  },
  {
    version: 2,
    description:
      "Add isolated evidence bytes, outbox, tombstones, and resumable migration batches",
  },
] as const;

function createDomainStore(database: IDBPDatabase, name: string) {
  const store = database.createObjectStore(name, { keyPath: "id" });
  store.createIndex("createdAt", "createdAt");
  store.createIndex("updatedAt", "updatedAt");
  store.createIndex("ownerKind", "ownerScope.kind");
  return store;
}

function upgradeDatabase(database: IDBPDatabase, oldVersion: number) {
  if (oldVersion < 1) {
    database.createObjectStore("meta", { keyPath: "key" });
    for (const storeName of DOMAIN_STORE_NAMES)
      createDomainStore(database, storeName);
  }
  if (oldVersion < 2) {
    const evidence = database.createObjectStore("evidenceBlobs", {
      keyPath: "assetId",
    });
    evidence.createIndex("retentionUntil", "retentionUntil");
    const outbox = database.createObjectStore("outbox", {
      keyPath: "sequence",
      autoIncrement: true,
    });
    outbox.createIndex("status", "status");
    outbox.createIndex("nextAttemptAt", "nextAttemptAt");
    outbox.createIndex("entity", ["entityType", "entityId"]);
    const tombstones = database.createObjectStore("tombstones", {
      keyPath: ["entityType", "entityId"],
    });
    tombstones.createIndex("deletedAt", "deletedAt");
    const batches = database.createObjectStore("migrationBatches", {
      keyPath: "id",
    });
    batches.createIndex("status", "status");
    batches.createIndex("createdAt", "createdAt");
  }
}

export function openCirclooraDatabase(
  name = CIRCLOORA_DATABASE_NAME,
): Promise<IDBPDatabase> {
  if (typeof indexedDB === "undefined")
    throw new Error("INDEXED_DB_UNAVAILABLE");
  return openDB(name, CIRCLOORA_DATABASE_VERSION, {
    upgrade(database, oldVersion) {
      upgradeDatabase(database, oldVersion);
    },
    blocked() {
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("circloora-data-lifecycle");
        channel.postMessage({ type: "database_upgrade_blocked" });
        channel.close();
      }
    },
  });
}

function ownerKey(scope: OwnerScope): string {
  return scope.kind === "local"
    ? `local:${scope.localProfileId}`
    : `account:${scope.userId}`;
}

function encodeCursor(value: string, id: string): string {
  return JSON.stringify([value, id]);
}

function decodeCursor(
  cursor: string | undefined,
): readonly [string, string] | null {
  if (!cursor) return null;
  try {
    const value: unknown = JSON.parse(cursor);
    if (Array.isArray(value) && value.length === 2) {
      const [sortValue, id] = value;
      if (typeof sortValue === "string" && typeof id === "string")
        return [sortValue, id];
    }
  } catch {
    // Deliberately collapse parser details into one safe error.
  }
  throw new Error("INVALID_REPOSITORY_CURSOR");
}

function operationId(): string {
  if (!globalThis.crypto?.randomUUID)
    throw new Error("SECURE_RANDOM_UNAVAILABLE");
  return globalThis.crypto.randomUUID();
}

type ActiveTransaction = IDBPTransaction<unknown, string[], "readwrite">;

export class IndexedDbCirclooraRepository implements CirclooraRepository {
  private readonly databasePromise: Promise<IDBPDatabase>;
  private database: IDBPDatabase | null = null;
  private activeTransaction: ActiveTransaction | null = null;
  private closed = false;

  constructor(
    readonly scope: OwnerScope,
    readonly databaseName = CIRCLOORA_DATABASE_NAME,
  ) {
    this.databasePromise = openCirclooraDatabase(databaseName).then(
      (database) => {
        this.database = database;
        return database;
      },
    );
  }

  private async getDatabase() {
    if (this.closed) throw new Error("REPOSITORY_CLOSED");
    return this.databasePromise;
  }

  private objectStore(
    transaction: ActiveTransaction | null,
    storeName: string,
  ) {
    return transaction ? transaction.objectStore(storeName) : null;
  }

  private async writeOutbox(
    transaction: ActiveTransaction,
    entityType: EntityType,
    entity: DomainEntity,
    operation: "create" | "update" | "delete" | "append",
    options?: WriteOptions,
  ) {
    await transaction.objectStore("outbox").add({
      operationId: operationId(),
      entityType,
      entityId: entity.id,
      operation,
      baseVersion: operation === "create" ? 0 : Math.max(0, entity.version - 1),
      entity,
      hlc: entity.hlc,
      deviceId: entity.sourceDeviceId,
      idempotencyKey:
        options?.idempotencyKey ??
        `${operation}:${entityType}:${entity.id}:${entity.version}`,
      status: "pending",
      nextAttemptAt: entity.updatedAt,
    });
  }

  entity<Type extends EntityType>(
    type: Type,
  ): EntityRepository<DomainEntityMap[Type]> {
    const storeName = STORE_BY_ENTITY[type];
    const authorityConflict = (
      options: WriteOptions | undefined,
      current: DomainEntityMap[Type] | null,
      expected: number,
    ) => {
      if (
        !SERVER_AUTHORITATIVE_ENTITY_TYPES.has(type) ||
        options?.authority === "trusted_server"
      )
        return null;
      return {
        ok: false as const,
        conflict: {
          code: "SERVER_AUTHORITY_REQUIRED" as const,
          expectedVersion: expected,
          actualVersion: current?.version ?? null,
          current,
        },
      };
    };
    return {
      get: async (id, options) => {
        const database = await this.getDatabase();
        const raw = await database.get(storeName, id);
        if (!raw) return null;
        const entity = parseDomainEntity(type, raw);
        if (entity.deletedAt && !options?.includeDeleted) return null;
        return entity;
      },
      list: async (query: QuerySpec = {}) => {
        const database = await this.getDatabase();
        const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
        const sortBy = query.sortBy ?? "updatedAt";
        const direction = query.direction ?? "desc";
        const cursor = decodeCursor(query.cursor);
        const raw = await database.getAll(storeName);
        const items = raw
          .map((value) => parseDomainEntity(type, value))
          .filter((value) => query.includeDeleted || !value.deletedAt)
          .filter(
            (value) =>
              !query.ownerScope ||
              ownerKey(value.ownerScope) === ownerKey(query.ownerScope),
          )
          .sort((left, right) => {
            const compared =
              String(left[sortBy]).localeCompare(String(right[sortBy])) ||
              left.id.localeCompare(right.id);
            return direction === "asc" ? compared : -compared;
          })
          .filter((value) => {
            if (!cursor) return true;
            const compared =
              String(value[sortBy]).localeCompare(cursor[0]) ||
              value.id.localeCompare(cursor[1]);
            return direction === "asc" ? compared > 0 : compared < 0;
          });
        const pageItems = items.slice(0, limit);
        const last = pageItems.at(-1);
        return {
          items: pageItems,
          nextCursor:
            items.length > limit && last
              ? encodeCursor(String(last[sortBy]), last.id)
              : null,
        };
      },
      create: async (input, options) => {
        const database = await this.getDatabase();
        const entity = parseDomainEntity(type, input);
        if (ownerKey(entity.ownerScope) !== ownerKey(this.scope))
          throw new Error("OWNER_SCOPE_MISMATCH");
        const transaction =
          this.activeTransaction ??
          database.transaction([storeName, "outbox"], "readwrite");
        const store = transaction.objectStore(storeName);
        const existing = (await store.get(entity.id)) as unknown;
        if (existing) {
          const current = parseDomainEntity(type, existing);
          return {
            ok: false,
            conflict: {
              code: "ALREADY_EXISTS",
              expectedVersion: entity.version,
              actualVersion: current.version,
              current,
            },
          };
        }
        const authority = authorityConflict(options, null, entity.version);
        if (authority) return authority;
        await store.add(entity);
        await this.writeOutbox(
          transaction,
          type,
          entity,
          APPEND_ONLY_ENTITY_TYPES.has(type) ? "append" : "create",
          options,
        );
        if (!this.activeTransaction) await transaction.done;
        return { ok: true, entity, replayed: false };
      },
      update: async (
        id,
        patch: DomainPatch<DomainEntityMap[Type]>,
        options,
      ) => {
        const database = await this.getDatabase();
        const transaction =
          this.activeTransaction ??
          database.transaction([storeName, "outbox"], "readwrite");
        const store = transaction.objectStore(storeName);
        const raw = await store.get(id);
        const current = raw ? parseDomainEntity(type, raw) : null;
        const authority = authorityConflict(
          options,
          current,
          options.expectedVersion,
        );
        if (authority) return authority;
        if (APPEND_ONLY_ENTITY_TYPES.has(type)) {
          return {
            ok: false,
            conflict: {
              code: "APPEND_ONLY",
              expectedVersion: options.expectedVersion,
              actualVersion: current?.version ?? null,
              current,
            },
          };
        }
        if (!current || current.version !== options.expectedVersion) {
          return {
            ok: false,
            conflict: {
              code: "VERSION_CONFLICT",
              expectedVersion: options.expectedVersion,
              actualVersion: current?.version ?? null,
              current,
            },
          };
        }
        const next = parseDomainEntity(type, {
          ...current,
          ...patch,
          id,
          version: current.version + 1,
        });
        await store.put(next);
        await this.writeOutbox(transaction, type, next, "update", options);
        if (!this.activeTransaction) await transaction.done;
        return { ok: true, entity: next, replayed: false };
      },
      delete: async (id, options) => {
        const database = await this.getDatabase();
        const transaction =
          this.activeTransaction ??
          database.transaction(
            [storeName, "outbox", "tombstones"],
            "readwrite",
          );
        const store = transaction.objectStore(storeName);
        const raw = await store.get(id);
        const current = raw ? parseDomainEntity(type, raw) : null;
        if (APPEND_ONLY_ENTITY_TYPES.has(type)) {
          return {
            ok: false,
            conflict: {
              code: "APPEND_ONLY",
              expectedVersion: options.expectedVersion,
              actualVersion: current?.version ?? null,
              current: null,
            },
          } as WriteResult<Tombstone>;
        }
        if (!current || current.version !== options.expectedVersion) {
          return {
            ok: false,
            conflict: {
              code: "VERSION_CONFLICT",
              expectedVersion: options.expectedVersion,
              actualVersion: current?.version ?? null,
              current: null,
            },
          } as WriteResult<Tombstone>;
        }
        const deletedAt = new Date().toISOString();
        const tombstone = TombstoneSchema.parse({
          entityType: type,
          entityId: id,
          ownerScope: current.ownerScope,
          causalVersion: current.version + 1,
          hlc: current.hlc,
          deletedAt,
          reasonCode: options.reasonCode,
        });
        await store.delete(id);
        await transaction.objectStore("tombstones").put(tombstone);
        await this.writeOutbox(
          transaction,
          type,
          {
            ...current,
            version: current.version + 1,
            deletedAt,
            updatedAt: deletedAt,
          },
          "delete",
          options,
        );
        if (!this.activeTransaction) await transaction.done;
        return { ok: true, entity: tombstone, replayed: false };
      },
    };
  }

  async transaction<Result>(
    work: (repositories: RepositorySet) => Promise<Result>,
  ): Promise<Result> {
    if (this.activeTransaction) return work(this);
    const database = await this.getDatabase();
    const transaction = database.transaction(
      ALL_STORE_NAMES as unknown as string[],
      "readwrite",
    );
    this.activeTransaction = transaction;
    try {
      const result = await work(this);
      await transaction.done;
      return result;
    } catch (error) {
      transaction.abort();
      throw error;
    } finally {
      this.activeTransaction = null;
    }
  }

  async snapshot(): Promise<LocalSnapshot> {
    const database = await this.getDatabase();
    const transaction = database.transaction(
      [...DOMAIN_STORE_NAMES, "tombstones"],
      "readonly",
    );
    const records: LocalSnapshot["records"] = [];
    for (const type of EntityTypeSchema.options) {
      const values = await transaction
        .objectStore(STORE_BY_ENTITY[type])
        .getAll();
      for (const value of values)
        records.push({
          entityType: type,
          data: parseDomainEntity(type, value),
        });
    }
    const tombstones = (
      await transaction.objectStore("tombstones").getAll()
    ).map((value) => TombstoneSchema.parse(value));
    await transaction.done;
    return { records, tombstones };
  }

  async importRecords(
    records: LocalSnapshot["records"],
    strategy: "merge" | "replace_local",
  ): Promise<void> {
    const validated = records.map((record) => ({
      entityType: record.entityType,
      data: parseDomainEntity(record.entityType, record.data),
    }));
    for (const record of validated) {
      if (ownerKey(record.data.ownerScope) !== ownerKey(this.scope))
        throw new Error("OWNER_SCOPE_MISMATCH");
    }
    const database = await this.getDatabase();
    const involved = [
      ...new Set(validated.map((record) => STORE_BY_ENTITY[record.entityType])),
    ];
    const transaction = database.transaction(involved, "readwrite");
    if (strategy === "replace_local")
      for (const storeName of involved)
        await transaction.objectStore(storeName).clear();
    for (const record of validated) {
      const store = transaction.objectStore(STORE_BY_ENTITY[record.entityType]);
      const existingRaw = await store.get(record.data.id);
      const existing = existingRaw
        ? parseDomainEntity(record.entityType, existingRaw)
        : null;
      if (!existing || record.data.version > existing.version)
        await store.put(record.data);
    }
    await transaction.done;
  }

  async export() {
    return createExportEnvelope(await this.snapshot(), this.scope);
  }

  async import(payload: unknown): Promise<void> {
    await importEnvelope(this, payload, "merge");
  }

  async clear(): Promise<void> {
    const database = await this.getDatabase();
    const transaction = database.transaction(
      ALL_STORE_NAMES as unknown as string[],
      "readwrite",
    );
    for (const storeName of ALL_STORE_NAMES)
      await transaction.objectStore(storeName).clear();
    await transaction.done;
    database.close();
    this.closed = true;
    this.database = null;
    await deleteDB(this.databaseName);
  }

  close(): void {
    this.closed = true;
    this.database?.close();
    this.database = null;
  }
}
