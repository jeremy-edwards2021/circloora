"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LiveRegion } from "@/components/ui/live-region";
import { StatusPill } from "@/components/ui/status-pill";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installedByEvent, setInstalledByEvent] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const standalone = useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia("(display-mode: standalone)");
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    isStandalone,
    () => false,
  );

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalledByEvent(true);
      setDeferredPrompt(null);
      setAnnouncement("Circloora is installed.");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setAnnouncement(
      choice.outcome === "accepted"
        ? "Installation accepted."
        : "Installation dismissed. You can install later.",
    );
  }

  if (standalone || installedByEvent) {
    return (
      <Card className="flex items-center justify-between gap-4">
        <div>
          <StatusPill tone="positive">Installed</StatusPill>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.035em]">
            Circloora is ready
          </h2>
          <p className="mt-1 text-sm leading-6 text-carbon-muted">
            Open it from your Home Screen for the best full-screen experience.
          </p>
        </div>
        <LiveRegion>{announcement}</LiveRegion>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <StatusPill tone="accent">iPhone &amp; iPad</StatusPill>
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.035em]">
          Add from Safari
        </h2>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-carbon-muted">
          <li className="flex gap-3">
            <span aria-hidden="true" className="step-number">
              1
            </span>
            Open this page in Safari and tap the Share button.
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="step-number">
              2
            </span>
            Choose “Add to Home Screen.”
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="step-number">
              3
            </span>
            Tap Add. Your local records remain on this device.
          </li>
        </ol>
      </Card>
      <Card>
        <StatusPill tone="neutral">Supported browsers</StatusPill>
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.035em]">
          Install when prompted
        </h2>
        <p className="mt-2 text-sm leading-6 text-carbon-muted">
          Some browsers can install Circloora directly. If the button is
          unavailable, use your browser’s app installation menu.
        </p>
        <Button
          className="mt-6 w-full"
          disabled={!deferredPrompt}
          onClick={() => void install()}
        >
          {deferredPrompt
            ? "Install Circloora"
            : "Install option not available here"}
        </Button>
        {!deferredPrompt ? (
          <p className="mt-3 text-xs leading-5 text-carbon-subtle">
            You can keep using Circloora in this browser.
          </p>
        ) : null}
      </Card>
      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
}
