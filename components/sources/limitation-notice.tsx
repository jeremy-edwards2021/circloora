import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface LimitationNoticeProps {
  className?: string;
}

export function LimitationNotice({ className }: LimitationNoticeProps) {
  return (
    <Card
      className={cn("text-center", className)}
      role="status"
    >
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-carbon/[0.04]">
        <svg
          aria-hidden="true"
          className="size-5 text-carbon-subtle"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-carbon">
        No local sources available
      </h3>
      <p className="mt-1.5 text-sm leading-6 text-carbon-muted">
        We don't have provider information for your area yet. Check back
        later or try searching online for circular economy options near you.
      </p>
    </Card>
  );
}
