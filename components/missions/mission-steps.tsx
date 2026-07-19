import type { Mission } from "@/lib/schemas/missions-ledgers";
import { cn } from "@/lib/ui/cn";

const stepStateIcon: Record<string, string> = {
  completed: "✓",
  in_progress: "●",
  blocked: "!",
  skipped: "—",
  pending: "○",
};

const stepStateColors: Record<string, string> = {
  completed: "text-sage-ink border-sage",
  in_progress: "text-accent-ink border-accent",
  blocked: "text-danger border-danger",
  skipped: "text-carbon-muted border-carbon/20",
  pending: "text-carbon-muted border-carbon/20",
};

export interface MissionStepsProps {
  className?: string;
  mission: Mission;
}

export function MissionSteps({ className, mission }: MissionStepsProps) {
  return (
    <section aria-label="Mission steps" className={cn("space-y-0", className)}>
      <ol className="relative">
        {mission.steps.map((step, index) => (
          <li
            className={cn(
              "flex gap-3 pb-6 last:pb-0",
              index < mission.steps.length - 1 && "relative",
            )}
            key={step.id}
          >
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  stepStateColors[step.state],
                  step.state === "in_progress" && "animate-pulse",
                )}
              >
                {stepStateIcon[step.state]}
              </span>
              {index < mission.steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="mt-1 w-px flex-1 bg-line"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "completed"
                    ? "text-carbon line-through decoration-sage/50"
                    : "text-carbon",
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-carbon-muted capitalize">
                {step.kind.replace(/_/g, " ")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
