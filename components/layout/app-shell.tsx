"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PrimaryNavigation } from "@/components/layout/primary-navigation";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";

const focusedRoutePrefixes = ["/lens/", "/inventory/", "/verify/"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const focused = focusedRoutePrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  return (
    <div className={focused ? "app-frame app-frame-focused" : "app-frame"}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <OfflineBanner />
      <main id="main-content">{children}</main>
      {focused ? null : <PrimaryNavigation />}
      <ServiceWorkerRegistrar />
    </div>
  );
}
