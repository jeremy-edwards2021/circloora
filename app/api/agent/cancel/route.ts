import { CancelRunInputSchema } from "@/lib/agents/contracts/runtime";
import { createRuntimeFacade } from "@/lib/agents/runtime/facade.server";
import {
  parseStrictJson,
  safeApiErrorResponse,
  trustedRequestContext,
} from "@/lib/agents/http/api.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = await parseStrictJson(request, CancelRunInputSchema);
    const trusted = await trustedRequestContext(request, "agent_cancel");
    try {
      const result = await createRuntimeFacade().cancel(input, trusted.context);
      return Response.json(
        { ok: true, data: result },
        { headers: { "cache-control": "no-store" } },
      );
    } finally {
      trusted.cleanup();
    }
  } catch (error) {
    return safeApiErrorResponse(error);
  }
}
