"use client";

import { useId } from "react";

import type { CircularActionOutcome } from "@/lib/schemas/missions-ledgers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

const OUTCOME_OPTIONS: { label: string; value: CircularActionOutcome }[] = [
  { label: "Continued use", value: "continued_use" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Repair", value: "repair" },
  { label: "Upgrade", value: "upgrade" },
  { label: "Shared", value: "share" },
  { label: "Lent", value: "lend" },
  { label: "Resold", value: "resell" },
  { label: "Transferred", value: "direct_transfer" },
  { label: "Donated", value: "donate_for_reuse" },
  { label: "Returned to manufacturer", value: "manufacturer_return" },
  { label: "Refurbished", value: "refurbish" },
  { label: "Components recovered", value: "components_recovery" },
  { label: "Recycled", value: "material_recycling" },
  { label: "Composted", value: "compost" },
  { label: "Special handling", value: "special_handling" },
  { label: "Disposed", value: "dispose" },
  { label: "Unknown", value: "unknown" },
];

export interface ClaimFormProps {
  className?: string;
  onSubmit?: (outcome: CircularActionOutcome) => void;
}

export function ClaimForm({ className, onSubmit }: ClaimFormProps) {
  const selectId = useId();

  return (
    <Card className={cn("space-y-4", className)}>
      <h3 className="text-sm font-semibold text-carbon">
        Submit verification claim
      </h3>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-carbon"
          htmlFor={selectId}
        >
          What happened to this item?
        </label>
        <select
          className="min-h-11 w-full rounded-full border border-line bg-surface px-4 text-sm text-carbon focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bone"
          id={selectId}
        >
          <option value="">Select outcome…</option>
          {OUTCOME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={() => {
          const select = document.getElementById(selectId) as HTMLSelectElement | null;
          if (select?.value) onSubmit?.(select.value as CircularActionOutcome);
        }}
      >
        Submit claim
      </Button>
    </Card>
  );
}
