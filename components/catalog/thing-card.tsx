import Link from "next/link";

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

const conditionTones: Record<string, "neutral" | "positive" | "warning" | "danger"> = {
  excellent: "positive",
  good: "positive",
  fair: "warning",
  poor: "warning",
  unsafe: "danger",
  unknown: "neutral",
};

export interface ThingCardProps {
  className?: string;
  condition: string;
  href: string;
  id: string;
  imageUrl?: string;
  name: string;
}

export function ThingCard({
  className,
  condition,
  href,
  id,
  imageUrl,
  name,
}: ThingCardProps) {
  return (
    <Link
      className={cn("block focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bone rounded-[1.75rem]", className)}
      href={href}
    >
      <Card className="flex gap-4 p-4 sm:p-5">
        <div
          aria-hidden="true"
          className="size-16 shrink-0 overflow-hidden rounded-xl bg-surface sm:size-20"
        >
          {imageUrl ? (
            <img
              alt=""
              className="size-full object-cover"
              src={imageUrl}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-carbon-subtle">
              <svg
                aria-hidden="true"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <rect height="14" rx="2" width="18" x="3" y="5" />
                <circle cx="9" cy="10" r="1.5" />
                <path d="m21 15-5-5L6 20" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <h3 className="truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-carbon">
            {name}
          </h3>
          <p className="truncate text-xs text-carbon-subtle">
            {id}
          </p>
          <StatusPill
            tone={conditionTones[condition] ?? "neutral"}
          >
            {condition}
          </StatusPill>
        </div>
      </Card>
    </Link>
  );
}
