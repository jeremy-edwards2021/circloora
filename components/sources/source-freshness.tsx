import type { LocalPathwaySource } from "@/lib/schemas/missions-ledgers";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

const freshnessTones: Record<LocalPathwaySource["verificationStatus"], "neutral" | "positive" | "warning"> = {
  verified: "positive",
  unverified: "warning",
  expired: "neutral",
};

export interface SourceFreshnessProps {
  className?: string;
  source: LocalPathwaySource;
}

export function SourceFreshness({
  className,
  source,
}: SourceFreshnessProps) {
  const daysUntilExpiry = Math.round(
    (new Date(source.expiresAt).getTime() - Date.now()) / 86_400_000,
  );

  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2", className)}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-carbon">
          {source.title}
        </p>
        <p className="truncate text-xs text-carbon-muted">
          {source.organization}
        </p>
        {daysUntilExpiry > 0 ? (
          <p className="mt-0.5 text-xs text-carbon-subtle">
            Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-danger">
            Expired
          </p>
        )}
      </div>
      <StatusPill tone={freshnessTones[source.verificationStatus]}>
        {source.verificationStatus}
      </StatusPill>
    </div>
  );
}
