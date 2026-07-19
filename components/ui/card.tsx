import type { HTMLAttributes } from "react";

import { cn } from "@/lib/ui/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-line/90 bg-surface p-5 shadow-[0_18px_50px_rgba(29,33,30,0.06)] sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
