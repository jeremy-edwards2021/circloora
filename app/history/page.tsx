import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "History",
  description: "Your activity history and circular action timeline.",
};

const activity = [
  { id: "a-1", date: "2026-07-18", action: "Repaired walnut side chair", type: "mission" as const, points: 85 },
  { id: "a-2", date: "2026-07-17", action: "Created Passport for floor lamp", type: "catalog" as const, points: null },
  { id: "a-3", date: "2026-07-15", action: "Donated 5 books", type: "mission" as const, points: 40 },
  { id: "a-4", date: "2026-07-14", action: "Verified donation outcome", type: "verification" as const, points: null },
  { id: "a-5", date: "2026-07-10", action: "Sold oak coffee table", type: "mission" as const, points: 62 },
];

const typeConfig = {
  mission: { label: "Mission", tone: "accent" as const },
  catalog: { label: "Catalog", tone: "neutral" as const },
  verification: { label: "Verification", tone: "positive" as const },
};

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="History" />
      <Container className="pt-2 pb-12 sm:pt-4">
        <p className="mb-6 text-sm leading-6 text-carbon-muted">
          Your complete circular activity timeline.
        </p>

        {activity.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <h2 className="text-lg font-semibold tracking-[-0.025em]">No activity yet</h2>
            <p className="mt-1.5 max-w-xs text-sm leading-6 text-carbon-muted">
              Your circular actions will appear here once you start investigating.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute bottom-0 left-[1.125rem] top-0 w-px bg-carbon/[0.1]" />
            <div className="space-y-6">
              {activity.map((entry) => {
                const config = typeConfig[entry.type];
                return (
                  <div key={entry.id} className="relative flex gap-4 pl-[2.75rem]">
                    <div className="absolute left-0 flex size-[2.25rem] items-center justify-center rounded-full bg-carbon/[0.06] text-xs font-bold text-carbon-muted">
                      <span aria-hidden="true">•</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-carbon-subtle">{entry.date}</p>
                      <p className="mt-0.5 text-sm font-medium">{entry.action}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={config.tone}>{config.label}</StatusPill>
                      {entry.points !== null ? (
                        <span className="text-sm font-bold text-sage-ink">+{entry.points}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
