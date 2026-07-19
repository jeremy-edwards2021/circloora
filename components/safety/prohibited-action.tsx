import type { SafetyFlag } from "@/lib/schemas/primitives";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface ProhibitedActionProps {
  className?: string;
  flags: SafetyFlag[];
}

export function ProhibitedAction({
  className,
  flags,
}: ProhibitedActionProps) {
  const allActions = flags.flatMap(
    (flag) => flag.prohibitedActions,
  );

  if (allActions.length === 0) return null;

  return (
    <section
      aria-label="Prohibited actions"
      className={cn("space-y-2", className)}
    >
      <h3 className="text-sm font-semibold text-danger-dark">
        This action is not available
      </h3>
      <Card className="border-danger/30 bg-danger-soft text-sm" role="alert">
        <ul className="list-inside list-disc space-y-1.5 text-danger-dark">
          {allActions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
      </Card>
      <p className="text-xs text-carbon-muted">
        These restrictions are based on safety and legal requirements.
        Contact support if you believe this is an error.
      </p>
    </section>
  );
}
