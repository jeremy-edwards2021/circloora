import { tool } from "@openai/agents";
import { z } from "zod";

import type { RunBudget } from "@/lib/agents/runtime/budget";

import {
  ConfidenceSchema,
  EvidenceRefSchema,
  MoneyRangeSchema,
  PathwaySchema,
  SourceRefSchema,
  TimestampSchema,
} from "./common";

export const EstimateRemainingValueInputSchema = z
  .object({
    objectIdentity: z.string().min(1).max(240),
    category: z.string().min(1).max(120),
    condition: z.string().min(1).max(400),
    evidence: z.array(EvidenceRefSchema).max(12),
    marketEvidence: z.array(SourceRefSchema).max(12),
    generalizedLocation: z.string().min(1).max(120),
    deadline: TimestampSchema.optional(),
    selectedPathway: PathwaySchema.optional(),
  })
  .strict();

export const EstimateRemainingValueOutputSchema = z
  .object({
    estimate: MoneyRangeSchema.nullable(),
    confidence: ConfidenceSchema,
    assumptions: z.array(z.string().min(1).max(300)).max(20),
    evidenceBasis: z.array(z.string().min(1).max(300)).max(20),
    expectedCompletionTimeRange: z
      .object({
        low: z.number().finite().nonnegative(),
        high: z.number().finite().nonnegative(),
        unit: z.enum(["hours", "days", "weeks"]),
      })
      .strict()
      .refine(({ low, high }) => high >= low)
      .optional(),
    limitations: z.array(z.string().min(1).max(300)).max(20),
    disclaimer: z.literal("Estimated range—not an appraisal."),
  })
  .strict();

export type EstimateRemainingValueInput = z.infer<
  typeof EstimateRemainingValueInputSchema
>;
export type EstimateRemainingValueOutput = z.infer<
  typeof EstimateRemainingValueOutputSchema
>;

export function createEstimateRemainingValueTool(
  execute: (
    input: EstimateRemainingValueInput,
  ) => Promise<EstimateRemainingValueOutput>,
  budget: RunBudget,
) {
  return tool({
    name: "estimate_remaining_value",
    description:
      "Return a conservative remaining-value range with assumptions and an appraisal disclaimer.",
    parameters: EstimateRemainingValueInputSchema,
    async execute(input) {
      budget.reserve("toolCalls");
      return EstimateRemainingValueOutputSchema.parse(
        await execute(EstimateRemainingValueInputSchema.parse(input)),
      );
    },
  });
}
