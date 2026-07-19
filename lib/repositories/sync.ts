import type { EntityType } from "../schemas/primitives";
import type {
  MigrationManifest,
  SyncConflict,
  SyncOperation,
} from "../schemas/sync-portability";

export type SyncCursor = string & { readonly __brand: "SyncCursor" };

export type SyncStatus =
  | {
      state: "disabled";
      reason: "not_configured" | "not_signed_in" | "user_opted_out";
    }
  | { state: "idle"; pendingOperations: number; cursor: SyncCursor | null }
  | { state: "syncing"; pendingOperations: number; cursor: SyncCursor | null }
  | {
      state: "conflict";
      pendingOperations: number;
      conflicts: number;
      cursor: SyncCursor | null;
    }
  | {
      state: "error";
      pendingOperations: number;
      retryable: boolean;
      safeErrorCode: string;
      cursor: SyncCursor | null;
    };

export interface PushResult {
  acceptedOperationIds: string[];
  conflicts: SyncConflict[];
  remaining: number;
}

export interface PullResult {
  operations: SyncOperation[];
  cursor: SyncCursor;
  hasMore: boolean;
}

export interface UserConflictDecision {
  conflictId: string;
  choice: "keep_local" | "keep_remote" | "keep_both";
}

export interface ReconcileResult {
  conflictId: string;
  state: "resolved" | "quarantined";
  resolutionReason: string;
}

export interface SyncCoordinator {
  status(): Promise<SyncStatus>;
  push(limit: number, signal?: AbortSignal): Promise<PushResult>;
  pull(
    cursor: SyncCursor | null,
    limit: number,
    signal?: AbortSignal,
  ): Promise<PullResult>;
  reconcile(
    conflict: SyncConflict,
    decision?: UserConflictDecision,
  ): Promise<ReconcileResult>;
}

export class DisabledSyncCoordinator implements SyncCoordinator {
  constructor(
    private readonly reason: Extract<
      SyncStatus,
      { state: "disabled" }
    >["reason"] = "not_configured",
  ) {}

  async status(): Promise<SyncStatus> {
    return { state: "disabled", reason: this.reason };
  }

  async push(): Promise<PushResult> {
    throw new Error("CLOUD_SYNC_DISABLED");
  }

  async pull(): Promise<PullResult> {
    throw new Error("CLOUD_SYNC_DISABLED");
  }

  async reconcile(): Promise<ReconcileResult> {
    throw new Error("CLOUD_SYNC_DISABLED");
  }
}

export interface MigrationRecordCount {
  entityType: EntityType;
  localCount: number;
  cloudCount: number;
}

export interface MigrationPreview {
  manifest: MigrationManifest;
  counts: MigrationRecordCount[];
  conflicts: SyncConflict[];
  evidenceItemsRequiringConsent: number;
  localPrototypeCreditsMarkedUnverified: number;
  localDataPreservedUntilVerified: true;
}

export interface MigrationBatchStatus {
  batchId: string;
  state: "prepared" | "uploading" | "verifying" | "completed" | "failed";
  accepted: number;
  rejected: number;
  safeErrorCode?: string;
}

export interface LocalToCloudMigrationCoordinator {
  preview(signal?: AbortSignal): Promise<MigrationPreview>;
  begin(
    manifest: MigrationManifest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<MigrationBatchStatus>;
  resume(batchId: string, signal?: AbortSignal): Promise<MigrationBatchStatus>;
  verify(batchId: string, signal?: AbortSignal): Promise<MigrationBatchStatus>;
}
