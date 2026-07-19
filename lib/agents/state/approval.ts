import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const ApprovalEnvelopeSchema = z
  .object({
    approvalId: z.string().uuid(),
    runId: z.string().uuid(),
    investigationId: z.string().uuid(),
    stateRevision: z.number().int().nonnegative(),
    principalBindingHash: z.string().min(32).max(128),
    toolName: z.literal("generate_action_packet"),
    argumentDigest: z.string().regex(/^[a-f0-9]{64}$/),
    exactScope: z.string().min(1).max(800),
    requestedAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
    resolvedAt: z.string().datetime({ offset: true }).optional(),
    decision: z.enum(["approved", "rejected"]).optional(),
  })
  .strict();

export type ApprovalEnvelope = z.infer<typeof ApprovalEnvelopeSchema>;

export function canonicalDigest(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function assertApprovalCanResolve(
  approval: ApprovalEnvelope,
  expected: {
    principalBindingHash: string;
    runId: string;
    investigationId: string;
    stateRevision: number;
    argumentDigest: string;
    now: Date;
  },
): void {
  if (approval.resolvedAt || approval.decision)
    throw new Error("Approval already resolved");
  if (Date.parse(approval.expiresAt) <= expected.now.getTime())
    throw new Error("Approval expired");
  if (
    approval.runId !== expected.runId ||
    approval.investigationId !== expected.investigationId ||
    approval.stateRevision !== expected.stateRevision
  ) {
    throw new Error("Approval state binding mismatch");
  }
  safeEqual(
    approval.principalBindingHash,
    expected.principalBindingHash,
    "principal",
  );
  safeEqual(approval.argumentDigest, expected.argumentDigest, "arguments");
}

function safeEqual(left: string, right: string, label: string): void {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error(`Approval ${label} binding mismatch`);
  }
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
    .join(",")}}`;
}
