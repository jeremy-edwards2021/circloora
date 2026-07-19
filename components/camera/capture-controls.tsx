"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";

export interface CaptureControlsProps {
  className?: string;
  disabled?: boolean;
  onCapture?: () => void;
  onUpload?: () => void;
}

export function CaptureControls({
  className,
  disabled = false,
  onCapture,
  onUpload,
}: CaptureControlsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-6", className)}>
      <Button
        aria-label="Upload image"
        disabled={disabled}
        onClick={onUpload}
        size="icon"
        variant="quiet"
      >
        <Icon name="things" size={22} />
      </Button>
      <button
        aria-label="Capture photo"
        className={cn(
          "size-16 rounded-full border-[3px] border-white bg-transparent transition-transform duration-200 active:scale-90",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus focus-visible:ring-offset-2",
          disabled && "pointer-events-none opacity-45",
        )}
        disabled={disabled}
        onClick={onCapture}
        type="button"
      />
      <div className="w-11" />
    </div>
  );
}
