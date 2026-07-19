import { describe, expect, it } from "vitest";

import { RunBudget, RunLimitError } from "@/lib/agents/runtime/budget";

describe("UT-BUDGET-001 RunBudget", () => {
  it("stops exactly after the documented turn and tool limits", () => {
    const budget = new RunBudget();
    for (let index = 0; index < 8; index += 1) budget.reserve("modelTurns");
    for (let index = 0; index < 12; index += 1) budget.reserve("toolCalls");
    expect(() => budget.reserve("modelTurns")).toThrowError(RunLimitError);
    expect(() => budget.reserve("toolCalls")).toThrowError(RunLimitError);
    expect(budget.snapshot().used).toMatchObject({
      modelTurns: 8,
      toolCalls: 12,
    });
  });

  it("enforces object, image, and retry limits", () => {
    const budget = new RunBudget();
    budget.reserve("objects", 8);
    budget.reserve("imagesPerObject", 4);
    budget.reserve("retriesPerTool", 2);
    expect(() => budget.reserve("objects")).toThrow();
    expect(() => budget.reserve("imagesPerObject")).toThrow();
    expect(() => budget.reserve("retriesPerTool")).toThrow();
  });
});
