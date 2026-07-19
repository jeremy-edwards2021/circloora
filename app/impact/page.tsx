import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Impact",
  description: "Your environmental impact dashboard.",
};

const impactMetrics = [
  { label: "CO₂ emissions avoided", value: "−24 kg", tier: "A" as const, tone: "positive" as const },
  { label: "Waste diverted", value: "12 kg", tier: "B" as const, tone: "accent" as const },
  { label: "Water saved", value: "180 L", tier: "B" as const, tone: "accent" as const },
  { label: "Energy saved", value: "45 kWh", tier: "C" as const, tone: "warning" as const },
];

const tierDescriptions: Record<string, string> = {
  A: "High confidence — comparable data available",
  B: "Moderate confidence — estimated with limited data",
  C: "Low confidence — indicative range only",
  D: "Unavailable — insufficient data to calculate",
};

export default function ImpactPage() {
  return (
    <>
      <PageHeader title="Impact" />
      <Container className="pt-2 pb-12 sm:pt-4">
        <DemoDisclosure />

        <p className="mt-4 text-sm leading-6 text-carbon-muted">
          Estimated environmental impact of your verified circular actions.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {impactMetrics.map((metric) => (
            <Card key={metric.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-[clamp(1.5rem,4vw,2.25rem)] leading-none font-semibold tracking-[-0.04em]">
                    {metric.value}
                  </p>
                </div>
                <StatusPill tone={metric.tone}>Tier {metric.tier}</StatusPill>
              </div>
              <p className="mt-3 text-xs leading-5 text-carbon-subtle">
                {tierDescriptions[metric.tier]}
              </p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
            About these estimates
          </p>
          <p className="mt-3 text-sm leading-6 text-carbon-muted">
            Impact values are comparative ranges based on published lifecycle assessments.
            Tier A represents confident estimates; Tier D means unavailable.
            Results that cross zero indicate uncertain direction.
          </p>
        </Card>
      </Container>
    </>
  );
}
