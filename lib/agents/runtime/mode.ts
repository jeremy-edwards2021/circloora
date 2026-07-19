import type { RuntimeMode } from "../contracts/runtime";

/** Exact mode selection: live errors never switch this decision to mock. */
export function selectRuntimeMode(mockAi: string | undefined): RuntimeMode {
  return mockAi === "false" ? "live" : "mock";
}
