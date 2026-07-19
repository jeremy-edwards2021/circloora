import type { EvidenceRequest } from "@/lib/schemas/investigation-agent";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

const captureModeLabels: Record<EvidenceRequest["captureMode"], string> = {
  photo: "Take a photo",
  document: "Upload a document",
  text_answer: "Answer a question",
  visual_check: "Perform a visual check",
  partner_confirmation: "Get partner confirmation",
};

export interface EvidenceRequestCardProps {
  className?: string;
  evidenceRequest: EvidenceRequest;
}

export function EvidenceRequestCard({
  className,
  evidenceRequest,
}: EvidenceRequestCardProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-carbon">
          {evidenceRequest.unresolvedQuestion}
        </h3>
        <StatusPill tone={evidenceRequest.status === "fulfilled" ? "positive" : "warning"}>
          {evidenceRequest.status}
        </StatusPill>
      </div>

      <p className="text-sm leading-6 text-carbon-muted">
        {evidenceRequest.reason}
      </p>

      <div className="rounded-xl bg-surface p-3 text-sm leading-5 text-carbon">
        <span className="font-semibold">How: </span>
        {captureModeLabels[evidenceRequest.captureMode]}
      </div>

      {evidenceRequest.accessibilityAlternative ? (
        <p className="text-xs text-carbon-muted">
          Alternative: {evidenceRequest.accessibilityAlternative}
        </p>
      ) : null}
    </Card>
  );
}
