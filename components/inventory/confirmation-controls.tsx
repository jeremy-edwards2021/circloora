"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface ConfirmationControlsProps {
  className?: string;
  onConfirmAll?: () => void;
  onRejectAll?: () => void;
  selectedCount: number;
  totalCount: number;
}

export function ConfirmationControls({
  className,
  onConfirmAll,
  onRejectAll,
  selectedCount,
  totalCount,
}: ConfirmationControlsProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <p className="text-sm text-carbon">
        <span className="font-semibold">{selectedCount}</span>
        {" "}of{" "}
        <span className="font-semibold">{totalCount}</span>
        {" "}items selected
      </p>

      <div className="flex gap-2">
        <Button
          disabled={selectedCount === 0}
          onClick={onConfirmAll}
          size="compact"
        >
          Confirm selected
        </Button>
        <Button
          onClick={onRejectAll}
          size="compact"
          variant="secondary"
        >
          Reject all
        </Button>
      </div>
    </Card>
  );
}
