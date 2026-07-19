import type { SourceRef } from "@/lib/schemas/primitives";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

const freshnessTones: Record<SourceRef["freshnessStatus"], "neutral" | "positive" | "warning"> = {
  current: "positive",
  stale: "warning",
  unknown: "neutral",
};

export interface EvidenceProvenanceProps {
  className?: string;
  sources: SourceRef[];
}

export function EvidenceProvenance({
  className,
  sources,
}: EvidenceProvenanceProps) {
  if (sources.length === 0) return null;

  return (
    <section
      aria-label="Evidence sources"
      className={cn("space-y-2", className)}
    >
      <h3 className="text-xs font-semibold text-carbon-subtle uppercase tracking-[0.06em]">
        Sources
      </h3>
      {sources.map((source) => (
        <div
          className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2"
          key={source.sourceId}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-carbon">
              {source.title}
            </p>
            <p className="text-xs text-carbon-muted">{source.publisher}</p>
          </div>
          <StatusPill tone={freshnessTones[source.freshnessStatus]}>
            {source.freshnessStatus}
          </StatusPill>
        </div>
      ))}
    </section>
  );
}
