import type { z } from "zod";

import {
  AgentEventSchema,
  AgentRunSchema,
  EvidenceRequestSchema,
  HypothesisSchema,
  InvestigationSchema,
  InvestigationSnapshotSchema,
  ObservationSchema,
  PathwaySchema,
  PathwayScoreSchema,
} from "./investigation-agent";
import {
  CircularActionEntrySchema,
  CircularValueEntrySchema,
  ClimateImpactEntrySchema,
  CreditClaimSchema,
  CreditLedgerEntrySchema,
  LocalPathwaySourceSchema,
  MissionSchema,
  MovePlanSchema,
  RecommendationRevisionSchema,
  UserApprovalSchema,
  VerificationResultSchema,
} from "./missions-ledgers";
import {
  EvidenceAssetSchema,
  ObjectPassportSchema,
  PreferenceProfileSchema,
  SpaceSchema,
} from "./profile-catalog";
import type { EntityType } from "./primitives";

export const ENTITY_SCHEMAS = {
  preferenceProfile: PreferenceProfileSchema,
  space: SpaceSchema,
  investigation: InvestigationSchema,
  objectPassport: ObjectPassportSchema,
  observation: ObservationSchema,
  hypothesis: HypothesisSchema,
  evidenceRequest: EvidenceRequestSchema,
  evidenceAsset: EvidenceAssetSchema,
  pathway: PathwaySchema,
  pathwayScore: PathwayScoreSchema,
  agentRun: AgentRunSchema,
  agentEvent: AgentEventSchema,
  investigationSnapshot: InvestigationSnapshotSchema,
  userApproval: UserApprovalSchema,
  mission: MissionSchema,
  recommendationRevision: RecommendationRevisionSchema,
  verificationResult: VerificationResultSchema,
  circularActionEntry: CircularActionEntrySchema,
  circularValueEntry: CircularValueEntrySchema,
  climateImpactEntry: ClimateImpactEntrySchema,
  creditClaim: CreditClaimSchema,
  creditLedgerEntry: CreditLedgerEntrySchema,
  localPathwaySource: LocalPathwaySourceSchema,
  movePlan: MovePlanSchema,
} as const satisfies Record<EntityType, z.ZodTypeAny>;

export type DomainEntityMap = {
  [Type in EntityType]: z.infer<(typeof ENTITY_SCHEMAS)[Type]>;
};

export type DomainEntity = DomainEntityMap[EntityType];

export function parseDomainEntity<Type extends EntityType>(
  type: Type,
  input: unknown,
): DomainEntityMap[Type] {
  return ENTITY_SCHEMAS[type].parse(input) as DomainEntityMap[Type];
}

export function safeParseDomainEntity<Type extends EntityType>(
  type: Type,
  input: unknown,
) {
  return ENTITY_SCHEMAS[type].safeParse(input);
}

export const APPEND_ONLY_ENTITY_TYPES = new Set<EntityType>([
  "observation",
  "agentEvent",
  "investigationSnapshot",
  "recommendationRevision",
  "verificationResult",
  "circularActionEntry",
  "circularValueEntry",
  "climateImpactEntry",
  "creditLedgerEntry",
  "localPathwaySource",
  "pathwayScore",
]);

export const SERVER_AUTHORITATIVE_ENTITY_TYPES = new Set<EntityType>([
  "pathwayScore",
  "agentRun",
  "agentEvent",
  "investigationSnapshot",
  "recommendationRevision",
  "verificationResult",
  "circularActionEntry",
  "circularValueEntry",
  "climateImpactEntry",
  "creditLedgerEntry",
  "localPathwaySource",
]);
