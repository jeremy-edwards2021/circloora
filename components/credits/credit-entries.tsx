import type { CreditLedgerEntry } from "@/lib/schemas/missions-ledgers";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

const entryTypeLabels: Record<CreditLedgerEntry["entryType"], string> = {
  award: "Award",
  reversal: "Reversal",
  adjustment: "Adjustment",
  expiry: "Expiry",
};

const entryTypeTones: Record<CreditLedgerEntry["entryType"], "neutral" | "positive" | "warning" | "danger"> = {
  award: "positive",
  reversal: "danger",
  adjustment: "warning",
  expiry: "neutral",
};

export interface CreditEntriesProps {
  className?: string;
  entries: CreditLedgerEntry[];
  label?: string;
}

export function CreditEntries({
  className,
  entries,
  label = "Credit ledger",
}: CreditEntriesProps) {
  if (entries.length === 0) {
    return (
      <p className={cn("text-sm text-carbon-muted", className)}>
        No credit entries yet
      </p>
    );
  }

  return (
    <section aria-label={label} className={cn("space-y-2", className)}>
      {entries.map((entry) => (
        <div
          className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3"
          key={entry.id}
        >
          <div className="flex items-center gap-2">
            <StatusPill tone={entryTypeTones[entry.entryType]}>
              {entryTypeLabels[entry.entryType]}
            </StatusPill>
            <span className="text-xs text-carbon-muted">
              {entry.verificationLevel.replace(/_/g, " ")}
            </span>
          </div>
          <span className={cn(
            "text-sm font-bold tabular-nums",
            entry.entryType === "award" ? "text-sage-ink" : "text-carbon-muted",
          )}>
            {entry.amount >= 0 ? "+" : ""}{entry.amount.toLocaleString()}
          </span>
        </div>
      ))}
    </section>
  );
}
