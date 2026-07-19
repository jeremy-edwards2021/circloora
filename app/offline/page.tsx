import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { ViewStatePanel } from "@/components/states/view-state";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <Container className="flex min-h-[72dvh] items-center justify-center py-12">
      <ViewStatePanel
        action={{ href: "/", label: "Return home" }}
        description="Your saved Circloora records are still available. Live analysis and current local guidance need a connection."
        state="offline"
        title="You’re offline"
      />
    </Container>
  );
}
