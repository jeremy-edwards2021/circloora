"use client";

import { useSyncExternalStore } from "react";

import { Icon } from "@/components/ui/icons";
import { LiveRegion } from "@/components/ui/live-region";

export function OfflineBanner() {
  const online = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );

  if (online) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-amber-line bg-amber-soft px-4 py-2.5 text-amber-ink">
      <div className="mx-auto flex max-w-[76rem] items-center justify-center gap-2 text-center text-xs leading-5 font-semibold sm:text-sm">
        <Icon name="wifi-off" size={17} />
        <span>
          Offline. Your saved Circloora records are available; live analysis and
          current local guidance need a connection.
        </span>
      </div>
      <LiveRegion>
        Circloora is offline. Saved records remain available.
      </LiveRegion>
    </div>
  );
}
