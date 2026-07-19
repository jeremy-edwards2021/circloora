import { z } from "zod";

import {
  parseStrictJson,
  safeApiErrorResponse,
  SafeApiError,
  trustedRequestContext,
} from "@/lib/agents/http/api.server";
import { readOpenAIConfig } from "@/lib/openai/config.server";
import { runtimeMode } from "@/lib/openai/runtime-mode.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RealtimeTokenRequestSchema = z.object({}).strict();
const ProviderResponseSchema = z
  .object({
    value: z.string().min(20).max(2_000),
    expires_at: z.number().int().positive(),
  })
  .passthrough();

export async function POST(request: Request): Promise<Response> {
  try {
    await parseStrictJson(request, RealtimeTokenRequestSchema);
    const trusted = await trustedRequestContext(request, "realtime");
    try {
      if (runtimeMode() !== "live")
        throw new SafeApiError(503, "realtime_unavailable_in_demo");
      const config = readOpenAIConfig();
      if (!config.realtimeEnabled || !config.realtimeModel)
        throw new SafeApiError(503, "realtime_not_configured");
      const response = await fetch(
        "https://api.openai.com/v1/realtime/client_secrets",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
            "openai-safety-identifier": trusted.context.principal.bindingHash,
            ...(config.project ? { "openai-project": config.project } : {}),
          },
          body: JSON.stringify({
            session: {
              type: "realtime",
              model: config.realtimeModel,
              instructions:
                "Offer concise hands-free guidance. Suggest UI actions only; never mutate Circloora records, approvals, verification, or Credits.",
            },
          }),
          signal: trusted.context.abortSignal,
        },
      );
      if (!response.ok) throw new SafeApiError(502, "realtime_provider_error");
      const token = ProviderResponseSchema.parse(await response.json());
      return Response.json(
        {
          ok: true,
          data: {
            value: token.value,
            expiresAt: new Date(token.expires_at * 1_000).toISOString(),
          },
        },
        { headers: { "cache-control": "no-store" } },
      );
    } finally {
      trusted.cleanup();
    }
  } catch (error) {
    return safeApiErrorResponse(error);
  }
}
