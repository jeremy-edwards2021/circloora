import { describe, expect, it } from "vitest";

import { selectRuntimeMode } from "@/lib/agents/runtime/mode";

describe("AE-MOCK-LIVE-PARITY mode boundary", () => {
  it("selects live only explicitly and never interprets errors as mock", () => {
    expect(selectRuntimeMode(undefined)).toBe("mock");
    expect(selectRuntimeMode("true")).toBe("mock");
    expect(selectRuntimeMode("false")).toBe("live");
    expect(selectRuntimeMode("FALSE")).toBe("mock");
  });
});
