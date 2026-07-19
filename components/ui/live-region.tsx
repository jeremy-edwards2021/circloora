import type { HTMLAttributes } from "react";

import { cn } from "@/lib/ui/cn";

export interface LiveRegionProps extends HTMLAttributes<HTMLDivElement> {
  atomic?: boolean;
  politeness?: "polite" | "assertive";
  visuallyHidden?: boolean;
}

export function LiveRegion({
  atomic = true,
  className,
  politeness = "polite",
  visuallyHidden = true,
  ...props
}: LiveRegionProps) {
  return (
    <div
      aria-atomic={atomic}
      aria-live={politeness}
      className={cn(
        visuallyHidden &&
          "absolute size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]",
        className,
      )}
      role={politeness === "assertive" ? "alert" : "status"}
      {...props}
    />
  );
}
