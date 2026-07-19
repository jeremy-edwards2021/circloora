import type { LocalPathwaySource } from "@/lib/schemas/missions-ledgers";
import { cn } from "@/lib/ui/cn";

export interface JurisdictionNoticeProps {
  className?: string;
  source: LocalPathwaySource;
}

export function JurisdictionNotice({
  className,
  source,
}: JurisdictionNoticeProps) {
  return (
    <div className={cn("rounded-xl bg-surface px-3 py-2 text-sm", className)}>
      <p className="text-carbon-muted">
        <span className="font-medium text-carbon">Jurisdiction: </span>
        {source.jurisdiction}
      </p>
      {source.coarseLocation ? (
        <p className="mt-0.5 text-carbon-muted">
          <span className="font-medium text-carbon">Location: </span>
          {source.coarseLocation}
        </p>
      ) : null}
      <p className="mt-0.5 text-xs text-carbon-subtle">
        {source.sourceType === "municipal"
          ? "Municipal information — verify with local authority"
          : source.sourceType === "manufacturer"
            ? "Manufacturer-provided information"
            : "Third-party information — verify independently"}
      </p>
    </div>
  );
}
