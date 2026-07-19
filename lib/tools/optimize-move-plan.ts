import { tool } from "@openai/agents";
import { z } from "zod";

import type { RunBudget } from "@/lib/agents/runtime/budget";

import { IdSchema, PathwaySchema, TimestampSchema } from "./common";

export const OptimizeMovePlanInputSchema = z
  .object({
    investigationId: IdSchema,
    deadline: TimestampSchema,
    objects: z
      .array(
        z
          .object({ objectId: IdSchema, label: z.string().min(1).max(160) })
          .strict(),
      )
      .min(1)
      .max(8),
    rankedPathways: z
      .array(
        z
          .object({
            objectId: IdSchema,
            pathway: PathwaySchema,
            rank: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1)
      .max(128),
    timeEstimates: z
      .array(
        z
          .object({
            objectId: IdSchema,
            lowHours: z.number().finite().nonnegative(),
            highHours: z.number().finite().nonnegative(),
          })
          .strict()
          .refine(({ lowHours, highHours }) => highHours >= lowHours),
      )
      .max(8),
    userAvailability: z
      .array(
        z
          .object({ startsAt: TimestampSchema, endsAt: TimestampSchema })
          .strict()
          .refine(
            ({ startsAt, endsAt }) => Date.parse(endsAt) > Date.parse(startsAt),
          ),
      )
      .max(30),
    travelConstraints: z.array(z.string().min(1).max(240)).max(20),
    dependencies: z
      .array(
        z
          .object({ beforeObjectId: IdSchema, afterObjectId: IdSchema })
          .strict()
          .refine(
            ({ beforeObjectId, afterObjectId }) =>
              beforeObjectId !== afterObjectId,
          ),
      )
      .max(30),
    fallbackDates: z
      .array(
        z
          .object({
            objectId: IdSchema,
            switchAt: TimestampSchema,
            fallbackPathway: PathwaySchema,
          })
          .strict(),
      )
      .max(8),
  })
  .strict();

const PlanItemSchema = z
  .object({
    objectId: IdSchema,
    pathway: PathwaySchema,
    startsAt: TimestampSchema,
    dueAt: TimestampSchema,
    status: z.enum(["planned", "blocked", "fallback"]),
  })
  .strict();

export const OptimizeMovePlanOutputSchema = z
  .object({
    orderedPlan: z.array(PlanItemSchema).max(24),
    dailyPlan: z
      .array(
        z
          .object({
            date: z.string().date(),
            objectIds: z.array(IdSchema).max(8),
            summary: z.string().min(1).max(300),
          })
          .strict(),
      )
      .max(60),
    groupedTrips: z
      .array(
        z
          .object({
            label: z.string().min(1).max(160),
            objectIds: z.array(IdSchema).min(1).max(8),
          })
          .strict(),
      )
      .max(8),
    urgentActions: z.array(z.string().min(1).max(300)).max(20),
    dependencies: z.array(z.string().min(1).max(300)).max(30),
    fallbackPathways: z
      .array(
        z
          .object({
            objectId: IdSchema,
            pathway: PathwaySchema,
            switchAt: TimestampSchema,
          })
          .strict(),
      )
      .max(8),
    expectedCompletionDate: TimestampSchema,
    deadlineRisk: z.enum(["low", "medium", "high"]),
    unschedulableReasons: z.array(z.string().min(1).max(300)).max(20),
  })
  .strict();

export type OptimizeMovePlanInput = z.infer<typeof OptimizeMovePlanInputSchema>;
export type OptimizeMovePlanOutput = z.infer<
  typeof OptimizeMovePlanOutputSchema
>;

export function createOptimizeMovePlanTool(
  executeDeterministically: (
    input: OptimizeMovePlanInput,
  ) => Promise<OptimizeMovePlanOutput>,
  budget: RunBudget,
) {
  return tool({
    name: "optimize_move_plan",
    description:
      "Schedule up to eight confirmed objects against a deadline without changing their deterministic pathway ranks.",
    parameters: OptimizeMovePlanInputSchema,
    async execute(input) {
      budget.reserve("toolCalls");
      return OptimizeMovePlanOutputSchema.parse(
        await executeDeterministically(
          OptimizeMovePlanInputSchema.parse(input),
        ),
      );
    },
  });
}
