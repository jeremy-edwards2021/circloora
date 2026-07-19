import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Review the objects identified in this room.",
};

export interface InventoryPageProps {
  params: Promise<{ investigationId: string }>;
}

const candidates = [
  { id: "obj-1", name: "Walnut side chair", confidence: "high" as const, status: "reviewed" as const },
  { id: "obj-2", name: "Oak coffee table", confidence: "medium" as const, status: "pending" as const },
  { id: "obj-3", name: "Floor lamp", confidence: "low" as const, status: "pending" as const },
];

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { investigationId } = await params;

  return (
    <>
      <PageHeader
        eyebrow={`Investigation ${investigationId}`}
        title="Room inventory"
        actions={
          <Link
            className={buttonStyles({ size: "compact", variant: "secondary" })}
            href={`/investigate/${investigationId}`}
          >
            Investigate
            <Icon name="arrow" size={14} />
          </Link>
        }
      />
      <Container className="pt-2 pb-12 sm:pt-4">
        <div className="mb-6">
          <DemoDisclosure />
        </div>

        <p className="mb-5 text-sm leading-6 text-carbon-muted">
          Review the objects Circloora identified and confirm which ones to investigate further.
        </p>

        <div className="grid gap-3">
          {candidates.map((item) => (
            <Card key={item.id} className="flex items-center justify-between p-4 sm:p-5">
              <div>
                <h3 className="text-base font-semibold tracking-[-0.01em]">{item.name}</h3>
                <p className="mt-0.5 text-xs text-carbon-subtle">ID: {item.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill
                  tone={item.confidence === "high" ? "positive" : item.confidence === "medium" ? "warning" : "neutral"}
                >
                  {item.confidence}
                </StatusPill>
                <StatusPill tone={item.status === "reviewed" ? "accent" : "neutral"}>
                  {item.status}
                </StatusPill>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            className={buttonStyles({ variant: "secondary" })}
            href={`/lens/${investigationId}`}
          >
            <Icon name="camera" size={16} />
            Add more objects
          </Link>
        </div>
      </Container>
    </>
  );
}
