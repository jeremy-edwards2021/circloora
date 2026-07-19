import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Move plan",
  description: "Timeline and steps for your circular move plan.",
};

export interface PlanPageProps {
  params: Promise<{ investigationId: string }>;
}

const timeline = [
  { day: "Week 1", action: "Assess and document condition", status: "complete" as const },
  { day: "Week 2", action: "Source repair materials", status: "active" as const },
  { day: "Week 3", action: "Perform restoration", status: "pending" as const },
  { day: "Week 4", action: "Verify and close", status: "pending" as const },
];

export default async function PlanPage({ params }: PlanPageProps) {
  const { investigationId } = await params;

  return (
    <>
      <Container>
        <header className="pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pt-8">
          <div className="flex min-h-14 items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
                Investigation {investigationId}
              </p>
              <h1 className="text-[clamp(1.75rem,6vw,2.65rem)] leading-none font-semibold tracking-[-0.055em]">
                Move plan
              </h1>
            </div>
            <Link
              className={buttonStyles({ size: "compact" })}
              href={`/missions`}
            >
              Create mission
              <Icon name="arrow" size={14} />
            </Link>
          </div>
        </header>

        <div className="pt-6 pb-12 sm:pt-9">
          <DemoDisclosure />

          <p className="mt-4 text-sm leading-6 text-carbon-muted">
            Optimized timeline for moving this object into its next life.
          </p>

          <div className="mt-6 relative">
            <div className="absolute bottom-0 left-[1.125rem] top-0 w-px bg-carbon/[0.1]" />
            <div className="space-y-6">
              {timeline.map((step, idx) => (
                <div key={idx} className="relative flex gap-4 pl-[2.75rem]">
                  <div
                    className={`absolute left-0 flex size-[2.25rem] items-center justify-center rounded-full text-xs font-bold ${
                      step.status === "complete"
                        ? "bg-sage-soft text-sage-ink"
                        : step.status === "active"
                          ? "bg-accent-soft text-accent-ink"
                          : "bg-carbon/[0.06] text-carbon-muted"
                    }`}
                  >
                    {step.status === "complete" ? "✓" : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold tracking-[0.08em] text-carbon-subtle uppercase">{step.day}</p>
                    <p className="mt-0.5 text-sm font-medium">{step.action}</p>
                  </div>
                  <StatusPill
                    tone={step.status === "complete" ? "positive" : step.status === "active" ? "accent" : "neutral"}
                  >
                    {step.status.replace("_", " ")}
                  </StatusPill>
                </div>
              ))}
            </div>
          </div>

          <Card className="mt-8 p-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
              Optimisation summary
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-carbon-subtle">Duration</dt>
                <dd className="text-sm font-medium">4 weeks</dd>
              </div>
              <div>
                <dt className="text-xs text-carbon-subtle">Steps</dt>
                <dd className="text-sm font-medium">{timeline.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-carbon-subtle">CO₂ impact</dt>
                <dd className="text-sm font-medium">Est. −12 kg</dd>
              </div>
              <div>
                <dt className="text-xs text-carbon-subtle">Confidence</dt>
                <dd className="text-sm font-medium">High</dd>
              </div>
            </dl>
          </Card>
        </div>
      </Container>
    </>
  );
}
