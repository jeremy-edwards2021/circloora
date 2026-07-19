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

const MockVerificationResultSchema = VerificationResultSchema.partial({
  id: true,
  ownerScope: true,
  sourceDeviceId: true,
  hlc: true,
  schemaVersion: true,
  version: true,
  createdAt: true,
  updatedAt: true,
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
