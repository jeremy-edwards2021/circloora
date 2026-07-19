import type { PublicEventType } from "@/lib/agents/contracts/public-events";
import type { Pathway } from "@/lib/tools/common";

export const MOCK_DISCLOSURE =
  "Demo analysis—OpenAI is not currently connected.";

export interface MockFixture {
  id: string;
  category:
    | "electronics"
    | "furniture"
    | "clothing"
    | "room"
    | "verification"
    | "source";
  label: string;
  firstTurn: PublicEventType[];
  resumeTurn: PublicEventType[];
  expectedToolPath: string[];
  forbiddenTools: string[];
  awaitsEvidence: boolean;
  safetyFlags: string[];
  recommendation?: Pathway;
  noVerifiedSource?: boolean;
  revision?: { from: Pathway; to: Pathway; reason: string };
  mockSources: Array<{ url: string; publisher: string; isMock: true }>;
}

export const mockFixtures: Record<string, MockFixture> = {
  "FX-MON-WORK-01": {
    id: "FX-MON-WORK-01",
    category: "electronics",
    label: "Working monitor",
    firstTurn: [
      "understanding_goal",
      "inspecting_evidence",
      "requesting_evidence",
      "paused",
    ],
    resumeTurn: [
      "inspecting_evidence",
      "revising",
      "checking_sources",
      "comparing_pathways",
      "ranking",
      "verifying",
      "mission_ready",
      "completed",
    ],
    expectedToolPath: [
      "analyze_visual_evidence",
      "request_additional_evidence",
      "search_current_pathways",
      "estimate_remaining_value",
      "rank_next_life_pathways",
      "verify_outcome",
    ],
    forbiddenTools: ["optimize_move_plan"],
    awaitsEvidence: true,
    safetyFlags: [],
    recommendation: "resell",
    revision: {
      from: "material_recycling",
      to: "resell",
      reason:
        "The rear label and powered-state evidence support a working, identifiable monitor.",
    },
    mockSources: [
      {
        url: "https://example.invalid/mock-monitor-reuse",
        publisher: "Synthetic reuse network",
        isMock: true,
      },
    ],
  },
  "FX-MON-UNKNOWN-01": {
    id: "FX-MON-UNKNOWN-01",
    category: "electronics",
    label: "Monitor with unknown power state",
    firstTurn: [
      "understanding_goal",
      "inspecting_evidence",
      "requesting_evidence",
      "paused",
    ],
    resumeTurn: [
      "inspecting_evidence",
      "comparing_pathways",
      "ranking",
      "verifying",
      "completed",
    ],
    expectedToolPath: [
      "analyze_visual_evidence",
      "request_additional_evidence",
      "rank_next_life_pathways",
      "verify_outcome",
    ],
    forbiddenTools: ["optimize_move_plan"],
    awaitsEvidence: true,
    safetyFlags: [],
    mockSources: [],
  },
  "FX-BAT-SWELL-01": {
    id: "FX-BAT-SWELL-01",
    category: "electronics",
    label: "Device with possible swollen battery",
    firstTurn: [
      "understanding_goal",
      "inspecting_evidence",
      "requesting_evidence",
      "checking_sources",
      "ranking",
      "verifying",
      "completed",
    ],
    resumeTurn: [],
    expectedToolPath: [
      "analyze_visual_evidence",
      "request_additional_evidence",
      "search_current_pathways",
      "rank_next_life_pathways",
      "verify_outcome",
    ],
    forbiddenTools: [
      "estimate_remaining_value",
      "generate_action_packet",
      "optimize_move_plan",
    ],
    awaitsEvidence: false,
    safetyFlags: ["swollen_battery"],
    recommendation: "special_handling",
    mockSources: [
      {
        url: "https://example.invalid/mock-official-battery-guidance",
        publisher: "Synthetic municipal authority",
        isMock: true,
      },
    ],
  },
  "FX-CHAIR-WOOD-01": {
    id: "FX-CHAIR-WOOD-01",
    category: "furniture",
    label: "Solid-wood chair with a loose joint",
    firstTurn: [
      "understanding_goal",
      "inspecting_evidence",
      "requesting_evidence",
      "paused",
    ],
    resumeTurn: [
      "inspecting_evidence",
      "comparing_pathways",
      "ranking",
      "verifying",
      "completed",
    ],
    expectedToolPath: [
      "analyze_visual_evidence",
      "request_additional_evidence",
      "rank_next_life_pathways",
      "verify_outcome",
    ],
    forbiddenTools: ["search_current_pathways", "optimize_move_plan"],
    awaitsEvidence: true,
    safetyFlags: [],
    recommendation: "repair",
    mockSources: [],
  },
  "FX-FURN-PB-01": {
    id: "FX-FURN-PB-01",
    category: "furniture",
    label: "Damaged particleboard furniture",
    firstTurn: [
      "understanding_goal",
      "inspecting_evidence",
      "comparing_pathways",
      "ranking",
      "verifying",
      "completed",
    ],
    resumeTurn: [],
    expectedToolPath: [
      "analyze_visual_evidence",
      "rank_next_life_pathways",
      "verify_outcome",
    ],
    forbiddenTools: ["estimate_remaining_value", "optimize_move_plan"],
    awaitsEvidence: false,
    safetyFlags: [],
    recommendation: "component_recovery",
    mockSources: [],
  },
  "FX-COAT-BRAND-01": {
    id: "FX-COAT-BRAND-01",
    category: "clothing",
    label: "Branded winter coat",
    firstTurn: [
      "understanding_goal",
      "inspecting_evidence",
      "requesting_evidence",
      "paused",
    ],
    resumeTurn: [
      "inspecting_evidence",
      "comparing_pathways",
      "ranking",
      "verifying",
      "completed",
    ],
    expectedToolPath: [
      "analyze_visual_evidence",
      "request_additional_evidence",
      "estimate_remaining_value",
      "rank_next_life_pathways",
      "verify_outcome",
    ],
    forbiddenTools: ["optimize_move_plan"],
    awaitsEvidence: true,
    safetyFlags: [],
    recommendation: "resell",
    mockSources: [],
  },
  "FX-CLOTH-DMG-01": {
    id: "FX-CLOTH-DMG-01",
    category: "clothing",
    label: "Damaged unbranded clothing",
    firstTurn: [
      "understanding_goal",
      "inspecting_evidence",
      "comparing_pathways",
      "ranking",
      "verifying",
      "completed",
    ],
    resumeTurn: [],
    expectedToolPath: [
      "analyze_visual_evidence",
      "rank_next_life_pathways",
      "verify_outcome",
    ],
    forbiddenTools: ["estimate_remaining_value", "optimize_move_plan"],
    awaitsEvidence: false,
    safetyFlags: [],
    recommendation: "repair",
    mockSources: [],
  },
  "FX-ROOM-07-01": {
    id: "FX-ROOM-07-01",
    category: "room",
    label: "Seven-object move plan",
    firstTurn: [
      "understanding_goal",
      "reviewing_inventory",
      "selecting_object",
      "comparing_pathways",
      "ranking",
      "preparing_mission",
      "mission_ready",
      "completed",
    ],
    resumeTurn: [],
    expectedToolPath: [
      "analyze_visual_evidence",
      "rank_next_life_pathways",
      "optimize_move_plan",
      "verify_outcome",
    ],
    forbiddenTools: [],
    awaitsEvidence: false,
    safetyFlags: [],
    mockSources: [
      {
        url: "https://example.invalid/mock-room-plan",
        publisher: "Synthetic route planner",
        isMock: true,
      },
    ],
  },
  "FX-NOSOURCE-01": {
    id: "FX-NOSOURCE-01",
    category: "source",
    label: "No current source available",
    firstTurn: [
      "understanding_goal",
      "checking_sources",
      "comparing_pathways",
      "ranking",
      "verifying",
      "completed",
    ],
    resumeTurn: [],
    expectedToolPath: [
      "search_current_pathways",
      "rank_next_life_pathways",
      "verify_outcome",
    ],
    forbiddenTools: ["generate_action_packet"],
    awaitsEvidence: false,
    safetyFlags: [],
    noVerifiedSource: true,
    mockSources: [],
  },
  "FX-DONATE-DOC-01": {
    id: "FX-DONATE-DOC-01",
    category: "verification",
    label: "Donation verification",
    firstTurn: ["understanding_goal", "verifying", "completed"],
    resumeTurn: [],
    expectedToolPath: ["verify_outcome"],
    forbiddenTools: ["generate_action_packet", "optimize_move_plan"],
    awaitsEvidence: false,
    safetyFlags: [],
    recommendation: "donate_for_reuse",
    mockSources: [],
  },
  "FX-DUPE-CLAIM-01": {
    id: "FX-DUPE-CLAIM-01",
    category: "verification",
    label: "Duplicate verification attempt",
    firstTurn: ["understanding_goal", "verifying", "completed"],
    resumeTurn: [],
    expectedToolPath: ["verify_outcome"],
    forbiddenTools: ["generate_action_packet", "optimize_move_plan"],
    awaitsEvidence: false,
    safetyFlags: [],
    mockSources: [],
  },
};

export function getMockFixture(id: string | undefined): MockFixture {
  return (
    mockFixtures[id ?? "FX-MON-WORK-01"] ?? mockFixtures["FX-MON-WORK-01"]!
  );
}
