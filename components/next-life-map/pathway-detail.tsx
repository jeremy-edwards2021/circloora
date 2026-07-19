import type { Pathway } from "@/lib/schemas/investigation-agent";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface PathwayDetailProps {
  className?: string;
  pathway: Pathway;
}

export function PathwayDetail({ className, pathway }: PathwayDetailProps) {
  return (
    <Card className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-base font-semibold text-carbon">{pathway.title}</h3>
        <p className="mt-1 text-sm leading-6 text-carbon-muted">
          {pathway.reason}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {pathway.estimatedValueMinor ? (
          <div className="rounded-xl bg-surface p-3">
            <p className="text-xs text-carbon-muted">Estimated value</p>
            <p className="mt-0.5 font-medium text-carbon">
              {((pathway.estimatedValueMinor.low) / 100).toFixed(2)}–{((pathway.estimatedValueMinor.high) / 100).toFixed(2)} {pathway.estimatedValueMinor.currency}
            </p>
          </div>
        ) : null}

        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-carbon-muted">Effort</p>
          <p className="mt-0.5 font-medium text-carbon">
            {pathway.effortMinutes.low}–{pathway.effortMinutes.high} min
          </p>
        </div>

        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-carbon-muted">Travel</p>
          <p className="mt-0.5 font-medium text-carbon">
            {pathway.travelMeters.low >= 1000
              ? `${(pathway.travelMeters.low / 1000).toFixed(1)} km`
              : `${pathway.travelMeters.low} m`}
            {pathway.travelMeters.high > 0
              ? pathway.travelMeters.high >= 1000
                ? `–${(pathway.travelMeters.high / 1000).toFixed(1)} km`
                : `–${pathway.travelMeters.high} m`
              : null}
          </p>
        </div>

        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-carbon-muted">Time to complete</p>
          <p className="mt-0.5 font-medium text-carbon">
            {pathway.completionDays.low}–{pathway.completionDays.high} days
          </p>
        </div>
      </div>

      {pathway.requirements.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-carbon-subtle uppercase tracking-[0.06em] mb-1.5">
            Requirements
          </p>
          <ul className="list-inside list-disc text-sm text-carbon-muted space-y-0.5">
            {pathway.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {pathway.disqualifiers.length > 0 ? (
        <div className="rounded-xl bg-amber-soft p-3">
          <p className="text-xs font-semibold text-amber-ink uppercase tracking-[0.06em] mb-1.5">
            Disqualifiers
          </p>
          <ul className="list-inside list-disc text-sm text-amber-ink space-y-0.5">
            {pathway.disqualifiers.map((d, index) => (
              <li key={index}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
