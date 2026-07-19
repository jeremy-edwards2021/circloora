import type { MovePlan } from "@/lib/schemas/missions-ledgers";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface FallbackOptionsProps {
  className?: string;
  plan: MovePlan;
}

export function FallbackOptions({
  className,
  plan,
}: FallbackOptionsProps) {
  if (plan.fallbackPathways.length === 0) {
    return (
      <p className={cn("text-sm text-carbon-muted", className)}>
        No fallback options available
      </p>
    );
  }

  return (
    <section
      aria-label="Fallback options"
      className={cn("space-y-2", className)}
    >
      <h3 className="text-sm font-semibold text-carbon">
        Alternative plans
      </h3>
      {plan.fallbackPathways.map((fallback, index) => (
        <Card className="flex items-center gap-3 p-4" key={index}>
          <span
            aria-hidden="true"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              index === 0
                ? "bg-amber-soft text-amber-ink"
                : "bg-surface text-carbon-muted",
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-carbon truncate">
              Pathway: {fallback.pathwayId.slice(0, 8)}
            </p>
            <p className="text-xs text-carbon-muted">
              Activates: {new Date(fallback.activateAt).toLocaleDateString()}
            </p>
          </div>
        </Card>
      ))}
    </section>
  );
}
