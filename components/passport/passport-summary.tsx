import type { ObjectPassport } from "@/lib/schemas/profile-catalog";
import { Card } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/passport/confidence-badge";
import { cn } from "@/lib/ui/cn";

export interface PassportSummaryProps {
  className?: string;
  passport: ObjectPassport;
}

export function PassportSummary({
  className,
  passport,
}: PassportSummaryProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <div>
        <h2 className="text-lg font-semibold text-carbon">
          {passport.userConfirmedName}
        </h2>
        <p className="mt-0.5 text-sm text-carbon-muted">
          {passport.category}
          {passport.subcategory ? ` / ${passport.subcategory}` : null}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-carbon-muted">Condition</p>
          <p className="mt-0.5 font-medium text-carbon capitalize">
            {passport.condition.replace(/_/g, " ")}
          </p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-carbon-muted">Functionality</p>
          <p className="mt-0.5 font-medium text-carbon capitalize">
            {passport.functionality.replace(/_/g, " ")}
          </p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-carbon-muted">Repairability</p>
          <p className="mt-0.5 font-medium text-carbon capitalize">
            {passport.repairability}
          </p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-carbon-muted">Ownership</p>
          <p className="mt-0.5 font-medium text-carbon capitalize">
            {passport.ownershipStatus.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {passport.probableIdentity ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-carbon-muted">Identified as:</span>
          <span className="font-medium text-carbon">
            {passport.probableIdentity.value}
          </span>
          <ConfidenceBadge confidence={passport.probableIdentity.confidence} />
        </div>
      ) : null}
    </Card>
  );
}
