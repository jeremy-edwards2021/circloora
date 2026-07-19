"use client";

import type { Space } from "@/lib/schemas/profile-catalog";
import { cn } from "@/lib/ui/cn";

export interface SpacesViewProps {
  className?: string;
  onSelect?: (spaceId: string | null) => void;
  selectedSpaceId?: string | null;
  spaces: Space[];
}

export function SpacesView({
  className,
  onSelect,
  selectedSpaceId,
  spaces,
}: SpacesViewProps) {
  return (
    <nav aria-label="Filter by space" className={cn("flex gap-2 overflow-x-auto pb-1", className)}>
      <button
        className={cn(
          "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
          selectedSpaceId === null || selectedSpaceId === undefined
            ? "bg-carbon text-bone"
            : "bg-carbon/[0.06] text-carbon hover:bg-carbon/[0.1]",
        )}
        onClick={() => onSelect?.(null)}
        type="button"
      >
        All
      </button>
      {spaces.map((space) => (
        <button
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
            selectedSpaceId === space.id
              ? "bg-carbon text-bone"
              : "bg-carbon/[0.06] text-carbon hover:bg-carbon/[0.1]",
          )}
          key={space.id}
          onClick={() => onSelect?.(space.id)}
          type="button"
        >
          {space.name}
        </button>
      ))}
    </nav>
  );
}
