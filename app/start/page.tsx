import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Get started",
  description: "Create a new investigation — scan a room or a single thing.",
};

const modes = [
  {
    description: "Walk through a space and let Circloora identify the objects you own.",
    href: "/lens/new?mode=room",
    icon: "things" as const,
    label: "Scan a room",
  },
  {
    description: "Point at a single object to create its living Passport.",
    href: "/lens/new?mode=single",
    icon: "camera" as const,
    label: "Scan one thing",
  },
];

export default function StartPage() {
  return (
    <>
      <header className="pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pt-8">
        <Container className="flex items-center justify-between">
          <Link aria-label="Circloora home" className="wordmark" href="/">
            <span aria-hidden="true" className="wordmark-mark">C</span>
            Circloora
          </Link>
        </Container>
      </header>

      <Container className="pt-10 pb-16 sm:pt-14">
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
            Welcome
          </p>
          <h1 className="text-[clamp(2rem,7vw,3rem)] leading-tight font-semibold tracking-[-0.055em]">
            What would you like to investigate?
          </h1>
          <p className="mt-3 text-base leading-7 text-carbon-muted">
            Circloora creates a private, living record for every thing you scan.
            Choose how to begin.
          </p>
          <div className="mt-3 flex justify-center">
            <DemoDisclosure compact />
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {modes.map((mode) => (
            <Card key={mode.label} className="p-6">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-carbon/[0.06]">
                <Icon name={mode.icon} size={22} />
              </div>
              <h2 className="text-lg font-semibold tracking-[-0.025em]">{mode.label}</h2>
              <p className="mt-1.5 text-sm leading-6 text-carbon-muted">{mode.description}</p>
              <Link
                className={buttonStyles({ className: "mt-5 w-full", size: "compact" })}
                href={mode.href}
              >
                Start
                <Icon name="arrow" size={16} />
              </Link>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
