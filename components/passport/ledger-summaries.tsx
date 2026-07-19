import type { CreditLedgerEntry, CircularActionEntry, CircularValueEntry, ClimateImpactEntry } from "@/lib/schemas/missions-ledgers";
import { cn } from "@/lib/ui/cn";

interface LedgerSummary {
  label: string;
  count: number;
}

export interface LedgerSummariesProps {
  actionEntries?: CircularActionEntry[];
  className?: string;
  climateEntries?: ClimateImpactEntry[];
  creditEntries?: CreditLedgerEntry[];
  valueEntries?: CircularValueEntry[];
}

export function LedgerSummaries({
  actionEntries,
  className,
  climateEntries,
  creditEntries,
  valueEntries,
}: LedgerSummariesProps) {
  const summaries: LedgerSummary[] = [
    { label: "Actions", count: actionEntries?.length ?? 0 },
    { label: "Value entries", count: valueEntries?.length ?? 0 },
    { label: "Climate entries", count: climateEntries?.length ?? 0 },
    { label: "Credits", count: creditEntries?.length ?? 0 },
  ];

  return (
    <section
      aria-label="Ledger summaries"
      className={cn("grid grid-cols-4 gap-2", className)}
    >
      {summaries.map((summary) => (
        <div
          className="rounded-xl bg-surface p-3 text-center"
          key={summary.label}
        >
          <p className="text-xl font-bold tracking-[-0.02em] text-carbon">
            {summary.count}
          </p>
          <p className="mt-0.5 text-xs text-carbon-muted">{summary.label}</p>
        </div>
      ))}
    </section>
  );
}
