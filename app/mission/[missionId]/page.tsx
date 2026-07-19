import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Mission",
  description: "Mission detail with steps, progress, and verification.",
};

export interface MissionPageProps {
  params: Promise<{ missionId: string }>;
}

const missionData = {
  "m-1": {
    name: "Repair walnut chair",
    status: "in_progress",
    objects: ["obj-1"],
    steps: [
      { id: "st-1", label: "Assess damage", status: "complete" as const },
      { id: "st-2", label: "Source materials", status: "active" as const },
      { id: "st-3", label: "Perform repair", status: "pending" as const },
      { id: "st-4", label: "Verify outcome", status: "pending" as const },
    ],
  },
};

export default async function MissionPage({ params }: MissionPageProps) {
  const { missionId } = await params;
  const mission = missionData[missionId as keyof typeof missionData];

  if (!mission) {
    return (
      <Container className="flex min-h-[72dvh] items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-[-0.035em]">Mission not found</h1>
          <p className="mt-2 text-sm text-carbon-muted">This mission does not exist.</p>
          <Link className={buttonStyles({ className: "mt-6" })} href="/missions">
            All missions
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <header className="pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pt-8">
          <div className="flex min-h-14 items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
                Mission
              </p>
              <h1 className="text-[clamp(1.75rem,6vw,2.65rem)] leading-none font-semibold tracking-[-0.055em]">
                {mission.name}
              </h1>
            </div>
            <StatusPill
              tone={mission.status === "complete" ? "positive" : mission.status === "in_progress" ? "accent" : "neutral"}
            >
              {mission.status.replace("_", " ")}
            </StatusPill>
          </div>
        </header>

        <div className="pt-6 pb-12 sm:pt-9">
          <DemoDisclosure />

          <div className="mt-6 grid gap-3">
            {mission.steps.map((step) => (
              <Card key={step.id} className="flex items-center gap-4 p-4 sm:p-5">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.status === "complete"
                      ? "bg-sage-soft text-sage-ink"
                      : step.status === "active"
                        ? "bg-accent-soft text-accent-ink"
                        : "bg-carbon/[0.06] text-carbon-muted"
                  }`}
                >
                  {step.status === "complete" ? "✓" : step.id.slice(-1)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{step.label}</p>
                </div>
                <StatusPill
                  tone={step.status === "complete" ? "positive" : step.status === "active" ? "accent" : "neutral"}
                >
                  {step.status.replace("_", " ")}
                </StatusPill>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              className={buttonStyles()}
              href={`/verify/${missionId}`}
            >
              Verify outcome
              <Icon name="arrow" size={16} />
            </Link>
            <Link
              className={buttonStyles({ variant: "secondary" })}
              href={`/plan/obj-1`}
            >
              View plan
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold tracking-[-0.01em]">Related objects</h2>
            <div className="flex flex-wrap gap-2">
              {mission.objects.map((objId) => (
                <Link
                  key={objId}
                  className={buttonStyles({ size: "compact", variant: "secondary" })}
                  href={`/thing/${objId}`}
                >
                  <Icon name="things" size={14} />
                  {objId}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
