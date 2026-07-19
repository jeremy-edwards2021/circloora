import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Passport",
  description: "Passport detail — a living record for a single thing.",
};

export interface ThingPageProps {
  params: Promise<{ objectId: string }>;
}

const passports = {
  "obj-1": {
    name: "Walnut side chair",
    category: "Furniture",
    material: "Solid walnut",
    confidence: "high" as const,
    value: "$90–$140",
    effort: "Low",
    status: "In use",
    nextMove: "Repair the loose joint",
    history: [
      { date: "2026-07-18", event: "Passport created" },
      { date: "2026-07-18", event: "Visual analysis complete" },
    ],
  },
};

export default async function ThingPage({ params }: ThingPageProps) {
  const { objectId } = await params;
  const thing = passports[objectId as keyof typeof passports];

  if (!thing) {
    return (
      <Container className="flex min-h-[72dvh] items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-[-0.035em]">Thing not found</h1>
          <p className="mt-2 text-sm text-carbon-muted">
            This object does not exist in your catalog.
          </p>
          <Link className={buttonStyles({ className: "mt-6" })} href="/catalog">
            Back to catalog
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
                Circloora Passport
              </p>
              <h1 className="text-[clamp(1.75rem,6vw,2.65rem)] leading-none font-semibold tracking-[-0.055em]">
                {thing.name}
              </h1>
            </div>
            <StatusPill tone={thing.confidence === "high" ? "positive" : thing.confidence === "medium" ? "warning" : "neutral"}>
              {thing.confidence} confidence
            </StatusPill>
          </div>
        </header>

        <div className="pt-6 pb-12 sm:pt-9">
          <DemoDisclosure />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">Details</p>
              <dl className="mt-4 space-y-3">
                <div><dt className="text-xs text-carbon-subtle">Category</dt><dd className="text-sm font-medium">{thing.category}</dd></div>
                <div><dt className="text-xs text-carbon-subtle">Material</dt><dd className="text-sm font-medium">{thing.material}</dd></div>
                <div><dt className="text-xs text-carbon-subtle">Status</dt><dd className="text-sm font-medium">{thing.status}</dd></div>
              </dl>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">Circular value</p>
              <dl className="mt-4 space-y-3">
                <div><dt className="text-xs text-carbon-subtle">Remaining value</dt><dd className="text-sm font-medium">{thing.value}</dd></div>
                <div><dt className="text-xs text-carbon-subtle">Effort</dt><dd className="text-sm font-medium">{thing.effort}</dd></div>
              </dl>
            </Card>
          </div>

          <Card className="mt-4 p-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">Best next move</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-lg font-semibold tracking-[-0.025em]">{thing.nextMove}</p>
              <Link
                className={buttonStyles({ size: "compact" })}
                href={`/plan/obj-1`}
              >
                Make a plan
                <Icon name="arrow" size={14} />
              </Link>
            </div>
          </Card>

          <Card className="mt-4 p-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">History</p>
            <ol className="mt-4 space-y-3">
              {thing.history.map((entry, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <span className="shrink-0 text-xs text-carbon-subtle">{entry.date}</span>
                  <span className="h-px flex-1 bg-carbon/[0.08]" />
                  <span>{entry.event}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </Container>
    </>
  );
}
