import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Circloora profile and settings.",
};

const preferences = [
  { id: "p-1", label: "Repair and restore", value: "Strongly preferred", editable: true },
  { id: "p-2", label: "Donate to community", value: "Preferred", editable: true },
  { id: "p-3", label: "Sell or trade", value: "Neutral", editable: true },
  { id: "p-4", label: "Recycle responsibly", value: "Last resort", editable: true },
];

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Profile"
        actions={
          <Link
            className={buttonStyles({ size: "compact", variant: "secondary" })}
            href="/privacy"
          >
            Privacy
          </Link>
        }
      />
      <Container className="pt-2 pb-12 sm:pt-4">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent-soft">
              <Icon className="text-accent-ink" name="profile" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.025em]">Anonymous user</h2>
              <p className="mt-0.5 text-sm text-carbon-muted">
                Your data is stored locally on this device.
              </p>
            </div>
            <StatusPill tone="neutral">Local only</StatusPill>
          </div>
        </Card>

        <div className="mt-8">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Circular preferences</h2>
          <p className="mt-1 text-xs leading-5 text-carbon-subtle">
            These preferences influence pathway recommendations. Update them at any time.
          </p>
          <div className="mt-4 grid gap-3">
            {preferences.map((pref) => (
              <Card key={pref.id} className="flex items-center justify-between p-4 sm:p-5">
                <div>
                  <p className="text-sm font-semibold">{pref.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone="accent">{pref.value}</StatusPill>
                  {pref.editable ? (
                    <button
                      aria-label={`Edit ${pref.label}`}
                      className="flex size-8 items-center justify-center rounded-full text-carbon-muted transition-colors hover:bg-carbon/[0.06]"
                      type="button"
                    >
                      <Icon name="arrow" size={14} />
                    </button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Data</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className={buttonStyles({ size: "compact", variant: "secondary" })} href="/history">
              Activity history
            </Link>
            <Link className={buttonStyles({ size: "compact", variant: "secondary" })} href="/impact">
              Impact dashboard
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
