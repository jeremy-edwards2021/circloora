import { tool } from "@openai/agents";
import { z } from "zod";

import type { RunBudget } from "@/lib/agents/runtime/budget";

import {
  ConfidenceSchema,
  IdSchema,
  PathwaySchema,
  SourceRefSchema,
  TimestampSchema,
} from "./common";

export const NO_SOURCE_MESSAGE =
  "Circloora could not verify a current local pathway. Confirm with your municipal sanitation or waste authority before traveling.";

export const SearchCurrentPathwaysInputSchema = z
  .object({
    objectIdentity: z.string().min(1).max(240),
    category: z.string().min(1).max(120),
    condition: z.string().min(1).max(400),
    approximateArea: z.string().min(1).max(120),
    targetPathwayTypes: z.array(PathwaySchema).min(1).max(8),
    deadline: TimestampSchema.optional(),
    constraints: z.array(z.string().min(1).max(240)).max(20),
  })
  .strict();

const CandidateSchema = z
  .object({
    candidateId: IdSchema,
    pathway: PathwaySchema,
    organization: z.string().min(1).max(200),
    eligibilityFacts: z.array(z.string().min(1).max(300)).max(20),
    location: z.string().max(200).optional(),
    verifiedHours: z.string().max(160).optional(),
    distanceConfidence: ConfidenceSchema.optional(),
    sources: z.array(SourceRefSchema).min(1).max(8),
    retrievedAt: TimestampSchema,
    limitations: z.array(z.string().min(1).max(300)).max(20),
    confidence: ConfidenceSchema,
    verificationStatus: z.enum([
      "verified",
      "partially_verified",
      "unverified",
      "expired",
    ]),
  })
  .strict();

export const SearchCurrentPathwaysOutputSchema = z
  .object({
    candidates: z.array(CandidateSchema).max(24),
    noVerifiedPathway: z.boolean(),
    fallbackMessage: z.string().max(400).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.noVerifiedPathway && value.candidates.length !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No-source result cannot contain candidates",
      });
    }
    if (
      value.noVerifiedPathway &&
      value.fallbackMessage !== NO_SOURCE_MESSAGE
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No-source result requires the approved limitation",
      });
    }
  });

export type SearchCurrentPathwaysInput = z.infer<
  typeof SearchCurrentPathwaysInputSchema
>;
export type SearchCurrentPathwaysOutput = z.infer<
  typeof SearchCurrentPathwaysOutputSchema
>;

export function createSearchCurrentPathwaysTool(
  execute: (
    input: SearchCurrentPathwaysInput,
  ) => Promise<SearchCurrentPathwaysOutput>,
  budget: RunBudget,
) {
  return tool({
    name: "search_current_pathways",
    description:
      "Find current, source-backed local pathways for a coarse area. Return no result rather than inventing a provider, rule, hour, or location.",
    parameters: SearchCurrentPathwaysInputSchema,
    async execute(input) {
      budget.reserve("toolCalls");
      return SearchCurrentPathwaysOutputSchema.parse(
        await execute(SearchCurrentPathwaysInputSchema.parse(input)),
      );
    },
  });
}
