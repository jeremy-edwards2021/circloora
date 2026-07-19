import { z } from "zod";

import type { CanonicalInvestigationSnapshotAdapter } from "./domain-adapter";
import type { PublicAgentEvent } from "./public-events";

const uuid = z.string().uuid();

export const StartRunInputSchema = z
  .object({
    investigationId: uuid,
    snapshot: z.unknown(),
    goal: z.string().min(1).max(2_000),
    mode: z.enum(["single", "move"]),
    confirmedObjectIds: z.array(uuid).min(1).max(8),
    deadline: z.string().datetime({ offset: true }).optional(),
    approximateArea: z.string().min(1).max(120).optional(),
    preferenceMode: z
      .enum([
        "balanced",
        "maximize_money",
        "minimize_waste",
        "finish_fastest",
        "minimize_travel",
        "minimize_effort",
      ])
      .default("balanced"),
    fixtureId: z.string().min(1).max(80).optional(),
  })
  .strict();

export const ResumeRunInputSchema = z
  .object({
    investigationId: uuid,
    runId: uuid,
    snapshot: z.unknown(),
    stateRevision: z.number().int().nonnegative(),
    evidenceRequestId: uuid.optional(),
    evidenceIds: z.array(uuid).max(4).default([]),
    userAnswer: z.string().max(2_000).optional(),
    lastEventSequence: z.number().int().nonnegative().optional(),
  })
  .strict();

export const ResolveApprovalInputSchema = z
  .object({
    investigationId: uuid,
    runId: uuid,
    approvalId: uuid,
    stateRevision: z.number().int().nonnegative(),
    approvalDigest: z.string().regex(/^[a-f0-9]{64}$/),
    sealedRunState: z.string().min(32).max(1_500_000),
    decision: z.enum(["approved", "rejected"]),
  })
  .strict();

export const CancelRunInputSchema = z
  .object({
    investigationId: uuid,
    runId: uuid,
    reason: z
      .enum(["user_cancelled", "superseded", "navigation_away"])
      .default("user_cancelled"),
  })
  .strict();

export type StartRunInput = z.infer<typeof StartRunInputSchema> & {
  snapshot: CanonicalInvestigationSnapshotAdapter;
};
export type ResumeRunInput = z.infer<typeof ResumeRunInputSchema> & {
  snapshot: CanonicalInvestigationSnapshotAdapter;
};
export type ResolveApprovalInput = z.infer<typeof ResolveApprovalInputSchema>;
export type CancelRunInput = z.infer<typeof CancelRunInputSchema>;

export interface RunPrincipal {
  kind: "anonymous" | "account";
  bindingHash: string;
}

export interface TrustedRequestContext {
  requestId: string;
  principal: RunPrincipal;
  abortSignal: AbortSignal;
  now(): Date;
}

export interface CancelRunResult {
  runId: string;
  investigationId: string;
  status: "cancelled" | "already_terminal";
  cancelledAt: string;
}

export interface AgentRuntime {
  start(
    input: StartRunInput,
    request: TrustedRequestContext,
  ): AsyncIterable<PublicAgentEvent>;
  resume(
    input: ResumeRunInput,
    request: TrustedRequestContext,
  ): AsyncIterable<PublicAgentEvent>;
  resolveApproval(
    input: ResolveApprovalInput,
    request: TrustedRequestContext,
  ): AsyncIterable<PublicAgentEvent>;
  cancel(
    input: CancelRunInput,
    request: TrustedRequestContext,
  ): Promise<CancelRunResult>;
}

export type RuntimeMode = "mock" | "live";
