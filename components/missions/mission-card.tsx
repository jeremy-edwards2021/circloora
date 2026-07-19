import Link from "next/link";

import type { Mission } from "@/lib/schemas/missions-ledgers";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

const progressText: Record<Mission["state"], string> = {
  proposed: "Not started",
  awaiting_evidence: "Needs evidence",
  ready: "Ready to start",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  in_progress: "In progress",
  awaiting_verification: "Awaiting verification",
  verified: "Verified",
  completed_unverified: "Completed",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

const toneMap: Record<Mission["state"], "neutral" | "positive" | "warning" | "accent" | "danger"> = {
  proposed: "neutral",
  awaiting_evidence: "warning",
  ready: "accent",
  awaiting_approval: "warning",
  approved: "accent",
  in_progress: "accent",
  awaiting_verification: "warning",
  verified: "positive",
  completed_unverified: "neutral",
  blocked: "danger",
  cancelled: "neutral",
};

export interface MissionCardProps {
  className?: string;
  mission: Mission;
}

export function MissionCard({ className, mission }: MissionCardProps) {
  const completedSteps = mission.steps.filter(
    (s) => s.state === "completed",
  ).length;

  return (
    <Link
      className={cn("block focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bone rounded-[1.75rem]", className)}
      href={`/mission/${mission.id}`}
    >
      <Card className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-carbon">
            {mission.objective}
          </h3>
          <StatusPill tone={toneMap[mission.state]}>
            {progressText[mission.state]}
          </StatusPill>
        </div>

        <p className="text-sm leading-6 text-carbon-muted line-clamp-2">
          {mission.reason}
        </p>

        <div className="flex items-center gap-3 text-xs text-carbon-muted">
          <span>
            {completedSteps}/{mission.steps.length} steps
          </span>
          <span>
            {mission.estimatedEffortMinutes.low}–{mission.estimatedEffortMinutes.high} min
          </span>
        </div>
      </Card>
    </Link>
  );
}
