import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Credits",
  description: "Your circular action Credits and points overview.",
};

const creditEntries = [
  { id: "c-1", action: "Repaired walnut chair", points: 85, multiplier: "1.15×", date: "2026-07-18" },
  { id: "c-2", action: "Donated books", points: 40, multiplier: "0.95×", date: "2026-07-15" },
  { id: "c-3", action: "Sold coffee table", points: 62, multiplier: "1.05×", date: "2026-07-10" },
];

export default function CreditsPage() {
  const totalPoints = creditEntries.reduce((sum, e) => sum + e.points, 0);

  return (
    <>
      <PageHeader title="Credits" />
      <Container className="pt-2 pb-12 sm:pt-4">
        <DemoDisclosure />

        <Card className="mt-6 p-6 text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
            Total Credits
          </p>
          <p className="mt-2 text-[clamp(2.5rem,8vw,4rem)] leading-none font-semibold tracking-[-0.055em]">
            {totalPoints}
          </p>
          <p className="mt-1 text-sm text-carbon-muted">
            Across {creditEntries.length} verified action{creditEntries.length === 1 ? "" : "s"}
          </p>
        </Card>

        <div className="mt-8">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Recent entries</h2>
          <div className="mt-3 grid gap-3">
            {creditEntries.map((entry) => (
              <Card key={entry.id} className="flex items-center justify-between p-4 sm:p-5">
                <div>
                  <p className="text-sm font-semibold">{entry.action}</p>
                  <p className="mt-0.5 text-xs text-carbon-subtle">{entry.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone="accent">{entry.multiplier}</StatusPill>
                  <span className="text-lg font-bold tracking-[-0.02em]">+{entry.points}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
