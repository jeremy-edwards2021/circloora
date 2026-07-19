import type { Investigation, InvestigationStatus } from "./investigation-agent";
import { InvestigationSchema } from "./investigation-agent";
import type { Mission, MissionStatus } from "./missions-ledgers";
import { MissionSchema } from "./missions-ledgers";

export class InvalidStateTransitionError extends Error {
  readonly code = "INVALID_STATE_TRANSITION";

  constructor(
    readonly aggregate: "investigation" | "mission",
    readonly from: string,
    readonly to: string,
    message?: string,
  ) {
    super(message ?? `Cannot transition ${aggregate} from ${from} to ${to}`);
    this.name = "InvalidStateTransitionError";
  }
}

export const INVESTIGATION_TRANSITIONS: Readonly<
  Record<InvestigationStatus, readonly InvestigationStatus[]>
> = {
  draft: ["inventory_review", "investigating", "cancelled"],
  inventory_review: ["investigating", "blocked", "cancelled"],
  investigating: [
    "awaiting_evidence",
    "evaluating_pathways",
    "blocked",
    "cancelled",
  ],
  awaiting_evidence: [
    "investigating",
    "evaluating_pathways",
    "blocked",
    "cancelled",
  ],
  evaluating_pathways: [
    "awaiting_evidence",
    "awaiting_approval",
    "action_ready",
    "blocked",
    "cancelled",
  ],
  awaiting_approval: [
    "evaluating_pathways",
    "action_ready",
    "blocked",
    "cancelled",
  ],
  action_ready: ["awaiting_verification", "completed", "blocked", "cancelled"],
  awaiting_verification: ["action_ready", "completed", "blocked", "cancelled"],
  completed: [],
  blocked: [
    "investigating",
    "evaluating_pathways",
    "action_ready",
    "cancelled",
  ],
  cancelled: [],
};

export const MISSION_TRANSITIONS: Readonly<
  Record<MissionStatus, readonly MissionStatus[]>
> = {
  proposed: ["awaiting_evidence", "ready", "blocked", "cancelled"],
  awaiting_evidence: ["ready", "blocked", "cancelled"],
  ready: [
    "awaiting_approval",
    "approved",
    "in_progress",
    "blocked",
    "cancelled",
  ],
  awaiting_approval: ["ready", "approved", "blocked", "cancelled"],
  approved: ["in_progress", "blocked", "cancelled"],
  in_progress: [
    "awaiting_verification",
    "completed_unverified",
    "blocked",
    "cancelled",
  ],
  awaiting_verification: [
    "verified",
    "completed_unverified",
    "blocked",
    "cancelled",
  ],
  verified: [],
  completed_unverified: ["awaiting_verification"],
  blocked: ["awaiting_evidence", "ready", "in_progress", "cancelled"],
  cancelled: [],
};

export function canTransitionInvestigation(
  from: InvestigationStatus,
  to: InvestigationStatus,
): boolean {
  return from === to || INVESTIGATION_TRANSITIONS[from].includes(to);
}

export function canTransitionMission(
  from: MissionStatus,
  to: MissionStatus,
): boolean {
  return from === to || MISSION_TRANSITIONS[from].includes(to);
}

function assertVersionProgression(
  current: { id: string; version: number },
  next: { id: string; version: number },
) {
  if (current.id !== next.id || next.version !== current.version + 1) {
    throw new InvalidStateTransitionError(
      "investigation",
      String(current.version),
      String(next.version),
      "State transitions require the same aggregate ID and exactly one version increment",
    );
  }
}

export function assertInvestigationTransition(
  currentInput: Investigation,
  nextInput: Investigation,
  context: { authoritativeVerificationSatisfied: boolean },
): Investigation {
  const current = InvestigationSchema.parse(currentInput);
  const next = InvestigationSchema.parse(nextInput);
  assertVersionProgression(current, next);
  if (!canTransitionInvestigation(current.status, next.status)) {
    throw new InvalidStateTransitionError(
      "investigation",
      current.status,
      next.status,
    );
  }
  if (
    next.status === "completed" &&
    !context.authoritativeVerificationSatisfied
  ) {
    throw new InvalidStateTransitionError(
      "investigation",
      current.status,
      next.status,
      "An authoritative verification prerequisite is required for completion",
    );
  }
  return next;
}

export function assertMissionTransition(
  currentInput: Mission,
  nextInput: Mission,
): Mission {
  const current = MissionSchema.parse(currentInput);
  const next = MissionSchema.parse(nextInput);
  try {
    assertVersionProgression(current, next);
  } catch {
    throw new InvalidStateTransitionError(
      "mission",
      String(current.version),
      String(next.version),
      "State transitions require the same aggregate ID and exactly one version increment",
    );
  }
  if (!canTransitionMission(current.state, next.state)) {
    throw new InvalidStateTransitionError("mission", current.state, next.state);
  }
  if (
    next.state === "approved" &&
    next.approvalState !== "approved" &&
    next.approvalState !== "not_required"
  ) {
    throw new InvalidStateTransitionError(
      "mission",
      current.state,
      next.state,
      "Approved state requires resolved approval",
    );
  }
  if (next.state === "verified" && !next.verificationResultId) {
    throw new InvalidStateTransitionError(
      "mission",
      current.state,
      next.state,
      "Verified state requires a verification result",
    );
  }
  return next;
}
