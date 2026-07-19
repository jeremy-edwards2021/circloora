import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface PermissionRecoveryProps {
  className?: string;
  onRetry?: () => void;
  reason?: string;
}

export function PermissionRecovery({
  className,
  onRetry,
  reason = "Camera access is required to scan your items",
}: PermissionRecoveryProps) {
  return (
    <Card
      className={cn("text-center", className)}
      role="alert"
    >
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-soft">
        <span aria-hidden="true" className="text-2xl text-amber-ink">!</span>
      </div>
      <h2 className="text-lg font-semibold text-carbon">
        Camera permission needed
      </h2>
      <p className="mt-2 text-sm leading-6 text-carbon-muted">
        {reason}
      </p>
      <p className="mt-1 text-xs text-carbon-subtle">
        You can update this in your device settings
      </p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} size="compact">
          Try again
        </Button>
      ) : null}
    </Card>
  );
}
