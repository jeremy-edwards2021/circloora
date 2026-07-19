import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Verify",
  description: "Submit evidence to verify a completed circular action.",
};

export interface VerifyPageProps {
  params: Promise<{ missionId: string }>;
}

const evidenceLevels = [
  { level: "A", label: "Documented receipt or official record", multiplier: "1.0×" },
  { level: "B", label: "Photographed outcome with timestamp", multiplier: "0.9×" },
  { level: "C", label: "Self-declared with description", multiplier: "0.7×" },
];

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { missionId } = await params;

  return (
    <div className="flex min-h-dvh flex-col">
      <Container>
        <header className="pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pt-8">
          <div className="flex min-h-14 items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
                Mission {missionId}
              </p>
              <h1 className="text-[clamp(1.75rem,6vw,2.65rem)] leading-none font-semibold tracking-[-0.055em]">
                Verify outcome
              </h1>
            </div>
          </div>
        </header>

        <div className="pt-6 pb-12 sm:pt-9">
          <DemoDisclosure />

          <p className="mt-4 text-sm leading-6 text-carbon-muted">
            Submit evidence to verify this mission. Higher evidence levels earn stronger Credit multipliers.
          </p>

          <div className="mt-6 grid gap-3">
            {evidenceLevels.map((el) => (
              <Card key={el.level} className="flex items-center gap-4 p-4 sm:p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-carbon/[0.06] text-sm font-bold">
                  {el.level}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{el.label}</p>
                </div>
                <StatusPill tone={el.level === "A" ? "positive" : el.level === "B" ? "accent" : "neutral"}>
                  {el.multiplier}
                </StatusPill>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link className={buttonStyles()} href={`/complete/${missionId}`}>
              Submit verification
              <Icon name="arrow" size={16} />
            </Link>
            <Link
              className={buttonStyles({ variant: "secondary" })}
              href={`/mission/${missionId}`}
            >
              Back to mission
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
