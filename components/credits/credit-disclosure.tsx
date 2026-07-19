import type { CreditLedgerEntry } from "@/lib/schemas/missions-ledgers";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface CreditDisclosureProps {
  className?: string;
  entry: CreditLedgerEntry;
}

export function CreditDisclosure({
  className,
  entry,
}: CreditDisclosureProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-carbon">
        How this credit was calculated
      </h3>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <span className="text-carbon-muted">Base action score</span>
        <span className="text-right font-medium text-carbon">
          {entry.baseScore.toLocaleString()}
        </span>

        <span className="text-carbon-muted">Verification multiplier</span>
        <span className="text-right font-medium text-carbon">
          {entry.verificationMultiplier}
        </span>

        <span className="text-carbon-muted">Value retention</span>
        <span className="text-right font-medium text-carbon">
          {entry.valueRetentionMultiplier.toFixed(2)}
        </span>

        <span className="text-carbon-muted">Effort</span>
        <span className="text-right font-medium text-carbon">
          {entry.effortMultiplier.toFixed(2)}
        </span>

        <span className="text-carbon-muted">Environmental confidence</span>
        <span className="text-right font-medium text-carbon">
          {entry.environmentalConfidenceModifier.toFixed(2)}
        </span>
      </div>

      <div className="border-t border-line pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-carbon">Total</span>
          <span className="text-xl font-bold tracking-[-0.02em] text-accent">
            {entry.amount.toLocaleString()}
          </span>
        </div>

        {entry.explanation ? (
          <p className="mt-2 text-xs leading-5 text-carbon-muted">
            {entry.explanation}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
