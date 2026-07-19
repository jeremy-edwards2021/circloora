import type { HTMLAttributes } from "react";

import { cn } from "@/lib/ui/cn";

type Tone = "neutral" | "accent" | "positive" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-carbon/[0.06] text-carbon-muted",
  accent: "bg-accent-soft text-accent-ink",
  positive: "bg-sage-soft text-sage-ink",
  warning: "bg-amber-soft text-amber-ink",
  danger: "bg-danger-soft text-danger-dark",
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone | undefined;
}

export function StatusPill({
  className,
  tone = "neutral",
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.01em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
