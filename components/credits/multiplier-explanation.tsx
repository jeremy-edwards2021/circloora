import { cn } from "@/lib/ui/cn";

export interface MultiplierExplanationProps {
  className?: string;
}

export function MultiplierExplanation({
  className,
}: MultiplierExplanationProps) {
  return (
    <section
      aria-label="How credit multipliers work"
      className={cn("space-y-3 text-sm leading-6", className)}
    >
      <h3 className="font-semibold text-carbon">Understanding multipliers</h3>

      <div className="space-y-4">
        <div>
          <p className="font-medium text-carbon">Verification multiplier</p>
          <p className="text-carbon-muted">
            Higher verification levels earn a larger multiplier. Partner-verified
            actions receive 1x, while insufficient evidence scores 0.
          </p>
        </div>

        <div>
          <p className="font-medium text-carbon">Value retention multiplier</p>
          <p className="text-carbon-muted">
            Actions that keep more value in use score higher
            (0.85–1.15). Repair and continued use retain the most value.
          </p>
        </div>

        <div>
          <p className="font-medium text-carbon">Effort multiplier</p>
          <p className="text-carbon-muted">
            Rewards proportional effort (0.95–1.10). More complex actions
            receive a higher effort multiplier.
          </p>
        </div>

        <div>
          <p className="font-medium text-carbon">Environmental confidence</p>
          <p className="text-carbon-muted">
            Adjusts for uncertainty in climate impact estimates (0.80–1.20).
            Higher confidence yields a higher modifier.
          </p>
        </div>
      </div>
    </section>
  );
}
