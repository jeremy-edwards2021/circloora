"use client";

import type { ObjectPassport } from "@/lib/schemas/profile-catalog";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface RoomCandidatesProps {
  className?: string;
  items: ObjectPassport[];
  onSelect?: (objectId: string) => void;
  selectedIds?: string[];
}

export function RoomCandidates({
  className,
  items,
  onSelect,
  selectedIds = [],
}: RoomCandidatesProps) {
  return (
    <section aria-label="Detected items" className={cn("space-y-2", className)}>
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);

        return (
          <button
            className={cn(
              "w-full rounded-xl border-2 p-4 text-left transition-colors duration-200",
              selected
                ? "border-accent bg-accent-soft"
                : "border-line bg-surface hover:border-carbon/20",
            )}
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            type="button"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  selected
                    ? "border-accent bg-accent text-white"
                    : "border-carbon/30 text-carbon-subtle",
                )}
              >
                {selected ? "✓" : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-carbon">
                  {item.userConfirmedName}
                </p>
                <p className="text-xs text-carbon-muted">
                  {item.category}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
