"use client";

import type { Pathway } from "@/lib/schemas/investigation-agent";
import { cn } from "@/lib/ui/cn";

export interface DecisionRailProps {
  className?: string;
  onSelect?: (pathwayId: string) => void;
  pathways: Pathway[];
  selectedPathwayId?: string | null;
}

export function DecisionRail({
  className,
  onSelect,
  pathways,
  selectedPathwayId,
}: DecisionRailProps) {
  return (
    <nav
      aria-label="Pathway options"
      className={cn("overflow-x-auto", className)}
    >
      <ol className="flex gap-3 px-5 pb-2">
        {pathways.map((pathway) => {
          const selected = pathway.id === selectedPathwayId;
          return (
            <li key={pathway.id}>
              <button
                aria-current={selected ? "step" : undefined}
                className={cn(
                  "flex w-44 shrink-0 flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-colors duration-200",
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-surface hover:border-carbon/20",
                  pathway.state === "disqualified" && "opacity-50",
                )}
                onClick={() => onSelect?.(pathway.id)}
                type="button"
              >
                <span className="text-sm font-semibold text-carbon">
                  {pathway.title}
                </span>
                {pathway.rank ? (
                  <span className="text-xs text-carbon-muted">
                    Rank #{pathway.rank}
                  </span>
                ) : null}
                {pathway.confidence ? (
                  <span className="text-xs text-carbon-subtle">
                    {Math.round(pathway.confidence.score * 100)}% confidence
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
