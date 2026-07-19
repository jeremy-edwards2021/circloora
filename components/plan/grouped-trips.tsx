import type { MovePlan } from "@/lib/schemas/missions-ledgers";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";

export interface GroupedTripsProps {
  className?: string;
  plan: MovePlan;
}

export function GroupedTrips({
  className,
  plan,
}: GroupedTripsProps) {
  if (plan.groupedTrips.length === 0) {
    return (
      <p className={cn("text-sm text-carbon-muted", className)}>
        No grouped trips
      </p>
    );
  }

  return (
    <section aria-label="Grouped trips" className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-carbon">Grouped trips</h3>
      {plan.groupedTrips.map((trip) => (
        <Card className="flex items-center gap-3 p-4" key={trip.id}>
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-carbon/[0.06] text-xs font-bold text-carbon"
          >
            {trip.missionIds.length}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-carbon">{trip.label}</p>
            <p className="text-xs text-carbon-muted">
              {trip.missionIds.length} mission{trip.missionIds.length !== 1 ? "s" : ""}
            </p>
          </div>
        </Card>
      ))}
    </section>
  );
}
