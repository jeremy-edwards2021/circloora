import type { Confidence } from "@/lib/schemas/primitives";
import { cn } from "@/lib/ui/cn";

const levelStyles: Record<string, string> = {
  low: "bg-danger-soft text-danger-dark",
  medium: "bg-amber-soft text-amber-ink",
  high: "bg-sage-soft text-sage-ink",
};

export interface ConfidenceBadgeProps {
  className?: string;
  confidence: Confidence;
}

export function ConfidenceBadge({
  className,
  confidence,
}: ConfidenceBadgeProps) {
  const level = confidence.level ?? (
    confidence.score < 0.5 ? "low" : confidence.score < 0.8 ? "medium" : "high"
  );

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        levelStyles[level],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full currentColor"
      />
      {Math.round(confidence.score * 100)}% {level}
    </span>
  );
}
