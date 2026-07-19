import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "My Circloora",
  description: "Browse your catalog of things with living Passports.",
};

const catalogItems = [
  { id: "obj-1", name: "Walnut side chair", category: "Furniture", status: "active" as const, confidence: "high" as const },
  { id: "obj-2", name: "Oak coffee table", category: "Furniture", status: "in_use" as const, confidence: "medium" as const },
  { id: "obj-3", name: "Floor lamp", category: "Lighting", status: "pending" as const, confidence: "low" as const },
];

export default function CatalogPage() {
  return (
    <>
      <PageHeader
        title="My Circloora"
        actions={
          <Link
            className={buttonStyles({ size: "compact" })}
            href="/start"
          >
            <Icon name="camera" size={14} />
            Add thing
          </Link>
        }
      />
      <Container className="pt-2 pb-12 sm:pt-4">
        <p className="mb-6 text-sm leading-6 text-carbon-muted">
          Every thing you have scanned lives here. Select a Passport to see its story, value, and next move.
        </p>

        {catalogItems.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-carbon/[0.06]">
              <Icon name="things" size={24} />
            </div>
            <h2 className="text-lg font-semibold tracking-[-0.025em]">No things yet</h2>
            <p className="mt-1.5 max-w-xs text-sm leading-6 text-carbon-muted">
              Scan your first object to create a living Passport.
            </p>
            <Link className={buttonStyles({ className: "mt-6" })} href="/start">
              Scan a thing
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogItems.map((item) => (
              <Link key={item.id} href={`/thing/${item.id}`}>
                <Card className="h-full p-5 transition-shadow hover:shadow-[0_18px_50px_rgba(29,33,30,0.1)]">
                  <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-2xl bg-carbon/[0.03]">
                    <Icon className="text-carbon-muted" name="things" size={28} />
                  </div>
                  <h3 className="text-base font-semibold tracking-[-0.01em]">{item.name}</h3>
                  <p className="mt-0.5 text-xs text-carbon-subtle">{item.category}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusPill tone={item.status === "active" ? "positive" : item.status === "in_use" ? "accent" : "neutral"}>
                      {item.status.replace("_", " ")}
                    </StatusPill>
                    <StatusPill
                      tone={item.confidence === "high" ? "positive" : item.confidence === "medium" ? "warning" : "neutral"}
                    >
                      {item.confidence}
                    </StatusPill>
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
