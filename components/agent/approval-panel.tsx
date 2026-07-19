import type { UserApproval } from "@/lib/schemas/missions-ledgers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

const statusTones: Record<UserApproval["status"], "neutral" | "positive" | "warning" | "danger"> = {
  requested: "warning",
  approved: "positive",
  rejected: "danger",
  expired: "neutral",
  revoked: "danger",
};

const actionLabels: Record<UserApproval["actionType"], string> = {
  prepare_listing: "Prepare listing",
  prepare_donation: "Prepare donation",
  prepare_repair: "Prepare repair",
  prepare_transfer: "Prepare transfer",
  prepare_plan: "Prepare plan",
  other: "Action",
};

export interface ApprovalPanelProps {
  approval: UserApproval;
  className?: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ApprovalPanel({
  approval,
  className,
  onApprove,
  onReject,
}: ApprovalPanelProps) {
  const isPending = approval.status === "requested";

  return (
    <Card className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-carbon">
            {actionLabels[approval.actionType]}
          </h3>
          <p className="mt-0.5 text-xs text-carbon-muted">
            {approval.scopeSummary}
          </p>
        </div>
        <StatusPill tone={statusTones[approval.status]}>
          {approval.status}
        </StatusPill>
      </div>

      <p className="text-sm leading-6 text-carbon">
        {approval.payloadSummary}
      </p>

      {approval.riskAndSideEffects.length > 0 ? (
        <div className="rounded-xl bg-amber-soft p-3">
          <p className="text-xs font-semibold text-amber-ink uppercase tracking-[0.06em] mb-1.5">
            Risks and side effects
          </p>
          <ul className="list-inside list-disc text-sm text-amber-ink space-y-0.5">
            {approval.riskAndSideEffects.map((risk, index) => (
              <li key={index}>{risk}</li>
            ))}
          </ul>
        </div>
      ) : null}

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
