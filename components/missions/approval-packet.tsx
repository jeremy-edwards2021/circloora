"use client";

import type { Mission, UserApproval } from "@/lib/schemas/missions-ledgers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

export interface ApprovalPacketProps {
  approval: UserApproval;
  className?: string;
  mission: Mission;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ApprovalPacket({
  approval,
  className,
  mission,
  onApprove,
  onReject,
}: ApprovalPacketProps) {
  const isPending = approval.status === "requested";

  return (
    <Card className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-carbon">Approval packet</h3>
          <p className="mt-0.5 text-xs text-carbon-muted">
            {mission.objective}
          </p>
        </div>
        <StatusPill tone={isPending ? "warning" : "neutral"}>
          {approval.status}
        </StatusPill>
      </div>

      <p className="text-sm leading-6 text-carbon">
        {mission.reason}
      </p>

      {isPending ? (
        <div className="flex gap-2 pt-1">
          {onApprove ? (
            <Button onClick={onApprove} size="compact">
              Approve
            </Button>
          ) : null}
          {onReject ? (
            <Button onClick={onReject} size="compact" variant="secondary">
              Reject
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
