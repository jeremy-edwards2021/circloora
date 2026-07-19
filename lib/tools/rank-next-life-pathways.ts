import { tool } from "@openai/agents";
import { z } from "zod";

import type { RunBudget } from "@/lib/agents/runtime/budget";

import {
  ConfidenceSchema,
  IdSchema,
  PathwaySchema,
  SafetyFlagSchema,
  TimestampSchema,
} from "./common";

const FactorScoresSchema = z
  .object({
    circularValue: z.number().finite().min(0).max(100),
    completionProbability: z.number().finite().min(0).max(100),
    evidenceConfidence: z.number().finite().min(0).max(100),
    deadlineFit: z.number().finite().min(0).max(100),
    localAvailability: z.number().finite().min(0).max(100),
    financialRecovery: z.number().finite().min(0).max(100),
    effortFit: z.number().finite().min(0).max(100),
    travelFit: z.number().finite().min(0).max(100),
    preferenceMatch: z.number().finite().min(0).max(100),
  })
  .strict();

const WeightSchema = FactorScoresSchema.refine(
  (weights) =>
    Math.abs(
      Object.values(weights).reduce((sum, value) => sum + value, 0) - 100,
    ) < 0.0001,
  { message: "Weights must sum to 100" },
);

const CandidateSchema = z
  .object({
    pathway: PathwaySchema,
    factorScores: FactorScoresSchema,
    disqualifyingFactors: z.array(z.string().min(1).max(120)).max(20),
    evidenceThatCouldChangeRanking: z.array(z.string().min(1).max(300)).max(12),
    hierarchyRank: z.number().int().min(1).max(16),
  })
  .strict();

export const RankNextLifePathwaysInputSchema = z
  .object({
    objectId: IdSchema,
    candidates: z.array(CandidateSchema).min(1).max(16),
    safetyFlags: z.array(SafetyFlagSchema).max(12),
    evidenceConfidence: ConfidenceSchema,
    deadline: TimestampSchema.optional(),
    localAvailability: z.boolean(),
    userConstraints: z.array(z.string().min(1).max(240)).max(20),
    preferenceMode: z.enum([
      "balanced",
      "maximize_money",
      "minimize_waste",
      "finish_fastest",
      "minimize_travel",
      "minimize_effort",
    ]),
    requestedWeights: WeightSchema.optional(),
  })
  .strict();

export const RankNextLifePathwaysOutputSchema = z
  .object({
    rankedPathways: z
      .array(
        z
          .object({
            pathway: PathwaySchema,
            score: z.number().finite().min(0).max(100),
            rank: z.number().int().positive(),
            factorScores: FactorScoresSchema,
            disqualifyingFactors: z.array(z.string().min(1).max(120)).max(20),
            explanation: z.string().min(1).max(600),
            evidenceThatCouldChangeRanking: z
              .array(z.string().min(1).max(300))
              .max(12),
          })
          .strict(),
      )
      .max(16),
    activeWeights: WeightSchema,
    vetoedPathways: z.array(PathwaySchema).max(16),
    methodologyVersion: z.string().min(1).max(80),
  })
  .strict();

export type RankNextLifePathwaysInput = z.infer<
  typeof RankNextLifePathwaysInputSchema
>;
export type RankNextLifePathwaysOutput = z.infer<
  typeof RankNextLifePathwaysOutputSchema
>;

export function createRankNextLifePathwaysTool(
  executeDeterministically: (
    input: RankNextLifePathwaysInput,
  ) => Promise<RankNextLifePathwaysOutput>,
  budget: RunBudget,
) {
  return tool({
    name: "rank_next_life_pathways",
    description:
      "Apply the deterministic Circloora methodology to eligible pathway facts. The model may not alter gates, weights, scores, or order.",
    parameters: RankNextLifePathwaysInputSchema,
    async execute(input) {
      budget.reserve("toolCalls");
      return RankNextLifePathwaysOutputSchema.parse(
        await executeDeterministically(
          RankNextLifePathwaysInputSchema.parse(input),
        ),
      );
    },
  });
}
