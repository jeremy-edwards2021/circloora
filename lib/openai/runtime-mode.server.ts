import "server-only";

import type { RuntimeMode } from "@/lib/agents/contracts/runtime";
import { selectRuntimeMode } from "@/lib/agents/runtime/mode";

export function runtimeMode(
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeMode {
  return selectRuntimeMode(environment.MOCK_AI);
}
