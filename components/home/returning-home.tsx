import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export interface ReturningHomeSummary {
  activeMissions: number;
  credits: number;
  retainedValue: string;
  thingsCount: number;
  verifiedTransfers: number;
}

export function ReturningHome({ summary }: { summary: ReturningHomeSummary }) {
  return (
    <>
      <PageHeader eyebrow="Today" title="Home" />
      <Container className="pt-6 pb-10 sm:pt-9">
        <DemoDisclosure />
        <section
          className="briefing-card mt-5"
          aria-labelledby="briefing-title"
        >
          <div>
            <StatusPill tone="accent">Next best action</StatusPill>
            <h2 id="briefing-title">Choose one thing that needs a decision.</h2>
            <p>
              A quick scan can turn an unresolved object into a saved Passport
              and a realistic next move.
            </p>
          </div>
          <Link className={buttonStyles()} href="/start?mode=single">
            Scan something
            <Icon name="camera" size={18} />
          </Link>
        </section>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="card-kicker">My Circloora</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">
                  {summary.thingsCount} Things remembered
                </h2>
              </div>
              <Link className="text-link" href="/catalog">
                View all
              </Link>
            </div>
            <dl className="summary-list mt-6">
              <div>
                <dt>Estimated retained value</dt>
                <dd>{summary.retainedValue}</dd>
              </div>
              <div>
                <dt>Active Missions</dt>
                <dd>{summary.activeMissions}</dd>
              </div>
              <div>
                <dt>Verified transfers</dt>
                <dd>{summary.verifiedTransfers}</dd>
              </div>
            </dl>
          </Card>
          <Card className="bg-carbon text-bone">
            <p className="card-kicker text-bone/55">Prototype Credits</p>
            <strong className="mt-3 block text-5xl font-semibold tracking-[-0.06em]">
              {summary.credits.toLocaleString()}
            </strong>
            <p className="mt-4 text-sm leading-6 text-bone/65">
              Non-cash, non-transferable prototype points. Not a carbon credit
              or offset.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold"
              href="/credits"
            >
              See the ledger <Icon className="ml-2" name="arrow" size={17} />
            </Link>
          </Card>
        </div>
      </Container>
    </>
  );
}
