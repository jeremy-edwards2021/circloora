import type { EvidenceRequest } from "@/lib/schemas/investigation-agent";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

const statusTones: Record<EvidenceRequest["status"], "neutral" | "positive" | "warning" | "danger"> = {
  requested: "warning",
  fulfilled: "positive",
  declined: "neutral",
  expired: "neutral",
  cancelled: "neutral",
};

const statusLabels: Record<EvidenceRequest["status"], string> = {
  requested: "Requested",
  fulfilled: "Fulfilled",
  declined: "Declined",
  expired: "Expired",
  cancelled: "Cancelled",
};

export interface EvidencePanelProps {
  className?: string;
  request: EvidenceRequest;
}

export function EvidencePanel({
  className,
  request,
}: EvidencePanelProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-carbon">
          {request.unresolvedQuestion}
        </h3>
        <StatusPill tone={statusTones[request.status]}>
          {statusLabels[request.status]}
        </StatusPill>
      </div>

      <p className="text-sm leading-6 text-carbon-muted">
        {request.reason}
      </p>

      <div className="rounded-xl bg-surface p-3 text-sm leading-5 text-carbon">
        <span className="font-semibold">Instruction: </span>
        {request.instruction}
      </div>

      {request.safetyContext.length > 0 && request.safetyContext.some(
        (flag) => flag.severity === "blocking" && flag.resolutionState === "open",
      ) ? (
        <p className="text-xs font-semibold text-danger" role="alert">
          Blocking safety flags are open on this request
        </p>
      ) : null}

      {request.completionCriteria.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-carbon-subtle uppercase tracking-[0.06em] mb-1.5">
            Completion criteria
          </p>
          <ul className="list-inside list-disc text-sm text-carbon-muted space-y-0.5">
            {request.completionCriteria.map((criterion, index) => (
              <li key={index}>{criterion}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
