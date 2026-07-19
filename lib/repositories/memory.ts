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

function clone<Value>(value: Value): Value {
  return structuredClone(value);
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
    // The stable validation error below avoids leaking parser details.
  }
  throw new Error("INVALID_REPOSITORY_CURSOR");
}

export class MemoryCirclooraRepository implements CirclooraRepository {
  private records = new Map<EntityType, Map<string, DomainEntity>>();
  private tombstones: Tombstone[] = [];
  private closed = false;

  constructor(readonly scope: OwnerScope) {
    for (const type of EntityTypeSchema.options)
      this.records.set(type, new Map());
  }

  private assertOpen() {
    if (this.closed) throw new Error("REPOSITORY_CLOSED");
  }

  entity<Type extends EntityType>(
    type: Type,
  ): EntityRepository<DomainEntityMap[Type]> {
    const store = this.records.get(type);
    if (!store) throw new Error("UNKNOWN_ENTITY_TYPE");
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
        this.assertOpen();
        const value = store.get(id) as DomainEntityMap[Type] | undefined;
        if (!value || (value.deletedAt && !options?.includeDeleted))
          return null;
        return clone(parseDomainEntity(type, value));
      },
      list: async (query: QuerySpec = {}) => {
        this.assertOpen();
        const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
        const sortBy = query.sortBy ?? "updatedAt";
        const direction = query.direction ?? "desc";
        const cursor = decodeCursor(query.cursor);
        const items = [...store.values()]
          .map((value) => parseDomainEntity(type, value))
          .filter((value) => query.includeDeleted || !value.deletedAt)
          .filter(
            (value) =>
              !query.ownerScope ||
              ownerKey(value.ownerScope) === ownerKey(query.ownerScope),
          )
          .sort((left, right) => {
            const leftValue = String(left[sortBy]);
            const rightValue = String(right[sortBy]);
            const compared =
              leftValue.localeCompare(rightValue) ||
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
        const pageItems = items.slice(0, limit).map(clone);
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
        this.assertOpen();
        const entity = parseDomainEntity(type, input);
        const existing = store.get(entity.id) as
          DomainEntityMap[Type] | undefined;
        if (existing) {
          return {
            ok: false,
            conflict: {
              code: "ALREADY_EXISTS",
              expectedVersion: entity.version,
              actualVersion: existing.version,
              current: clone(existing),
            },
          };
        }
        const authority = authorityConflict(options, null, entity.version);
        if (authority) return authority;
        if (ownerKey(entity.ownerScope) !== ownerKey(this.scope))
          throw new Error("OWNER_SCOPE_MISMATCH");
        store.set(entity.id, clone(entity));
        return { ok: true, entity: clone(entity), replayed: false };
      },
      update: async (
        id,
        patch: DomainPatch<DomainEntityMap[Type]>,
        options,
      ) => {
        this.assertOpen();
        const current = store.get(id) as DomainEntityMap[Type] | undefined;
        const authority = authorityConflict(
          options,
          current ?? null,
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
              current: current ? clone(current) : null,
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
              current: current ? clone(current) : null,
            },
          };
        }
        const next = parseDomainEntity(type, {
          ...current,
          ...patch,
          id,
          version: current.version + 1,
        });
        store.set(id, clone(next));
        return { ok: true, entity: clone(next), replayed: false };
      },
      delete: async (id, options) => {
        this.assertOpen();
        const current = store.get(id) as DomainEntityMap[Type] | undefined;
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
        store.delete(id);
        this.tombstones.push(tombstone);
        return { ok: true, entity: clone(tombstone), replayed: false };
      },
    };
  }

  async transaction<Result>(
    work: (repositories: RepositorySet) => Promise<Result>,
  ): Promise<Result> {
    this.assertOpen();
    const beforeRecords = clone(this.records);
    const beforeTombstones = clone(this.tombstones);
    try {
      return await work(this);
    } catch (error) {
      this.records = beforeRecords;
      this.tombstones = beforeTombstones;
      throw error;
    }
  }

  async snapshot(): Promise<LocalSnapshot> {
    this.assertOpen();
    const records: LocalSnapshot["records"] = [];
    for (const type of EntityTypeSchema.options) {
      for (const data of this.records.get(type)?.values() ?? [])
        records.push({ entityType: type, data: clone(data) });
    }
    return { records, tombstones: clone(this.tombstones) };
  }

  async importRecords(
    records: LocalSnapshot["records"],
    strategy: "merge" | "replace_local",
  ): Promise<void> {
    this.assertOpen();
    const validated = records.map((record) => ({
      entityType: record.entityType,
      data: parseDomainEntity(record.entityType, record.data),
    }));
    if (strategy === "replace_local")
      for (const store of this.records.values()) store.clear();
    for (const record of validated) {
      if (ownerKey(record.data.ownerScope) !== ownerKey(this.scope))
        throw new Error("OWNER_SCOPE_MISMATCH");
      const store = this.records.get(record.entityType);
      const existing = store?.get(record.data.id);
      if (!existing || record.data.version > existing.version)
        store?.set(record.data.id, clone(record.data));
    }
  }

  async export() {
    return createExportEnvelope(await this.snapshot(), this.scope);
  }

  async import(payload: unknown): Promise<void> {
    await importEnvelope(this, payload, "merge");
  }

  async clear(): Promise<void> {
    for (const store of this.records.values()) store.clear();
    this.tombstones = [];
  }

  close(): void {
    this.closed = true;
  }
}
