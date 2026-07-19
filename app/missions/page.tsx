import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Missions",
  description: "Your circular action missions and their progress.",
};

const missions = [
  { id: "m-1", name: "Repair walnut chair", status: "in_progress" as const, objectsCount: 1, progress: 60 },
  { id: "m-2", name: "Donate books", status: "pending" as const, objectsCount: 5, progress: 0 },
  { id: "m-3", name: "Sell coffee table", status: "complete" as const, objectsCount: 1, progress: 100 },
];

export default function MissionsPage() {
  return (
    <>
      <PageHeader title="Missions" />
      <Container className="pt-2 pb-12 sm:pt-4">
        <p className="mb-6 text-sm leading-6 text-carbon-muted">
          Missions guide your things toward their best next life. Track progress, verify outcomes, and earn Credits.
        </p>

        {missions.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-carbon/[0.06]">
              <Icon name="missions" size={24} />
            </div>
            <h2 className="text-lg font-semibold tracking-[-0.025em]">No missions yet</h2>
            <p className="mt-1.5 max-w-xs text-sm leading-6 text-carbon-muted">
              Start an investigation to generate circular action missions.
            </p>
            <Link className={buttonStyles({ className: "mt-6" })} href="/start">
              Scan a thing
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {missions.map((mission) => (
              <Link key={mission.id} href={`/mission/${mission.id}`}>
                <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-[0_18px_50px_rgba(29,33,30,0.1)] sm:p-5">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold tracking-[-0.01em]">{mission.name}</h3>
                    <p className="mt-0.5 text-xs text-carbon-subtle">
                      {mission.objectsCount} {mission.objectsCount === 1 ? "object" : "objects"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-2 w-20 overflow-hidden rounded-full bg-carbon/[0.08]">
                      <div
                        className={`rounded-full transition-all ${
                          mission.progress === 100
                            ? "bg-sage-ink"
                            : mission.progress > 0
                              ? "bg-accent-ink"
                              : ""
                        }`}
                        style={{ width: `${mission.progress}%` }}
                      />
                    </div>
                    <StatusPill
                      tone={mission.status === "complete" ? "positive" : mission.status === "in_progress" ? "accent" : "neutral"}
                    >
                      {mission.status.replace("_", " ")}
                    </StatusPill>
                    <Icon className="text-carbon-muted" name="arrow" size={16} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
