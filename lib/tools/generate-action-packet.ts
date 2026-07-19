import { tool } from "@openai/agents";
import { z } from "zod";

import type { RunBudget } from "@/lib/agents/runtime/budget";

import { IdSchema, PathwaySchema, SourceRefSchema } from "./common";

export const GenerateActionPacketInputSchema = z
  .object({
    missionId: IdSchema,
    objectId: IdSchema,
    pathway: PathwaySchema,
    verifiedFacts: z.array(z.string().min(1).max(300)).max(30),
    userConstraints: z.array(z.string().min(1).max(240)).max(20),
    approvedScope: z.string().min(1).max(800),
    approvalDigest: z.string().regex(/^[a-f0-9]{64}$/),
    sources: z.array(SourceRefSchema).max(12),
  })
  .strict();

export const GenerateActionPacketOutputSchema = z
  .object({
    packetId: IdSchema,
    packetType: z.enum([
      "resale_draft",
      "photo_checklist",
      "donation_manifest",
      "repair_inquiry",
      "return_checklist",
      "dropoff_checklist",
      "maps_search",
      "route_plan",
      "reminder_text",
      "pickup_prep",
      "recipient_message",
    ]),
    title: z.string().min(1).max(160),
    sections: z
      .array(
        z
          .object({
            heading: z.string().min(1).max(120),
            body: z.string().min(1).max(2_000),
          })
          .strict(),
      )
      .min(1)
      .max(12),
    sources: z.array(SourceRefSchema).max(12),
    draftOnly: z.literal(true),
    sideEffectPerformed: z.literal(false),
    limitations: z.array(z.string().min(1).max(300)).max(20),
  })
  .strict();

export type GenerateActionPacketInput = z.infer<
  typeof GenerateActionPacketInputSchema
>;
export type GenerateActionPacketOutput = z.infer<
  typeof GenerateActionPacketOutputSchema
>;

export function createGenerateActionPacketTool(
  execute: (
    input: GenerateActionPacketInput,
  ) => Promise<GenerateActionPacketOutput>,
  budget: RunBudget,
) {
  return tool({
    name: "generate_action_packet",
    description:
      "Prepare a draft or checklist inside the exact approved scope. It never publishes, contacts, books, purchases, pays, or shares an address.",
    parameters: GenerateActionPacketInputSchema,
    needsApproval: true,
    async execute(input) {
      budget.reserve("toolCalls");
      const parsed = GenerateActionPacketInputSchema.parse(input);
      return GenerateActionPacketOutputSchema.parse(await execute(parsed));
    },
  });
}
