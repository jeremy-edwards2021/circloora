import { z } from "zod";

export const agentNames = [
  "CirclooraOrchestrator",
  "ObjectIntelligenceAgent",
  "CircularPathwayAgent",
  "LocalPathwayAgent",
  "ValueAgent",
  "ActionAgent",
  "VerificationAgent",
] as const;

export const publicEventTypes = [
  "understanding_goal",
  "reviewing_inventory",
  "selecting_object",
  "inspecting_evidence",
  "requesting_evidence",
  "checking_sources",
  "comparing_pathways",
  "ranking",
  "revising",
  "verifying",
  "waiting_for_approval",
  "preparing_mission",
  "mission_ready",
  "paused",
  "limit_reached",
  "failed",
  "completed",
] as const;

export const publicToolNames = [
  "analyze_visual_evidence",
  "request_additional_evidence",
  "search_current_pathways",
  "estimate_remaining_value",
  "rank_next_life_pathways",
  "generate_action_packet",
  "optimize_move_plan",
  "verify_outcome",
] as const;

export const PublicAgentEventSchema = z
  .object({
    eventId: z.string().uuid(),
    sequence: z.number().int().nonnegative(),
    timestamp: z.string().datetime({ offset: true }),
    runId: z.string().uuid(),
    investigationId: z.string().uuid(),
    agent: z.enum(agentNames),
    eventType: z.enum(publicEventTypes),
    summary: z.string().min(1).max(160),
    toolName: z.enum(publicToolNames).optional(),
    objectId: z.string().uuid().optional(),
    status: z.enum(["queued", "in_progress", "completed", "paused", "failed"]),
    userActionRequired: z.boolean(),
  })
  .strict();

export type PublicAgentEvent = z.infer<typeof PublicAgentEventSchema>;
export type PublicEventType = (typeof publicEventTypes)[number];

const publicSummaries: Record<PublicEventType, string> = {
  understanding_goal: "Understanding your goal",
  reviewing_inventory: "Reviewing the confirmed inventory",
  selecting_object: "Choosing the next item to investigate",
  inspecting_evidence: "Inspecting visible condition",
  requesting_evidence: "A closer look would improve this result",
  checking_sources: "Checking current local pathways",
  comparing_pathways: "Comparing next-life options",
  ranking: "Ranking the strongest options",
  revising: "Updating the recommendation with new evidence",
  verifying: "Verifying the plan",
  waiting_for_approval: "Waiting for your approval",
  preparing_mission: "Preparing your action plan",
  mission_ready: "Your mission is ready",
  paused: "Saved and ready to resume",
  limit_reached: "This run reached its safe limit",
  failed: "This step could not be completed",
  completed: "Investigation complete",
};

export function publicSummary(eventType: PublicEventType): string {
  return publicSummaries[eventType];
}
