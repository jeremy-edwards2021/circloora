import { Agent } from "@openai/agents";
import { z } from "zod";

import { AnalyzeVisualEvidenceOutputSchema } from "@/lib/tools/analyze-visual-evidence";
import { EstimateRemainingValueOutputSchema } from "@/lib/tools/estimate-remaining-value";
import { GenerateActionPacketOutputSchema } from "@/lib/tools/generate-action-packet";
import { SearchCurrentPathwaysOutputSchema } from "@/lib/tools/search-current-pathways";
import { VerifyOutcomeOutputSchema } from "@/lib/tools/verify-outcome";

import { instructions } from "./instructions";

export const PathwayProposalSchema = z
  .object({
    pathways: z
      .array(
        z
          .object({
            pathway: z.string().min(1).max(80),
            rationale: z.string().min(1).max(500),
            possibleDisqualifiers: z.array(z.string().min(1).max(240)).max(12),
            evidenceThatCouldChangeEligibility: z
              .array(z.string().min(1).max(300))
              .max(12),
          })
          .strict(),
      )
      .min(2)
      .max(12),
  })
  .strict();

export interface SpecialistToolset {
  analyzeVisualEvidence: unknown;
  searchCurrentPathways: unknown;
  estimateRemainingValue: unknown;
  generateActionPacket: unknown;
  verifyOutcome: unknown;
}

export function createSpecialists(model: string, tools: SpecialistToolset) {
  return {
    objectIntelligence: new Agent({
      name: "ObjectIntelligenceAgent",
      model,
      instructions: instructions.objectIntelligence,
      tools: [tools.analyzeVisualEvidence] as never[],
      outputType: AnalyzeVisualEvidenceOutputSchema,
    }),
    circularPathway: new Agent({
      name: "CircularPathwayAgent",
      model,
      instructions: instructions.circularPathway,
      outputType: PathwayProposalSchema,
    }),
    localPathway: new Agent({
      name: "LocalPathwayAgent",
      model,
      instructions: instructions.localPathway,
      tools: [tools.searchCurrentPathways] as never[],
      outputType: SearchCurrentPathwaysOutputSchema,
    }),
    value: new Agent({
      name: "ValueAgent",
      model,
      instructions: instructions.value,
      tools: [tools.estimateRemainingValue] as never[],
      outputType: EstimateRemainingValueOutputSchema,
    }),
    action: new Agent({
      name: "ActionAgent",
      model,
      instructions: instructions.action,
      tools: [tools.generateActionPacket] as never[],
      outputType: GenerateActionPacketOutputSchema,
    }),
    verification: new Agent({
      name: "VerificationAgent",
      model,
      instructions: instructions.verification,
      tools: [tools.verifyOutcome] as never[],
      outputType: VerifyOutcomeOutputSchema,
    }),
  };
}
