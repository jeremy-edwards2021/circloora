import type { RecommendationRevision } from "@/lib/schemas/missions-ledgers";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface RevisionPanelProps {
  className?: string;
  revision: RecommendationRevision;
}

export function RevisionPanel({
  className,
  revision,
}: RevisionPanelProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-carbon">
        Recommendation revised
      </h3>

      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-carbon-muted">Previous pathway:</span>
        <span className="text-carbon line-through decoration-danger/60">
          {revision.previousPathwayId.slice(0, 8)}
        </span>
      </div>

      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-carbon-muted">New pathway:</span>
        <span className="font-semibold text-sage-ink">
          {revision.newPathwayId.slice(0, 8)}
        </span>
      </div>

      <p className="text-sm leading-6 text-carbon">
        {revision.explanation}
      </p>

      <div className="flex gap-4 text-xs text-carbon-muted">
        <span>
          Previous confidence: {Math.round(revision.previousConfidence.score * 100)}%
        </span>
        <span>
          New confidence: {Math.round(revision.newConfidence.score * 100)}%
        </span>
      </div>
    </Card>
  );
}
