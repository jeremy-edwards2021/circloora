import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export const metadata: Metadata = {
  title: "Install",
  description: "Install Circloora on your iPhone or supported browser.",
};

export default function InstallPage() {
  return (
    <>
      <PageHeader eyebrow="Use it like an app" title="Install Circloora" />
      <Container className="pt-6 pb-12 sm:pt-9">
        <p className="max-w-2xl text-base leading-7 text-carbon-muted">
          Keep Circloora within reach and reopen your saved local records even
          when your connection is unreliable.
        </p>
        <div className="mt-7">
          <InstallPrompt />
        </div>
        <p className="mt-6 max-w-2xl text-xs leading-5 text-carbon-subtle">
          Installation does not create an account or upload your local catalog.
          Live analysis and current local guidance still require a connection.
        </p>
      </Container>
    </>
  );
}
