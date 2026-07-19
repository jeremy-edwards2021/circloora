import { randomUUID } from "node:crypto";

import type {
  AgentRuntime,
  CancelRunInput,
  CancelRunResult,
  ResolveApprovalInput,
  ResumeRunInput,
  StartRunInput,
  TrustedRequestContext,
} from "../contracts/runtime";
import type { PublicAgentEvent } from "../contracts/public-events";
import { assertNoForbiddenSnapshotData } from "../security/untrusted-content";
import { PublicEventFactory } from "./event-factory";
import { RunBudget } from "./budget";
import { getMockFixture } from "@/lib/mock/fixtures";

export class MockAgentRuntime implements AgentRuntime {
  async *start(
    input: StartRunInput,
    request: TrustedRequestContext,
  ): AsyncIterable<PublicAgentEvent> {
    assertNoForbiddenSnapshotData(input.snapshot);
    const budget = new RunBudget({}, request.now());
    budget.reserve("objects", input.confirmedObjectIds.length);
    const runId = randomUUID();
    const fixture = getMockFixture(input.fixtureId);
    const factory = new PublicEventFactory(
      runId,
      input.investigationId,
      request.now,
    );
    for (const eventType of fixture.firstTurn) {
      throwIfAborted(request.abortSignal);
      yield factory.create(eventType, {
        agent: agentFor(eventType),
        status: statusFor(eventType),
        userActionRequired: [
          "requesting_evidence",
          "waiting_for_approval",
          "paused",
        ].includes(eventType),
      });
    }
  }

  async *resume(
    input: ResumeRunInput,
    request: TrustedRequestContext,
  ): AsyncIterable<PublicAgentEvent> {
    assertNoForbiddenSnapshotData(input.snapshot);
    const fixtureId =
      typeof input.snapshot.fixtureId === "string"
        ? input.snapshot.fixtureId
        : undefined;
    const fixture = getMockFixture(fixtureId);
    const factory = new PublicEventFactory(
      input.runId,
      input.investigationId,
      request.now,
      input.lastEventSequence ?? 0,
    );
    for (const eventType of fixture.resumeTurn.length
      ? fixture.resumeTurn
      : (["verifying", "completed"] as const)) {
      throwIfAborted(request.abortSignal);
      yield factory.create(eventType, {
        agent: agentFor(eventType),
        status: statusFor(eventType),
        userActionRequired: false,
      });
    }
  }

  async *resolveApproval(
    input: ResolveApprovalInput,
    request: TrustedRequestContext,
  ): AsyncIterable<PublicAgentEvent> {
    const factory = new PublicEventFactory(
      input.runId,
      input.investigationId,
      request.now,
    );
    if (input.decision === "rejected") {
      yield factory.create("paused", {
        agent: "CirclooraOrchestrator",
        status: "paused",
        userActionRequired: false,
      });
      return;
    }
    for (const eventType of [
      "preparing_mission",
      "mission_ready",
      "completed",
    ] as const) {
      yield factory.create(eventType, {
        agent:
          eventType === "preparing_mission"
            ? "ActionAgent"
            : "CirclooraOrchestrator",
        status: "completed",
        userActionRequired: false,
      });
    }
  }

  async cancel(
    input: CancelRunInput,
    request: TrustedRequestContext,
  ): Promise<CancelRunResult> {
    return {
      runId: input.runId,
      investigationId: input.investigationId,
      status: "cancelled",
      cancelledAt: request.now().toISOString(),
    };
  }
}

function agentFor(eventType: string): PublicAgentEvent["agent"] {
  if (
    eventType === "inspecting_evidence" ||
    eventType === "requesting_evidence"
  )
    return "ObjectIntelligenceAgent";
  if (eventType === "checking_sources") return "LocalPathwayAgent";
  if (eventType === "comparing_pathways" || eventType === "ranking")
    return "CircularPathwayAgent";
  if (eventType === "verifying") return "VerificationAgent";
  if (eventType === "preparing_mission") return "ActionAgent";
  return "CirclooraOrchestrator";
}

function statusFor(eventType: string): PublicAgentEvent["status"] {
  if (
    eventType === "paused" ||
    eventType === "requesting_evidence" ||
    eventType === "waiting_for_approval"
  )
    return "paused";
  if (eventType === "failed") return "failed";
  if (["completed", "mission_ready"].includes(eventType)) return "completed";
  return "in_progress";
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted)
    throw signal.reason ?? new DOMException("Aborted", "AbortError");
}
