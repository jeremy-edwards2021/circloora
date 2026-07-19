import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Methodology",
  description: "The circular methodology behind Circloora's recommendations.",
};

const weights = [
  { factor: "Circular value retained", weight: "25%", description: "How much of the object's value is preserved through this pathway." },
  { factor: "Completion probability", weight: "18%", description: "Likelihood that the pathway can be completed successfully." },
  { factor: "Evidence confidence", weight: "12%", description: "Confidence level of the evidence supporting this recommendation." },
  { factor: "Deadline fit", weight: "12%", description: "How well the pathway fits within available time constraints." },
  { factor: "Local availability", weight: "10%", description: "Availability of local providers, services, or drop-off points." },
  { factor: "Financial recovery", weight: "9%", description: "Expected financial return or cost avoidance from the pathway." },
  { factor: "Effort fit", weight: "6%", description: "Estimated effort required relative to user capacity." },
  { factor: "Travel fit", weight: "5%", description: "Convenience of travel required for this pathway." },
  { factor: "Preference match", weight: "3%", description: "Alignment with user's stated circular preferences." },
];

const creditFormula = [
  { component: "Base Action Score", range: "Determined by action type" },
  { component: "× Verification Multiplier", range: "1.0× (A) / 0.9× (B) / 0.7× (C)" },
  { component: "× Value Retention Multiplier", range: "0.85–1.15" },
  { component: "× Effort Multiplier", range: "0.95–1.10" },
  { component: "× Environmental Confidence Modifier", range: "0.80–1.20" },
];

export default function MethodologyPage() {
  return (
    <>
      <PageHeader title="Methodology" />
      <Container className="pt-2 pb-12 sm:pt-4">
        <p className="max-w-2xl text-base leading-7 text-carbon-muted">
          Circloora uses a deterministic, transparent methodology to rank circular pathways and calculate Credits.
          All weights, factors, and modifiers are code-owned and never depend on model intuition.
        </p>

        <Card className="mt-8 p-5">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Pathway scoring weights</h2>
          <p className="mt-1 text-xs leading-5 text-carbon-subtle">
            Eligible pathways are scored using the following weighted factors.
            A pathway must pass safety, legality, and condition gates before scoring applies.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-carbon/[0.08] text-left text-xs font-semibold text-carbon-subtle uppercase tracking-[0.08em]">
                  <th className="pb-2 pr-4">Factor</th>
                  <th className="pb-2 pr-4">Weight</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {weights.map((row) => (
                  <tr key={row.factor} className="border-b border-carbon/[0.04]">
                    <td className="py-2.5 pr-4 font-medium">{row.factor}</td>
                    <td className="py-2.5 pr-4 font-semibold text-accent-ink">{row.weight}</td>
                    <td className="py-2.5 text-carbon-muted">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="mt-6 p-5">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Credit calculation</h2>
          <p className="mt-1 text-xs leading-5 text-carbon-subtle">
            Credits are calculated once using unrounded factors and rounded once using round-half-up.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-carbon/[0.08] text-left text-xs font-semibold text-carbon-subtle uppercase tracking-[0.08em]">
                  <th className="pb-2 pr-4">Component</th>
                  <th className="pb-2">Range</th>
                </tr>
              </thead>
              <tbody>
                {creditFormula.map((row) => (
                  <tr key={row.component} className="border-b border-carbon/[0.04]">
                    <td className="py-2.5 pr-4 font-medium">{row.component}</td>
                    <td className="py-2.5 text-carbon-muted">{row.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="mt-6 p-5">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Climate impact</h2>
          <p className="mt-3 text-sm leading-6 text-carbon-muted">
            Climate comparisons use explicit baseline and alternative intervals under a common functional unit
            and time horizon. Operational products include production, intervention, transport, operation,
            refrigerant where material, and end-of-life stages. A result crossing zero means direction is
            uncertain. Tier D values are never displayed as a specific number.
          </p>
        </Card>

        <Card className="mt-6 p-5">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Safety and determinism</h2>
          <p className="mt-3 text-sm leading-6 text-carbon-muted">
            All pathways pass safety, legality, authority, condition, recall or eligibility, current-source,
            deadline, and evidence gates before scoring. No model intuition supplies emissions factors,
            scores, or eligibility decisions. Safety and eligibility constraints can force a score to zero.
          </p>
        </Card>
      </Container>
    </>
  );
}
