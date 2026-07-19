import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface EmptyStateProps {
  className?: string;
  description?: string;
  title?: string;
}

export function EmptyState({
  className,
  description = "Scan your first item to build your circular ownership catalog",
  title = "No things yet",
}: EmptyStateProps) {
  return (
    <Card className={cn("text-center", className)}>
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-carbon/[0.04]">
        <svg
          aria-hidden="true"
          className="size-7 text-carbon-subtle"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <rect height="7" rx="2" width="7" x="3" y="3" />
          <rect height="7" rx="2" width="7" x="14" y="3" />
          <rect height="7" rx="2" width="7" x="3" y="14" />
          <rect height="7" rx="2" width="7" x="14" y="14" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-carbon">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-carbon-muted">
        {description}
      </p>
      <Link
        className={buttonStyles({ className: "mt-5" })}
        href="/lens/new"
      >
        Scan an item
      </Link>
    </Card>
  );
}
