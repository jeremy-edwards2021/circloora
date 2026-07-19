import "server-only";

import { z } from "zod";

import {
  safeApiErrorResponse,
  SafeApiError,
} from "@/lib/agents/http/api.server";
import {
  VerificationResultSchema,
  EvidenceRefSchema,
} from "@/lib/schemas/missions-ledgers";
import { OwnerScopeSchema, SourceRefSchema } from "@/lib/schemas/primitives";

const VerificationRequestSchema = z
  .object({
    missionId: z.string().uuid(),
    evidence: z.array(EvidenceRefSchema).min(1).max(20),
    claims: z
      .array(
        z.object({
          claimId: z.string().uuid(),
          label: z.string().min(1).max(240),
          value: z.unknown(),
        }),
      )
      .min(1)
      .max(20),
  })
  .strict();

const MockVerificationResultSchema = z.object({
  missionId: z.string().uuid(),
  claimId: z.string().uuid(),
  claimedOutcome: z.enum(["continued_use", "maintenance", "repair", "upgrade", "share", "lend", "resell", "direct_transfer", "donate_for_reuse", "manufacturer_return", "refurbish", "components_recovery", "material_recycling", "compost", "special_handling", "dispose", "unknown"]),
  decision: z.enum(["approved", "approved_with_reduced_confidence", "revision_required", "additional_evidence_required", "safety_escalation", "blocked"]),
  supportedOutcome: z.enum(["continued_use", "maintenance", "repair", "upgrade", "share", "lend", "resell", "direct_transfer", "donate_for_reuse", "manufacturer_return", "refurbish", "components_recovery", "material_recycling", "compost", "special_handling", "dispose", "unknown"]).optional(),
  verificationLevel: z.enum(["partner_verified", "document_supported", "visually_supported", "user_attested", "insufficient_evidence", "rejected"]),
  evidenceSummary: z.string(),
  evidenceRefs: z.array(EvidenceRefSchema).max(20),
  verifier: z.enum(["deterministic_mock", "deterministic_server", "verification_agent", "partner"]),
  confidence: z.object({ score: z.number().min(0).max(1) }).strict(),
  sourceRefs: z.array(SourceRefSchema).max(20),
  limitations: z.array(z.string()).max(20),
  fraudFlags: z.array(z.enum(["exact_duplicate", "probable_duplicate", "claim_reuse", "cadence", "manual_review"])).max(10),
  creditEligible: z.boolean(),
  creditAmount: z.number().int().nonnegative(),
  creditExplanation: z.string(),
  followUpRequest: z.string().optional(),
  methodologyVersion: z.string(),
  modelVersion: z.string().optional(),
  id: z.string().uuid().optional(),
  ownerScope: OwnerScopeSchema.optional(),
  sourceDeviceId: z.string().uuid().optional(),
  hlc: z.string().optional(),
  schemaVersion: z.number().optional(),
  version: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/json")
    ) {
      throw new SafeApiError(415, "json_content_type_required");
    }
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > 1_000_000) {
      throw new SafeApiError(413, "payload_too_large");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new SafeApiError(400, "invalid_json");
    }
    const input = VerificationRequestSchema.safeParse(parsed);
    if (!input.success) {
      throw new SafeApiError(400, "invalid_verification_request");
    }
    const now = new Date();
    const mockResult = MockVerificationResultSchema.parse({
      missionId: input.data.missionId,
      claimId: input.data.claims[0]?.claimId ?? crypto.randomUUID(),
      claimedOutcome: "continued_use",
      decision: "approved",
      verificationLevel: "user_attested",
      evidenceSummary: "Demo verification—OpenAI is not currently connected.",
      evidenceRefs: input.data.evidence,
      verifier: "deterministic_mock",
      confidence: { score: 0.6 },
      sourceRefs: [],
      limitations: [
        "Demo analysis—OpenAI is not currently connected.",
        "Mock verification uses deterministic rules only.",
      ],
      fraudFlags: [],
      creditEligible: false,
      creditAmount: 0,
      creditExplanation: "Credits are not awarded in demo mode.",
      methodologyVersion: "1.0.0-mock",
      modelVersion: "mock-0.1.0",
      id: crypto.randomUUID(),
      ownerScope: { kind: "local", localProfileId: crypto.randomUUID() },
      sourceDeviceId: crypto.randomUUID(),
      hlc: `${now.getTime()}:0:${crypto.randomUUID()}`,
      schemaVersion: 1,
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    return Response.json(
      { ok: true, data: mockResult },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return safeApiErrorResponse(error);
  }
}
