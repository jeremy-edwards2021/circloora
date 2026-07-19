import type { SafetyFlag } from "@/lib/schemas/primitives";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

export interface BlockingEscalationProps {
  className?: string;
  flag: SafetyFlag;
  onDismiss?: () => void;
}

export function BlockingEscalation({
  className,
  flag,
  onDismiss,
}: BlockingEscalationProps) {
  return (
    <Card
      className={cn(
        "border-danger/30 bg-danger-soft",
        className,
      )}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-danger-dark">
          {flag.code.replace(/_/g, " ")}
        </h3>
        <StatusPill tone="danger">
          {flag.severity}
        </StatusPill>
      </div>

      <p className="mt-2 text-sm leading-6 text-danger-dark">
        {flag.observationBasis}
      </p>

      {flag.prohibitedActions.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-danger-dark uppercase tracking-[0.06em] mb-1.5">
            Prohibited actions
          </p>
          <ul className="list-inside list-disc text-sm text-danger-dark space-y-0.5">
            {flag.prohibitedActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {flag.officialSourceRequired ? (
        <p className="mt-2 text-xs font-semibold text-danger-dark">
          An official source is required to resolve this flag
        </p>
      ) : null}
    </Card>
  );
}
