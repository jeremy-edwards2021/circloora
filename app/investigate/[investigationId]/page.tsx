import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Investigation",
  description: "Your Circloora agent is analysing this object and gathering evidence.",
};

export interface InvestigatePageProps {
  params: Promise<{ investigationId: string }>;
}

const steps = [
  { id: "s1", label: "Visual analysis", status: "complete" as const },
  { id: "s2", label: "Value estimation", status: "active" as const },
  { id: "s3", label: "Pathway search", status: "pending" as const },
  { id: "s4", label: "Recommendation", status: "pending" as const },
];

export default async function InvestigatePage({ params }: InvestigatePageProps) {
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
                Agent at work
              </h1>
            </div>
          </div>
        </header>

        <div className="pt-6 pb-12 sm:pt-9">
          <DemoDisclosure />

          <div className="mt-7 grid gap-3">
            {steps.map((step) => (
              <Card
                key={step.id}
                className="flex items-center gap-4 p-4 sm:p-5"
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.status === "complete"
                      ? "bg-sage-soft text-sage-ink"
                      : step.status === "active"
                        ? "bg-accent-soft text-accent-ink"
                        : "bg-carbon/[0.06] text-carbon-muted"
                  }`}
                >
                  {step.status === "complete" ? "✓" : step.id.slice(1)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{step.label}</p>
                </div>
                <StatusPill
                  tone={step.status === "complete" ? "positive" : step.status === "active" ? "accent" : "neutral"}
                >
                  {step.status}
                </StatusPill>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              className={buttonStyles()}
              href={`/plan/${investigationId}`}
            >
              View recommendations
              <Icon name="arrow" size={16} />
            </Link>
            <Link
              className={buttonStyles({ variant: "secondary" })}
              href={`/catalog`}
            >
              Back to catalog
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
