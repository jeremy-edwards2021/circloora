import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Complete",
  description: "Investigation completion summary and next steps.",
};

export interface CompletePageProps {
  params: Promise<{ investigationId: string }>;
}

export default async function CompletePage({ params }: CompletePageProps) {
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
                Complete
              </h1>
            </div>
            <StatusPill tone="positive">Success</StatusPill>
          </div>
        </header>

        <div className="pt-6 pb-12 sm:pt-9">
          <DemoDisclosure />

          <Card className="mt-6 p-6 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-sage-soft">
              <Icon className="text-sage-ink" name="spark" size={24} />
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.035em]">Investigation complete</h2>
            <p className="mt-2 text-sm leading-6 text-carbon-muted">
              Circloora has finished analysing this object. Review the results, create a mission, or verify an action.
            </p>
          </Card>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href={`/thing/obj-1`}>
              <Card className="p-5 text-center transition-shadow hover:shadow-[0_18px_50px_rgba(29,33,30,0.1)]">
                <Icon className="mx-auto text-carbon-muted" name="things" size={20} />
                <p className="mt-3 text-sm font-semibold">View Passport</p>
              </Card>
            </Link>
            <Link href={`/missions`}>
              <Card className="p-5 text-center transition-shadow hover:shadow-[0_18px_50px_rgba(29,33,30,0.1)]">
                <Icon className="mx-auto text-carbon-muted" name="missions" size={20} />
                <p className="mt-3 text-sm font-semibold">Create mission</p>
              </Card>
            </Link>
            <Link href={`/plan/${investigationId}`}>
              <Card className="p-5 text-center transition-shadow hover:shadow-[0_18px_50px_rgba(29,33,30,0.1)]">
                <Icon className="mx-auto text-carbon-muted" name="arrow" size={20} />
                <p className="mt-3 text-sm font-semibold">Move plan</p>
              </Card>
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4 text-center">
              <dt className="text-xs text-carbon-subtle">Objects</dt>
              <dd className="mt-1 text-lg font-bold tracking-[-0.02em]">1</dd>
            </Card>
            <Card className="p-4 text-center">
              <dt className="text-xs text-carbon-subtle">Missions</dt>
              <dd className="mt-1 text-lg font-bold tracking-[-0.02em]">2</dd>
            </Card>
            <Card className="p-4 text-center">
              <dt className="text-xs text-carbon-subtle">Credits</dt>
              <dd className="mt-1 text-lg font-bold tracking-[-0.02em]">85</dd>
            </Card>
            <Card className="p-4 text-center">
              <dt className="text-xs text-carbon-subtle">CO₂ saved</dt>
              <dd className="mt-1 text-lg font-bold tracking-[-0.02em]">−12 kg</dd>
            </Card>
          </dl>
        </div>
      </Container>
    </>
  );
}
