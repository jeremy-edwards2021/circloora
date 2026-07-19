import type { CircularActionEntry, CircularValueEntry } from "@/lib/schemas/missions-ledgers";
import { cn } from "@/lib/ui/cn";

interface HistoryItem {
  date: string;
  label: string;
  kind: "action" | "value";
}

export interface ObjectHistoryProps {
  actionEntries?: CircularActionEntry[];
  className?: string;
  valueEntries?: CircularValueEntry[];
}

export function ObjectHistory({
  actionEntries = [],
  className,
  valueEntries = [],
}: ObjectHistoryProps) {
  const items: HistoryItem[] = [
    ...actionEntries.map((entry) => ({
      date: entry.completedAt,
      label: entry.outcome.replace(/_/g, " "),
      kind: "action" as const,
    })),
    ...valueEntries.map((entry) => ({
      date: entry.calculatedAt,
      label: `${entry.effortMinutes.low}–${entry.effortMinutes.high} min effort`,
      kind: "value" as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  if (items.length === 0) {
    return (
      <p className={cn("text-sm text-carbon-muted", className)}>
        No history yet
      </p>
    );
  }

  return (
    <section aria-label="Object history" className={cn("space-y-1", className)}>
      <ol className="relative">
        {items.map((item, index) => (
          <li className="flex gap-3 pb-4 last:pb-0" key={index}>
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2.5 rounded-full border-2",
                  item.kind === "action"
                    ? "border-sage bg-sage-soft"
                    : "border-accent bg-accent-soft",
                )}
              />
              {index < items.length - 1 ? (
                <span aria-hidden="true" className="mt-1 w-px flex-1 bg-line" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-carbon capitalize">
                {item.label}
              </p>
              <p className="text-xs text-carbon-muted">
                {new Date(item.date).toLocaleDateString()}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
