import { describe, expect, it } from "vitest";

import {
  NO_SOURCE_MESSAGE,
  SearchCurrentPathwaysOutputSchema,
} from "@/lib/tools/search-current-pathways";
import { VerifyOutcomeOutputSchema } from "@/lib/tools/verify-outcome";

describe("strict tool outputs", () => {
  it("requires the exact no-source limitation and no invented candidates", () => {
    expect(
      SearchCurrentPathwaysOutputSchema.safeParse({
        candidates: [],
        noVerifiedPathway: true,
        fallbackMessage: NO_SOURCE_MESSAGE,
      }).success,
    ).toBe(true);
    expect(
      SearchCurrentPathwaysOutputSchema.safeParse({
        candidates: [],
        noVerifiedPathway: true,
        fallbackMessage: "Try somewhere nearby",
      }).success,
    ).toBe(false);
  });

  it("forces insufficient and rejected verification to zero Credits", () => {
    const base = {
      verificationStatus: "insufficient_evidence",
      evidenceSummary: ["The evidence does not support completion."],
      confidence: 0.2,
      fraudRiskFlags: [],
      creditsEligibility: false,
      creditsAmount: 1,
      creditsExplanation: ["No award."],
      verifierVersion: "v1",
      calculationVersion: "v1",
    };
    expect(VerifyOutcomeOutputSchema.safeParse(base).success).toBe(false);
    expect(
      VerifyOutcomeOutputSchema.safeParse({ ...base, creditsAmount: 0 })
        .success,
    ).toBe(true);
  });
});
