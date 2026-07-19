import type { VerificationLevel } from "@/lib/schemas/missions-ledgers";
import { cn } from "@/lib/ui/cn";

const TIERS: { level: VerificationLevel; label: string }[] = [
  { level: "partner_verified", label: "Partner verified" },
  { level: "document_supported", label: "Document supported" },
  { level: "visually_supported", label: "Visually supported" },
  { level: "user_attested", label: "User attested" },
  { level: "insufficient_evidence", label: "Insufficient evidence" },
  { level: "rejected", label: "Rejected" },
];

export interface ResultHierarchyProps {
  className?: string;
  currentLevel: VerificationLevel;
}

export function ResultHierarchy({
  className,
  currentLevel,
}: ResultHierarchyProps) {
  const currentIndex = TIERS.findIndex(
    (tier) => tier.level === currentLevel,
  );

  return (
    <section
      aria-label="Verification result hierarchy"
      className={cn("space-y-1", className)}
    >
      <h3 className="text-xs font-semibold text-carbon-subtle uppercase tracking-[0.06em] mb-2">
        Evidence hierarchy
      </h3>
      {TIERS.map((tier, index) => {
        const active = index <= currentIndex;
        const isCurrent = tier.level === currentLevel;

        return (
          <div
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5",
              isCurrent && "bg-carbon/[0.04]",
            )}
            key={tier.level}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                active
                  ? "bg-carbon text-bone"
                  : "bg-carbon/[0.08] text-carbon-muted",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-carbon" : "text-carbon-muted",
              )}
            >
              {tier.label}
            </span>
          </div>
        );
      })}
    </section>
  );
}
