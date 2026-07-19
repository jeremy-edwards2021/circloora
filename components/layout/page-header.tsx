import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";

export interface PageHeaderProps {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
}

export function PageHeader({ actions, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pt-8">
      <Container className="flex min-h-14 items-end justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-[clamp(1.75rem,6vw,2.65rem)] leading-none font-semibold tracking-[-0.055em]">
            {title}
          </h1>
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </Container>
    </header>
  );
}
