import type { MovePlan } from "@/lib/schemas/missions-ledgers";
import { cn } from "@/lib/ui/cn";

export interface TimelineViewProps {
  className?: string;
  plan: MovePlan;
}

export function TimelineView({ className, plan }: TimelineViewProps) {
  return (
    <section aria-label="Plan timeline" className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-carbon">Timeline</h3>
        <span className="text-xs text-carbon-muted">
          Risk:{" "}
          <span
            className={cn(
              "font-semibold capitalize",
              plan.deadlineRisk === "low" && "text-sage-ink",
              plan.deadlineRisk === "medium" && "text-amber-ink",
              plan.deadlineRisk === "high" && "text-danger",
              plan.deadlineRisk === "misses" && "text-danger",
            )}
          >
            {plan.deadlineRisk.replace(/_/g, " ")}
          </span>
        </span>
      </div>

      <ol className="relative">
        {plan.dailyPlan.map((day, index) => (
          <li className="flex gap-3 pb-4 last:pb-0" key={day.date}>
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-carbon text-xs font-bold text-bone"
              >
                {index + 1}
              </span>
              {index < plan.dailyPlan.length - 1 ? (
                <span aria-hidden="true" className="mt-1 w-px flex-1 bg-line" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-carbon-subtle uppercase tracking-[0.06em]">
                {new Date(day.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="mt-0.5 text-sm text-carbon-muted">
                {day.missionIds.length} mission{day.missionIds.length !== 1 ? "s" : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
