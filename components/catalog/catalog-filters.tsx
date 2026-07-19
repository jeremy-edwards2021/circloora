"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

export interface FilterOption {
  label: string;
  value: string;
}

export interface CatalogFiltersProps {
  className?: string;
  onQueryChange?: (query: string) => void;
  onSortChange?: (sort: string) => void;
  query?: string;
  queryPlaceholder?: string;
  sort?: string;
  sortOptions?: FilterOption[];
}

export function CatalogFilters({
  className,
  onQueryChange,
  onSortChange,
  query = "",
  queryPlaceholder = "Search things…",
  sort = "",
  sortOptions,
}: CatalogFiltersProps) {
  const inputId = useId();
  const selectId = useId();

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      <div className="relative flex-1">
        <label className="sr-only" htmlFor={inputId}>
          Search
        </label>
        <input
          className="min-h-11 w-full rounded-full border border-line bg-surface px-4 pl-10 text-sm text-carbon placeholder:text-carbon-subtle focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bone"
          id={inputId}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder={queryPlaceholder}
          type="search"
          value={query}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-carbon-subtle"
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4.3-4.3" />
          </svg>
        </span>
      </div>
      {sortOptions && sortOptions.length > 0 ? (
        <div>
          <label className="sr-only" htmlFor={selectId}>
            Sort by
          </label>
          <select
            className="min-h-11 w-full rounded-full border border-line bg-surface px-4 text-sm text-carbon focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bone sm:w-auto"
            id={selectId}
            onChange={(event) => onSortChange?.(event.target.value)}
            value={sort}
          >
            <option value="">Sort by</option>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
