import "server-only";

import { randomUUID } from "node:crypto";
import { RunState, Runner } from "@openai/agents";

import {
  createCirclooraOrchestrator,
  OrchestratorDirectiveSchema,
} from "../circloora-orchestrator";
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
import { AGENT_GRAPH_VERSION, PROMPT_BUNDLE_VERSION } from "../instructions";
import { assertNoForbiddenSnapshotData } from "../security/untrusted-content";
import {
  ApprovalEnvelopeSchema,
  assertApprovalCanResolve,
  canonicalDigest,
} from "../state/approval";
import {
  openRunState,
  sealRunState,
  SealedRunStateEnvelopeSchema,
} from "../state/sealed-run-state.server";
import { PublicEventFactory } from "./event-factory";
import { RunBudget, RunLimitError } from "./budget";
import type { RuntimeToolServices } from "./services";
import { RuntimeIntegrationUnavailableError } from "./services";
import {
  configureAgentsClient,
  type OpenAIConfig,
} from "@/lib/openai/config.server";
import { createAnalyzeVisualEvidenceTool } from "@/lib/tools/analyze-visual-evidence";
import { createEstimateRemainingValueTool } from "@/lib/tools/estimate-remaining-value";
import {
  createGenerateActionPacketTool,
  GenerateActionPacketInputSchema,
} from "@/lib/tools/generate-action-packet";
import { createOptimizeMovePlanTool } from "@/lib/tools/optimize-move-plan";
import { createRankNextLifePathwaysTool } from "@/lib/tools/rank-next-life-pathways";
import { createRequestAdditionalEvidenceTool } from "@/lib/tools/request-additional-evidence";
import { createSearchCurrentPathwaysTool } from "@/lib/tools/search-current-pathways";
import { createVerifyOutcomeTool } from "@/lib/tools/verify-outcome";

const MODEL_POLICY_VERSION = "environment-model-v1";

export class LiveAgentRuntime implements AgentRuntime {
  private readonly runner: Runner;

  constructor(
    private readonly config: OpenAIConfig,
    private readonly services: RuntimeToolServices,
    private readonly environment: NodeJS.ProcessEnv = process.env,
  ) {
    configureAgentsClient(config);
    this.runner = new Runner({
      tracingDisabled: false,
      traceIncludeSensitiveData: false,
      workflowName: "Circloora investigation",
    });
  }

  async *start(
    input: StartRunInput,
    request: TrustedRequestContext,
  ): AsyncIterable<PublicAgentEvent> {
    assertNoForbiddenSnapshotData(input.snapshot);
    const runId = randomUUID();
    const factory = new PublicEventFactory(
      runId,
      input.investigationId,
      request.now,
    );
    const budget = new RunBudget({}, request.now());
    budget.reserve("objects", input.confirmedObjectIds.length);
    yield factory.create("understanding_goal", {
      agent: "CirclooraOrchestrator",
      status: "in_progress",
      userActionRequired: false,
    });

    try {
      const { orchestrator } = this.buildGraph(budget);
      budget.reserve("modelTurns");
      const result = await this.runner.run(
        orchestrator,
        buildSafeRunInput(input),
        {
          maxTurns: budget.limits.modelTurns,
          signal: request.abortSignal,
        },
      );
      if (result.interruptions?.length) {
        await this.persistInterruption({ result, input, request, runId });
        yield factory.create("waiting_for_approval", {
          agent: "ActionAgent",
          status: "paused",
          userActionRequired: true,
          toolName: "generate_action_packet",
        });
        return;
      }
      yield* directiveEvents(
        OrchestratorDirectiveSchema.parse(result.finalOutput),
        factory,
      );
    } catch (error) {
      if (error instanceof RunLimitError) {
        yield factory.create("limit_reached", {
          agent: "CirclooraOrchestrator",
          status: "paused",
          userActionRequired: true,
        });
        return;
      }
      yield factory.create("failed", {
        agent: "CirclooraOrchestrator",
        status: "failed",
        userActionRequired: true,
      });
      throw error;
    }
  }

  async *resume(
    input: ResumeRunInput,
    request: TrustedRequestContext,
  ): AsyncIterable<PublicAgentEvent> {
    assertNoForbiddenSnapshotData(input.snapshot);
    const factory = new PublicEventFactory(
      input.runId,
      input.investigationId,
      request.now,
      input.lastEventSequence ?? 0,
    );
    const budget = new RunBudget({}, request.now());
    yield factory.create("inspecting_evidence", {
      agent: "ObjectIntelligenceAgent",
      status: "in_progress",
      userActionRequired: false,
      objectId: input.snapshot.activeObjectId,
      toolName: "analyze_visual_evidence",
    });
    const { orchestrator } = this.buildGraph(budget);
    budget.reserve("modelTurns");
    const result = await this.runner.run(
      orchestrator,
      buildSafeResumeInput(input),
      {
        maxTurns: budget.limits.modelTurns,
        signal: request.abortSignal,
      },
    );
    if (result.interruptions?.length) {
      await this.persistInterruption({
        result,
        input,
        request,
        runId: input.runId,
      });
      yield factory.create("waiting_for_approval", {
        agent: "ActionAgent",
        status: "paused",
        userActionRequired: true,
        toolName: "generate_action_packet",
      });
      return;
    }
    yield factory.create("revising", {
      agent: "CirclooraOrchestrator",
      status: "completed",
      userActionRequired: false,
    });
    yield* directiveEvents(
      OrchestratorDirectiveSchema.parse(result.finalOutput),
      factory,
    );
  }

  async *resolveApproval(
    input: ResolveApprovalInput,
    request: TrustedRequestContext,
  ): AsyncIterable<PublicAgentEvent> {
    if (!this.services.continuationStore)
      throw new RuntimeIntegrationUnavailableError(
        "approval continuation store",
      );
    const approval = ApprovalEnvelopeSchema.parse(
      await this.services.continuationStore.consumeApproval(input.approvalId),
    );
    assertApprovalCanResolve(approval, {
      principalBindingHash: request.principal.bindingHash,
      runId: input.runId,
      investigationId: input.investigationId,
      stateRevision: input.stateRevision,
      argumentDigest: input.approvalDigest,
      now: request.now(),
    });
    const key = readStateKey(this.environment);
    const sealed = SealedRunStateEnvelopeSchema.parse(
      JSON.parse(input.sealedRunState),
    );
    const serialized = openRunState(
      sealed,
      {
        principalBindingHash: request.principal.bindingHash,
        investigationId: input.investigationId,
        runId: input.runId,
        stateRevision: input.stateRevision,
        agentGraphVersion: AGENT_GRAPH_VERSION,
        now: request.now(),
      },
      key,
    );
    const budget = new RunBudget({}, request.now());
    const { orchestrator } = this.buildGraph(budget);
    const state = await RunState.fromString(orchestrator, serialized);
    const interruptions = state.getInterruptions();
    if (interruptions.length !== 1)
      throw new Error("Approval state must contain exactly one interruption");
    const interruption = interruptions[0];
    if (!interruption) throw new Error("Approval interruption is missing");
    const interruptionInput = extractToolInput(interruption);
    const parsedInput =
      GenerateActionPacketInputSchema.parse(interruptionInput);
    if (canonicalDigest(parsedInput) !== input.approvalDigest)
      throw new Error("Approval arguments changed");
    if (input.decision === "approved") state.approve(interruption);
    else state.reject(interruption);

    const factory = new PublicEventFactory(
      input.runId,
      input.investigationId,
      request.now,
    );
    const result = await this.runner.run(orchestrator, state, {
      maxTurns: budget.limits.modelTurns,
      signal: request.abortSignal,
    });
    if (result.interruptions?.length)
      throw new Error(
        "Resolved approval produced an unexpected new interruption",
      );
    if (input.decision === "rejected") {
      yield factory.create("paused", {
        agent: "CirclooraOrchestrator",
        status: "paused",
        userActionRequired: false,
      });
      return;
    }
    yield factory.create("preparing_mission", {
      agent: "ActionAgent",
      status: "completed",
      userActionRequired: false,
      toolName: "generate_action_packet",
    });
    yield* directiveEvents(
      OrchestratorDirectiveSchema.parse(result.finalOutput),
      factory,
    );
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

  private buildGraph(budget: RunBudget) {
    const tools = {
      analyzeVisualEvidence: createAnalyzeVisualEvidenceTool(
        this.services.analyzeVisualEvidence,
        budget,
      ),
      requestAdditionalEvidence: createRequestAdditionalEvidenceTool(budget),
      searchCurrentPathways: createSearchCurrentPathwaysTool(
        this.services.searchCurrentPathways,
        budget,
      ),
      estimateRemainingValue: createEstimateRemainingValueTool(
        this.services.estimateRemainingValue,
        budget,
      ),
      rankNextLifePathways: createRankNextLifePathwaysTool(
        this.services.rankNextLifePathways,
        budget,
      ),
      generateActionPacket: createGenerateActionPacketTool(
        this.services.generateActionPacket,
        budget,
      ),
      optimizeMovePlan: createOptimizeMovePlanTool(
        this.services.optimizeMovePlan,
        budget,
      ),
      verifyOutcome: createVerifyOutcomeTool(
        this.services.verificationPipeline,
        budget,
      ),
    };
    return {
      orchestrator: createCirclooraOrchestrator(this.config.model, tools),
      tools,
    };
  }

  private async persistInterruption(args: {
    result: { interruptions?: unknown[]; state: { toString(): string } };
    input: StartRunInput | ResumeRunInput;
    request: TrustedRequestContext;
    runId: string;
  }): Promise<void> {
    if (!this.services.continuationStore)
      throw new RuntimeIntegrationUnavailableError(
        "approval continuation store",
      );
    const interruption = args.result.interruptions?.[0];
    if (!interruption || args.result.interruptions?.length !== 1) {
      throw new Error("Only one exact-scope approval may be pending");
    }
    const parsedInput = GenerateActionPacketInputSchema.parse(
      extractToolInput(interruption),
    );
    const argumentDigest = canonicalDigest(parsedInput);
    const requestedAt = args.request.now();
    const expiresAt = new Date(requestedAt.getTime() + 15 * 60_000);
    const approval = ApprovalEnvelopeSchema.parse({
      approvalId: randomUUID(),
      runId: args.runId,
      investigationId: args.input.investigationId,
      stateRevision: args.input.snapshot.stateRevision,
      principalBindingHash: args.request.principal.bindingHash,
      toolName: "generate_action_packet",
      argumentDigest,
      exactScope: parsedInput.approvedScope,
      requestedAt: requestedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    const sealedState = sealRunState(
      args.result.state.toString(),
      {
        envelopeVersion: "circloora-run-state-v1",
        investigationId: args.input.investigationId,
        runId: args.runId,
        stateRevision: args.input.snapshot.stateRevision,
        agentGraphVersion: AGENT_GRAPH_VERSION,
        sdkVersion:
          this.environment.OPENAI_AGENTS_SDK_VERSION?.trim() || "package-lock",
        promptBundleVersion: PROMPT_BUNDLE_VERSION,
        modelPolicyVersion: MODEL_POLICY_VERSION,
        createdAt: requestedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        principalBindingHash: args.request.principal.bindingHash,
      },
      readStateKey(this.environment),
    );
    await this.services.continuationStore.save({
      runId: args.runId,
      investigationId: args.input.investigationId,
      approval,
      sealedState,
    });
  }
}

function buildSafeRunInput(input: StartRunInput): string {
  return JSON.stringify({
    task: "Start this Circloora investigation.",
    investigationId: input.investigationId,
    goalEvidence: input.goal,
    mode: input.mode,
    confirmedObjectIds: input.confirmedObjectIds,
    deadline: input.deadline,
    approximateArea: input.approximateArea,
    preferenceMode: input.preferenceMode,
    snapshot: input.snapshot,
  });
}

function buildSafeResumeInput(input: ResumeRunInput): string {
  return JSON.stringify({
    task: "Resume this investigation as a new evidence turn and explain any changed recommendation.",
    investigationId: input.investigationId,
    stateRevision: input.stateRevision,
    evidenceRequestId: input.evidenceRequestId,
    evidenceIds: input.evidenceIds,
    userAnswerEvidence: input.userAnswer,
    snapshot: input.snapshot,
  });
}

async function* directiveEvents(
  directive: ReturnType<typeof OrchestratorDirectiveSchema.parse>,
  factory: PublicEventFactory,
): AsyncIterable<PublicAgentEvent> {
  if (directive.status === "awaiting_evidence") {
    yield factory.create("requesting_evidence", {
      agent: "ObjectIntelligenceAgent",
      status: "paused",
      userActionRequired: true,
      toolName: "request_additional_evidence",
    });
    yield factory.create("paused", {
      agent: "CirclooraOrchestrator",
      status: "paused",
      userActionRequired: true,
    });
  } else if (directive.status === "awaiting_approval") {
    yield factory.create("waiting_for_approval", {
      agent: "ActionAgent",
      status: "paused",
      userActionRequired: true,
      toolName: "generate_action_packet",
    });
  } else if (directive.status === "limit_reached") {
    yield factory.create("limit_reached", {
      agent: "CirclooraOrchestrator",
      status: "paused",
      userActionRequired: true,
    });
  } else if (directive.status === "blocked") {
    yield factory.create("failed", {
      agent: "CirclooraOrchestrator",
      status: "failed",
      userActionRequired: true,
    });
  } else if (directive.status === "cancelled") {
    yield factory.create("paused", {
      agent: "CirclooraOrchestrator",
      status: "paused",
      userActionRequired: false,
    });
  } else {
    yield factory.create("verifying", {
      agent: "VerificationAgent",
      status: "completed",
      userActionRequired: false,
      toolName: "verify_outcome",
    });
    yield factory.create("completed", {
      agent: "CirclooraOrchestrator",
      status: "completed",
      userActionRequired: false,
    });
  }
}

function extractToolInput(interruption: unknown): unknown {
  const record = interruption as {
    rawItem?: { arguments?: string | Record<string, unknown> };
    toolCall?: { arguments?: string | Record<string, unknown> };
    arguments?: string | Record<string, unknown>;
  };
  const raw =
    record.rawItem?.arguments ?? record.toolCall?.arguments ?? record.arguments;
  if (!raw) throw new Error("Approval interruption has no tool arguments");
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

function readStateKey(environment: NodeJS.ProcessEnv): Buffer {
  const encoded = environment.AGENT_STATE_ENCRYPTION_KEY?.trim();
  if (!encoded)
    throw new Error(
      "AGENT_STATE_ENCRYPTION_KEY is required for approval continuation",
    );
  const key = Buffer.from(encoded, "base64");
  if (key.byteLength !== 32)
    throw new Error("AGENT_STATE_ENCRYPTION_KEY must be base64 for 32 bytes");
  return key;
}
