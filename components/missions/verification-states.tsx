import type { Mission } from "@/lib/schemas/missions-ledgers";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui/cn";

const verifierRequirementLabels: Record<Mission["verificationRequirement"], string> = {
  required: "Verification required",
  recommended: "Verification recommended",
  not_required: "No verification needed",
};

const verifierRequirementTones: Record<Mission["verificationRequirement"], "neutral" | "positive" | "warning"> = {
  required: "warning",
  recommended: "accent",
  not_required: "positive",
};

export interface VerificationStatesProps {
  className?: string;
  mission: Mission;
}

export function VerificationStates({
  className,
  mission,
}: VerificationStatesProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-carbon">Verification</h3>
        <StatusPill tone={verifierRequirementTones[mission.verificationRequirement]}>
          {verifierRequirementLabels[mission.verificationRequirement]}
        </StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-carbon-muted">State</p>
          <p className="mt-0.5 font-medium text-carbon capitalize">
            {mission.state.replace(/_/g, " ")}
          </p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-carbon-muted">Approval</p>
          <p className="mt-0.5 font-medium text-carbon capitalize">
            {mission.approvalState.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {mission.requiredEvidence.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-carbon-subtle uppercase tracking-[0.06em] mb-1.5">
            Required evidence
          </p>
          <ul className="list-inside list-disc text-sm text-carbon-muted space-y-0.5">
            {mission.requiredEvidence.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
