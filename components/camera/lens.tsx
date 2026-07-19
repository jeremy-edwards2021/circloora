"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

export interface LensProps {
  children?: ReactNode;
  className?: string;
  facingMode?: "user" | "environment";
  mirrored?: boolean;
  onStreamReady?: (stream: MediaStream) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export function Lens({
  children,
  className,
  facingMode = "environment",
  mirrored = false,
  onStreamReady,
  videoRef: externalVideoRef,
}: LensProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef ?? internalVideoRef;

  return (
    <div
      className={cn("relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] bg-carbon", className)}
    >
      <video
        autoPlay
        className={cn(
          "size-full object-cover",
          mirrored && "scale-x-[-1]",
        )}
        muted
        playsInline
        ref={videoRef}
      />
      {children}
    </div>
  );
}
