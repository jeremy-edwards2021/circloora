import "server-only";

import type {
  AgentRuntime,
  CancelRunInput,
  ResolveApprovalInput,
  ResumeRunInput,
  StartRunInput,
  TrustedRequestContext,
} from "../contracts/runtime";
import { LiveAgentRuntime } from "./live-runtime.server";
import { MockAgentRuntime } from "./mock-runtime";
import type { RuntimeToolServices } from "./services";
import { unavailableLiveServices } from "./services";
import { readOpenAIConfig } from "@/lib/openai/config.server";
import { runtimeMode } from "@/lib/openai/runtime-mode.server";

export class AgentRuntimeFacade implements AgentRuntime {
  constructor(
    readonly mode: "mock" | "live",
    private readonly runtime: AgentRuntime,
  ) {}

  start(input: StartRunInput, request: TrustedRequestContext) {
    return this.runtime.start(input, request);
  }

  resume(input: ResumeRunInput, request: TrustedRequestContext) {
    return this.runtime.resume(input, request);
  }

  resolveApproval(input: ResolveApprovalInput, request: TrustedRequestContext) {
    return this.runtime.resolveApproval(input, request);
  }

  cancel(input: CancelRunInput, request: TrustedRequestContext) {
    return this.runtime.cancel(input, request);
  }
}

export function createRuntimeFacade(
  environment: NodeJS.ProcessEnv = process.env,
  liveServices: RuntimeToolServices = unavailableLiveServices(),
): AgentRuntimeFacade {
  const mode = runtimeMode(environment);
  if (mode === "mock")
    return new AgentRuntimeFacade("mock", new MockAgentRuntime());
  if (environment.AGENT_RATE_LIMIT_READY !== "true") {
    throw new Error(
      "Live OpenAI is disabled until a distributed rate limiter is configured.",
    );
  }
  return new AgentRuntimeFacade(
    "live",
    new LiveAgentRuntime(
      readOpenAIConfig(environment),
      liveServices,
      environment,
    ),
  );
}
