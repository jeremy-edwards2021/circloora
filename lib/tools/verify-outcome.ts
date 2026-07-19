import { tool } from "@openai/agents";
import { z } from "zod";

import type { RunBudget } from "@/lib/agents/runtime/budget";

import {
  ConfidenceSchema,
  EvidenceRefSchema,
  IdSchema,
  TimestampSchema,
} from "./common";

export const VerifyOutcomeInputSchema = z
  .object({
    claimId: IdSchema,
    missionId: IdSchema,
    claimedOutcome: z.string().min(1).max(240),
    objectSnapshot: z.unknown(),
    previousRecommendation: z.string().min(1).max(500),
    documents: z.array(EvidenceRefSchema).max(4),
    visualEvidence: z.array(EvidenceRefSchema).max(4),
    partnerEvidence: z.array(EvidenceRefSchema).max(4),
    userAttestation: z.string().max(2_000).optional(),
    submittedAt: TimestampSchema,
  })
  .strict();

export const VerifyOutcomeOutputSchema = z
  .object({
    verificationStatus: z.enum([
      "partner_verified",
      "document_supported",
      "visually_supported",
      "user_attested",
      "insufficient_evidence",
      "rejected",
    ]),
    supportedOutcome: z.string().max(240).optional(),
    evidenceSummary: z.array(z.string().min(1).max(300)).max(20),
    confidence: ConfidenceSchema,
    fraudRiskFlags: z.array(z.string().min(1).max(120)).max(20),
    creditsEligibility: z.boolean(),
    creditsAmount: z.number().int().nonnegative(),
    creditsExplanation: z.array(z.string().min(1).max(300)).max(20),
    followUpRequest: z.string().max(400).optional(),
    verifierVersion: z.string().min(1).max(80),
    calculationVersion: z.string().min(1).max(80),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      ["insufficient_evidence", "rejected"].includes(
        value.verificationStatus,
      ) &&
      value.creditsAmount !== 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unsupported verification must award zero",
      });
    }
    if (!value.creditsEligibility && value.creditsAmount !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ineligible outcome must award zero",
      });
    }
  });

export type VerifyOutcomeInput = z.infer<typeof VerifyOutcomeInputSchema>;
export type VerifyOutcomeOutput = z.infer<typeof VerifyOutcomeOutputSchema>;

export interface VerificationPipeline {
  verify(input: VerifyOutcomeInput): Promise<VerifyOutcomeOutput>;
}

export function createVerifyOutcomeTool(
  pipeline: VerificationPipeline,
  budget: RunBudget,
) {
  return tool({
    name: "verify_outcome",
    description:
      "Independently assess outcome evidence, then apply the deterministic anti-abuse and Credits service. Model text cannot set the award.",
    parameters: VerifyOutcomeInputSchema,
    async execute(input) {
      budget.reserve("toolCalls");
      return VerifyOutcomeOutputSchema.parse(
        await pipeline.verify(VerifyOutcomeInputSchema.parse(input)),
      );
    },
  });
}
