import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  ApprovalEnvelopeSchema,
  assertApprovalCanResolve,
  canonicalDigest,
} from "@/lib/agents/state/approval";

describe("UT-APPROVAL-001 exact approval binding", () => {
  it("binds principal, run, revision, arguments, and expiry", () => {
    const argumentsValue = {
      pathway: "repair",
      approvedScope: "Draft a repair inquiry",
    };
    const expected = {
      principalBindingHash: "a".repeat(64),
      runId: randomUUID(),
      investigationId: randomUUID(),
      stateRevision: 3,
      argumentDigest: canonicalDigest(argumentsValue),
      now: new Date("2026-07-18T12:00:00.000Z"),
    };
    const approval = ApprovalEnvelopeSchema.parse({
      approvalId: randomUUID(),
      runId: expected.runId,
      investigationId: expected.investigationId,
      stateRevision: expected.stateRevision,
      principalBindingHash: expected.principalBindingHash,
      toolName: "generate_action_packet",
      argumentDigest: expected.argumentDigest,
      exactScope: "Draft a repair inquiry",
      requestedAt: "2026-07-18T11:59:00.000Z",
      expiresAt: "2026-07-18T12:15:00.000Z",
    });
    expect(() => assertApprovalCanResolve(approval, expected)).not.toThrow();
    expect(() =>
      assertApprovalCanResolve(approval, { ...expected, stateRevision: 4 }),
    ).toThrow();
    expect(() =>
      assertApprovalCanResolve(approval, {
        ...expected,
        argumentDigest: canonicalDigest({
          ...argumentsValue,
          pathway: "resell",
        }),
      }),
    ).toThrow();
    expect(() =>
      assertApprovalCanResolve(approval, {
        ...expected,
        now: new Date("2026-07-18T12:16:00.000Z"),
      }),
    ).toThrow();
  });
});
