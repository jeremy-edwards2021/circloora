import { Agent } from "@openai/agents";
import { z } from "zod";

import { instructions } from "./instructions";
import { createSpecialists, type SpecialistToolset } from "./specialists";

export const OrchestratorDirectiveSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("completed"),
      resultId: z.string().uuid(),
      verificationDecision: z.string().min(1).max(120),
    })
    .strict(),
  z
    .object({
      status: z.literal("awaiting_evidence"),
      evidenceRequestId: z.string().uuid(),
      safeInstructions: z.string().min(1).max(500),
    })
    .strict(),
  z
    .object({
      status: z.literal("awaiting_approval"),
      approvalId: z.string().uuid(),
      actionSummary: z.string().min(1).max(400),
      exactScopeDigest: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  z
    .object({
      status: z.literal("limit_reached"),
      limitKind: z.enum([
        "objects",
        "imagesPerObject",
        "modelTurns",
        "toolCalls",
        "retriesPerTool",
      ]),
      completedWork: z.string().max(600),
      nextStep: z.string().min(1).max(400),
    })
    .strict(),
  z
    .object({
      status: z.literal("blocked"),
      reasonCode: z.string().min(1).max(120),
      safeNextStep: z.string().min(1).max(400),
    })
    .strict(),
  z
    .object({
      status: z.literal("cancelled"),
      cancelledAt: z.string().datetime({ offset: true }),
    })
    .strict(),
]);

const OrchestratorModelOutputSchema = z
  .object({
    status: z.enum([
      "completed",
      "awaiting_evidence",
      "awaiting_approval",
      "limit_reached",
      "blocked",
      "cancelled",
    ]),
    resultId: z.string().uuid().optional(),
    verificationDecision: z.string().min(1).max(120).optional(),
    evidenceRequestId: z.string().uuid().optional(),
    safeInstructions: z.string().min(1).max(500).optional(),
    approvalId: z.string().uuid().optional(),
    actionSummary: z.string().min(1).max(400).optional(),
    exactScopeDigest: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    limitKind: z
      .enum([
        "objects",
        "imagesPerObject",
        "modelTurns",
        "toolCalls",
        "retriesPerTool",
      ])
      .optional(),
    completedWork: z.string().max(600).optional(),
    nextStep: z.string().min(1).max(400).optional(),
    reasonCode: z.string().min(1).max(120).optional(),
    safeNextStep: z.string().min(1).max(400).optional(),
    cancelledAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export interface OrchestratorToolset extends SpecialistToolset {
  requestAdditionalEvidence: unknown;
  rankNextLifePathways: unknown;
  optimizeMovePlan: unknown;
}

export function createCirclooraOrchestrator(
  model: string,
  tools: OrchestratorToolset,
) {
  const specialists = createSpecialists(model, tools);
  return new Agent({
    name: "CirclooraOrchestrator",
    model,
    instructions: instructions.orchestrator,
    tools: [
      specialists.objectIntelligence.asTool({
        toolName: "inspect_object",
        toolDescription:
          "Inspect confirmed evidence for one object when identity, condition, or safety is unresolved.",
      }),
      specialists.circularPathway.asTool({
        toolName: "propose_circular_pathways",
        toolDescription:
          "Propose relevant competing pathways and disqualifiers without assigning final scores.",
      }),
      specialists.localPathway.asTool({
        toolName: "research_local_pathways",
        toolDescription:
          "Research current source-backed local pathways only when local availability matters.",
      }),
      specialists.value.asTool({
        toolName: "estimate_object_value",
        toolDescription:
          "Estimate a conservative value range when money or repair cost materially affects the decision.",
      }),
      specialists.action.asTool({
        toolName: "prepare_approved_action",
        toolDescription:
          "Prepare an approved draft/checklist. The nested generation tool enforces exact human approval.",
      }),
      specialists.verification.asTool({
        toolName: "independently_verify_outcome",
        toolDescription:
          "Independently verify evidence before any final result or Credits award.",
      }),
      tools.requestAdditionalEvidence,
      tools.rankNextLifePathways,
      tools.optimizeMovePlan,
    ] as never[],
    outputType: OrchestratorModelOutputSchema,
  });
}
