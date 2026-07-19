"use client";

import { useEffect } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The production logger receives only a safe digest once the operations adapter is configured.
    void error.digest;
  }, [error]);

  return (
    <Container className="flex min-h-[70dvh] items-center justify-center py-12">
      <section className="state-panel" role="alert">
        <span aria-hidden="true" className="state-icon">
          <Icon name="spark" size={22} />
        </span>
        <h1>That view didn’t open</h1>
        <p>Your saved work is unchanged. Try opening this step again.</p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </section>
    </Container>
  );
}
