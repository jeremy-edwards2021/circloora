import type { Pathway, PathwayScore } from "@/lib/schemas/investigation-agent";
import { cn } from "@/lib/ui/cn";

export interface ComparisonViewProps {
  className?: string;
  pathways: Pathway[];
  scores: PathwayScore[];
}

const factorLabels: Record<keyof PathwayScore["factors"], string> = {
  circularValueRetained: "Circular value",
  completionProbability: "Completion",
  evidenceConfidence: "Evidence",
  deadlineFit: "Deadline fit",
  localAvailability: "Local availability",
  financialRecovery: "Financial recovery",
  effortFit: "Effort fit",
  travelFit: "Travel fit",
  preferenceMatch: "Preference match",
};

export function ComparisonView({
  className,
  pathways,
  scores,
}: ComparisonViewProps) {
  if (pathways.length === 0) return null;

  return (
    <section
      aria-label="Pathway comparison"
      className={cn("space-y-3", className)}
    >
      <h3 className="text-sm font-semibold text-carbon">
        Side-by-side comparison
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-4 text-left text-xs font-semibold text-carbon-subtle uppercase tracking-[0.06em]">
                Factor
              </th>
              {pathways.map((pathway) => (
                <th
                  className="py-2 px-3 text-left text-xs font-semibold text-carbon-subtle uppercase tracking-[0.06em]"
                  key={pathway.id}
                >
                  {pathway.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(factorLabels).map(([key, label]) => {
              const factorKey = key as keyof PathwayScore["factors"];
              return (
                <tr className="border-b border-line/50" key={key}>
                  <td className="py-2 pr-4 text-carbon-muted">{label}</td>
                  {pathways.map((pathway) => {
                    const score = scores.find(
                      (s) => s.pathwayId === pathway.id,
                    );
                    const value = score?.factors[factorKey];
                    return (
                      <td className="py-2 px-3 text-carbon" key={pathway.id}>
                        {value !== undefined ? `${value}/100` : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <td className="py-2 pr-4 font-semibold text-carbon">Total</td>
              {pathways.map((pathway) => {
                const score = scores.find(
                  (s) => s.pathwayId === pathway.id,
                );
                return (
                  <td
                    className="py-2 px-3 font-bold text-accent"
                    key={pathway.id}
                  >
                    {score?.totalScore.toFixed(1) ?? "—"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
