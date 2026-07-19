import type {
  AnalyzeVisualEvidenceInput,
  AnalyzeVisualEvidenceOutput,
} from "@/lib/tools/analyze-visual-evidence";
import type {
  EstimateRemainingValueInput,
  EstimateRemainingValueOutput,
} from "@/lib/tools/estimate-remaining-value";
import type {
  GenerateActionPacketInput,
  GenerateActionPacketOutput,
} from "@/lib/tools/generate-action-packet";
import type {
  OptimizeMovePlanInput,
  OptimizeMovePlanOutput,
} from "@/lib/tools/optimize-move-plan";
import type {
  RankNextLifePathwaysInput,
  RankNextLifePathwaysOutput,
} from "@/lib/tools/rank-next-life-pathways";
import type {
  SearchCurrentPathwaysInput,
  SearchCurrentPathwaysOutput,
} from "@/lib/tools/search-current-pathways";
import type { VerificationPipeline } from "@/lib/tools/verify-outcome";

import type { ApprovalEnvelope } from "../state/approval";
import type { SealedRunStateEnvelope } from "../state/sealed-run-state.server";

export interface ContinuationStore {
  save(input: {
    runId: string;
    investigationId: string;
    approval: ApprovalEnvelope;
    sealedState: SealedRunStateEnvelope;
  }): Promise<void>;
  consumeApproval(approvalId: string): Promise<ApprovalEnvelope>;
}

export interface RuntimeToolServices {
  analyzeVisualEvidence(
    input: AnalyzeVisualEvidenceInput,
  ): Promise<AnalyzeVisualEvidenceOutput>;
  searchCurrentPathways(
    input: SearchCurrentPathwaysInput,
  ): Promise<SearchCurrentPathwaysOutput>;
  estimateRemainingValue(
    input: EstimateRemainingValueInput,
  ): Promise<EstimateRemainingValueOutput>;
  rankNextLifePathways(
    input: RankNextLifePathwaysInput,
  ): Promise<RankNextLifePathwaysOutput>;
  generateActionPacket(
    input: GenerateActionPacketInput,
  ): Promise<GenerateActionPacketOutput>;
  optimizeMovePlan(
    input: OptimizeMovePlanInput,
  ): Promise<OptimizeMovePlanOutput>;
  verificationPipeline: VerificationPipeline;
  continuationStore?: ContinuationStore;
}

export class RuntimeIntegrationUnavailableError extends Error {
  readonly code = "runtime_integration_unavailable";

  constructor(capability: string) {
    super(`Live runtime capability is not integrated: ${capability}`);
    this.name = "RuntimeIntegrationUnavailableError";
  }
}

export function unavailableLiveServices(): RuntimeToolServices {
  const unavailable = (name: string) => async () => {
    throw new RuntimeIntegrationUnavailableError(name);
  };
  return {
    analyzeVisualEvidence: unavailable(
      "evidence resolver",
    ) as RuntimeToolServices["analyzeVisualEvidence"],
    searchCurrentPathways: unavailable(
      "current-source adapter",
    ) as RuntimeToolServices["searchCurrentPathways"],
    estimateRemainingValue: unavailable(
      "value evidence adapter",
    ) as RuntimeToolServices["estimateRemainingValue"],
    rankNextLifePathways: unavailable(
      "deterministic ranking service",
    ) as RuntimeToolServices["rankNextLifePathways"],
    generateActionPacket: unavailable(
      "action packet service",
    ) as RuntimeToolServices["generateActionPacket"],
    optimizeMovePlan: unavailable(
      "deterministic planning service",
    ) as RuntimeToolServices["optimizeMovePlan"],
    verificationPipeline: {
      verify: unavailable(
        "verification and Credits services",
      ) as VerificationPipeline["verify"],
    },
  };
}
