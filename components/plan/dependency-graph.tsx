import type { MovePlan } from "@/lib/schemas/missions-ledgers";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface DependencyGraphProps {
  className?: string;
  plan: MovePlan;
}

export function DependencyGraph({
  className,
  plan,
}: DependencyGraphProps) {
  if (plan.dependencies.length === 0) {
    return (
      <p className={cn("text-sm text-carbon-muted", className)}>
        No dependencies between missions
      </p>
    );
  }

  return (
    <section
      aria-label="Mission dependencies"
      className={cn("space-y-2", className)}
    >
      <h3 className="text-sm font-semibold text-carbon">Dependencies</h3>
      <div className="space-y-2">
        {plan.dependencies.map((dep, index) => (
          <Card className="flex items-center gap-3 p-4" key={index}>
            <div className="flex-1 text-sm font-medium text-carbon truncate">
              {dep.beforeMissionId.slice(0, 8)}
            </div>
            <span aria-hidden="true" className="text-carbon-subtle">
              <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m14 5 5 5-5 5" />
                <path d="M19 10H5" />
              </svg>
            </span>
            <div className="flex-1 text-sm font-medium text-carbon truncate">
              {dep.afterMissionId.slice(0, 8)}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
