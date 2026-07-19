import { randomUUID } from "node:crypto";
import { tool } from "@openai/agents";
import { z } from "zod";

import type { RunBudget } from "@/lib/agents/runtime/budget";

import {
  ConfidenceSchema,
  IdSchema,
  SafetyFlagSchema,
  TimestampSchema,
} from "./common";

export const RequestAdditionalEvidenceInputSchema = z
  .object({
    investigationId: IdSchema,
    objectId: IdSchema,
    unresolvedQuestion: z.string().min(1).max(400),
    reason: z.string().min(1).max(500),
    evidenceType: z.enum([
      "full_view",
      "label",
      "damage_detail",
      "powered_state",
      "care_label",
      "material_code",
      "receipt",
      "partner_confirmation",
      "user_answer",
    ]),
    currentConfidence: ConfidenceSchema,
    safetyContext: z.array(SafetyFlagSchema).max(12),
  })
  .strict();

export const RequestAdditionalEvidenceOutputSchema = z
  .object({
    evidenceRequestId: IdSchema,
    instruction: z.string().min(1).max(400),
    targetArea: z.string().min(1).max(240),
    framingGuidance: z.string().min(1).max(300),
    captureMode: z.enum([
      "photo",
      "upload",
      "text",
      "document",
      "partner_confirmation",
    ]),
    optionalPhysicalTest: z
      .object({
        instruction: z.string().min(1).max(300),
        riskLevel: z.enum(["low", "moderate"]),
      })
      .strict()
      .optional(),
    prohibitedActions: z.array(z.string().min(1).max(300)).max(20),
    completionCriteria: z.array(z.string().min(1).max(300)).min(1).max(10),
    accessibilityAlternative: z.string().min(1).max(400),
    expiresAt: TimestampSchema.optional(),
  })
  .strict();

export type RequestAdditionalEvidenceInput = z.infer<
  typeof RequestAdditionalEvidenceInputSchema
>;
export type RequestAdditionalEvidenceOutput = z.infer<
  typeof RequestAdditionalEvidenceOutputSchema
>;

export function createRequestAdditionalEvidenceTool(budget: RunBudget) {
  return tool({
    name: "request_additional_evidence",
    description:
      "Request one targeted, safe piece of evidence when identity, condition, or safety is unresolved.",
    parameters: RequestAdditionalEvidenceInputSchema,
    async execute(raw) {
      budget.reserve("toolCalls");
      const input = RequestAdditionalEvidenceInputSchema.parse(raw);
      const batteryRisk = input.safetyContext.some(
        (flag) => flag === "swollen_battery" || flag === "damaged_lithium",
      );
      const poweredStateUnsafe =
        batteryRisk && input.evidenceType === "powered_state";
      return RequestAdditionalEvidenceOutputSchema.parse({
        evidenceRequestId: randomUUID(),
        instruction: poweredStateUnsafe
          ? "Do not power this device on. Photograph the enclosure from a safe distance without handling the damaged area."
          : instructionFor(input.evidenceType),
        targetArea: targetFor(input.evidenceType),
        framingGuidance:
          "Use even light, keep the full target in frame, and avoid including people or personal documents.",
        captureMode:
          input.evidenceType === "user_answer"
            ? "text"
            : input.evidenceType === "receipt"
              ? "document"
              : "photo",
        prohibitedActions: batteryRisk
          ? [
              "Do not power, charge, open, puncture, compress, or disassemble the device.",
            ]
          : [],
        completionCriteria: [
          "The requested area is readable and unobstructed.",
        ],
        accessibilityAlternative:
          "You can type what is visible or ask someone you trust to help with the photo.",
      });
    },
  });
}

function instructionFor(
  type: RequestAdditionalEvidenceInput["evidenceType"],
): string {
  const instructions: Record<
    RequestAdditionalEvidenceInput["evidenceType"],
    string
  > = {
    full_view: "Photograph the full object from the front and side.",
    label: "Photograph the product label so the text is readable.",
    damage_detail: "Photograph the damaged area without moving or testing it.",
    powered_state:
      "If the object is visibly undamaged and safe to use, show its normal powered-on state.",
    care_label: "Photograph the garment care and fiber-content label.",
    material_code: "Photograph the material or resin code.",
    receipt:
      "Upload the relevant receipt or confirmation after hiding unrelated personal details.",
    partner_confirmation: "Upload the partner confirmation for this outcome.",
    user_answer: "Describe the missing fact in your own words.",
  };
  return instructions[type];
}

function targetFor(
  type: RequestAdditionalEvidenceInput["evidenceType"],
): string {
  return type.replaceAll("_", " ");
}
