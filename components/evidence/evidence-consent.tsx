"use client";

import type { EvidenceAsset } from "@/lib/schemas/profile-catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

const consentLabels: Record<EvidenceAsset["consent"]["basis"], string> = {
  transient_analysis: "Used for analysis only, not stored",
  local_retention: "Saved locally on this device",
  cloud_retention: "Saved securely in the cloud",
};

export interface EvidenceConsentProps {
  asset: EvidenceAsset;
  className?: string;
  onConsentChange?: (consented: boolean) => void;
}

export function EvidenceConsent({
  asset,
  className,
  onConsentChange,
}: EvidenceConsentProps) {
  const isTransient = asset.consent.basis === "transient_analysis";

  return (
    <Card className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-carbon">
        Evidence consent
      </h3>

      <p className="text-sm leading-6 text-carbon-muted">
        This evidence is: {consentLabels[asset.consent.basis]}
      </p>

      {isTransient ? (
        <p className="text-xs text-carbon-subtle">
          Raw images are ephemeral by default. Tap below to keep a sanitized
          version for future reference.
        </p>
      ) : null}

      {onConsentChange ? (
        <div className="flex gap-2">
          <Button
            onClick={() => onConsentChange(true)}
            size="compact"
          >
            Keep evidence
          </Button>
          <Button
            onClick={() => onConsentChange(false)}
            size="compact"
            variant="secondary"
          >
            Discard
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
