import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { MockAgentRuntime } from "@/lib/agents/runtime/mock-runtime";
import { getMockFixture } from "@/lib/mock/fixtures";

const investigationId = randomUUID();
const objectId = randomUUID();

const context = {
  requestId: randomUUID(),
  principal: { kind: "anonymous" as const, bindingHash: "a".repeat(64) },
  abortSignal: new AbortController().signal,
  now: () => new Date("2026-07-18T12:00:00.000Z"),
};

function snapshot(fixtureId: string, status = "investigating") {
  return {
    schemaVersion: "1",
    investigationId,
    stateRevision: 1,
    status: status as "investigating",
    updatedAt: "2026-07-18T12:00:00.000Z",
    activeObjectId: objectId,
    fixtureId,
  };
}

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const values: T[] = [];
  for await (const value of iterable) values.push(value);
  return values;
}

describe("mock agent runtime", () => {
  it("pauses and resumes the same monitor investigation with a revision", async () => {
    const runtime = new MockAgentRuntime();
    const started = await collect(
      runtime.start(
        {
          investigationId,
          snapshot: snapshot("FX-MON-WORK-01"),
          goal: "Find the monitor's best next life",
          mode: "single",
          confirmedObjectIds: [objectId],
          preferenceMode: "balanced",
          fixtureId: "FX-MON-WORK-01",
        },
        context,
      ),
    );
    expect(started.map((event) => event.eventType)).toContain(
      "requesting_evidence",
    );
    expect(started.at(-1)?.status).toBe("paused");
    const runId = started[0]?.runId;
    expect(runId).toBeDefined();

    const resumed = await collect(
      runtime.resume(
        {
          investigationId,
          runId: runId!,
          snapshot: snapshot("FX-MON-WORK-01"),
          stateRevision: 1,
          evidenceIds: [randomUUID()],
        },
        context,
      ),
    );
    expect(resumed.map((event) => event.eventType)).toEqual(
      expect.arrayContaining(["revising", "ranking", "verifying", "completed"]),
    );
    expect(
      resumed.every((event) => event.investigationId === investigationId),
    ).toBe(true);
  });

  it("uses category-specific tool paths and a safety-only battery path", () => {
    const monitor = getMockFixture("FX-MON-WORK-01");
    const chair = getMockFixture("FX-CHAIR-WOOD-01");
    const coat = getMockFixture("FX-COAT-BRAND-01");
    const battery = getMockFixture("FX-BAT-SWELL-01");
    expect(
      new Set([
        monitor.expectedToolPath.join(","),
        chair.expectedToolPath.join(","),
        coat.expectedToolPath.join(","),
      ]).size,
    ).toBe(3);
    expect(chair.expectedToolPath).not.toContain("search_current_pathways");
    expect(battery.safetyFlags).toContain("swollen_battery");
    expect(battery.forbiddenTools).toContain("estimate_remaining_value");
    expect(battery.recommendation).toBe("special_handling");
  });

  it("demonstrates no-source and room-plan behavior without invention", () => {
    const noSource = getMockFixture("FX-NOSOURCE-01");
    const room = getMockFixture("FX-ROOM-07-01");
    expect(noSource.noVerifiedSource).toBe(true);
    expect(noSource.mockSources).toHaveLength(0);
    expect(room.expectedToolPath).toContain("optimize_move_plan");
    expect(
      room.mockSources.every(
        (source) => source.isMock && source.url.includes("example.invalid"),
      ),
    ).toBe(true);
  });
});
