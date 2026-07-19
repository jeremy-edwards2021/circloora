/**
 * Temporary type-only seam for the canonical `@/lib/schemas` package.
 *
 * This module deliberately performs no validation. Runtime validation must be
 * reconciled to the canonical Zod exports listed in
 * `docs/integration/runtime-schema-reconciliation.md` after the data branch is
 * merged.
 */

export type InvestigationStatus =
  | "draft"
  | "inventory_review"
  | "investigating"
  | "awaiting_evidence"
  | "evaluating_pathways"
  | "awaiting_approval"
  | "action_ready"
  | "awaiting_verification"
  | "completed"
  | "blocked"
  | "cancelled";

export interface CanonicalInvestigationSnapshotAdapter {
  schemaVersion: string;
  investigationId: string;
  stateRevision: number;
  status: InvestigationStatus;
  updatedAt: string;
  activeObjectId?: string;
  unresolvedEvidenceRequestId?: string;
  pendingApprovalId?: string;
  [key: string]: unknown;
}

export interface CanonicalEvidenceRefAdapter {
  evidenceId: string;
  kind: string;
  sha256: string;
  capturedAt: string;
  retentionPolicy: string;
}

export interface CanonicalSourceRefAdapter {
  sourceId: string;
  url: string;
  title: string;
  publisher: string;
  retrievedAt: string;
  isMock: boolean;
}
