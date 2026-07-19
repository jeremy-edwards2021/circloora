import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  PublicAgentEventSchema,
  publicSummary,
} from "@/lib/agents/contracts/public-events";
import { PublicEventFactory } from "@/lib/agents/runtime/event-factory";

describe("UT-EVENT-001 public event boundary", () => {
  it("uses concise templates and monotonic sequences", () => {
    const factory = new PublicEventFactory(
      randomUUID(),
      randomUUID(),
      () => new Date("2026-07-18T12:00:00.000Z"),
    );
    const first = factory.create("checking_sources", {
      agent: "LocalPathwayAgent",
      status: "in_progress",
      userActionRequired: false,
      toolName: "search_current_pathways",
    });
    const second = factory.create("ranking", {
      agent: "CircularPathwayAgent",
      status: "completed",
      userActionRequired: false,
    });
    expect([first.sequence, second.sequence]).toEqual([1, 2]);
    expect(first.summary).toBe("Checking current local pathways");
    expect(first.summary.length).toBeLessThanOrEqual(160);
  });

  it("rejects raw prompts, reasoning, payloads, and arbitrary summaries", () => {
    const raw = {
      eventId: randomUUID(),
      sequence: 1,
      timestamp: "2026-07-18T12:00:00.000Z",
      runId: randomUUID(),
      investigationId: randomUUID(),
      agent: "CirclooraOrchestrator",
      eventType: "completed",
      summary: publicSummary("completed"),
      status: "completed",
      userActionRequired: false,
      reasoning: "private chain of thought",
    };
    expect(PublicAgentEventSchema.safeParse(raw).success).toBe(false);
  });
});
