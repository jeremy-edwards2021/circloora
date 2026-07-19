import type { VerificationLevel } from "@/lib/schemas/missions-ledgers";
import { cn } from "@/lib/ui/cn";

const levelMeta: Record<VerificationLevel, { label: string; description: string }> = {
  partner_verified: {
    label: "Partner verified",
    description: "Confirmed by an official partner or authority",
  },
  document_supported: {
    label: "Document supported",
    description: "Supported by a receipt, certificate, or official document",
  },
  visually_supported: {
    label: "Visually supported",
    description: "Supported by photo or video evidence",
  },
  user_attested: {
    label: "User attested",
    description: "Self-reported by the user without independent verification",
  },
  insufficient_evidence: {
    label: "Insufficient evidence",
    description: "Not enough evidence to support the claim",
  },
  rejected: {
    label: "Rejected",
    description: "Claim was not accepted",
  },
};

const levelColors: Record<VerificationLevel, string> = {
  partner_verified: "text-sage-ink",
  document_supported: "text-accent-ink",
  visually_supported: "text-accent-ink",
  user_attested: "text-amber-ink",
  insufficient_evidence: "text-carbon-muted",
  rejected: "text-danger",
};

const levelDots: Record<VerificationLevel, string> = {
  partner_verified: "bg-sage",
  document_supported: "bg-accent",
  visually_supported: "bg-accent",
  user_attested: "bg-amber",
  insufficient_evidence: "bg-carbon/30",
  rejected: "bg-danger",
};

export interface EvidenceLevelProps {
  className?: string;
  level: VerificationLevel;
}

export function EvidenceLevel({ className, level }: EvidenceLevelProps) {
  const meta = levelMeta[level];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", levelDots[level])}
      />
      <div>
        <p className={cn("text-sm font-semibold", levelColors[level])}>
          {meta.label}
        </p>
        <p className="text-xs text-carbon-muted">{meta.description}</p>
      </div>
    </div>
  );
}
