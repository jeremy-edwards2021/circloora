import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Capture",
  description: "Point the camera at an object to begin its Passport.",
};

export interface LensPageProps {
  params: Promise<{ investigationId: string }>;
}

export default async function LensPage({ params }: LensPageProps) {
  const { investigationId } = await params;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1" />
      <Container className="pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <p className="text-center text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
          Investigation {investigationId}
        </p>
        <h1 className="mt-2 text-center text-[clamp(1.35rem,5vw,2rem)] leading-tight font-semibold tracking-[-0.04em]">
          Point the camera at an object
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-carbon-muted">
          Circloora will identify it and create a living Passport.
        </p>
      </Container>
    </div>
  );
}
