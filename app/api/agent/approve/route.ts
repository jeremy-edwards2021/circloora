import { ResolveApprovalInputSchema } from "@/lib/agents/contracts/runtime";
import { createRuntimeFacade } from "@/lib/agents/runtime/facade.server";
import {
  eventStream,
  parseStrictJson,
  safeApiErrorResponse,
  trustedRequestContext,
} from "@/lib/agents/http/api.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const raw = await parseStrictJson(
      request,
      ResolveApprovalInputSchema.omit({ decision: true }),
    );
    const input = ResolveApprovalInputSchema.parse({
      ...raw,
      decision: "approved",
    });
    const trusted = await trustedRequestContext(request, "agent_approval");
    const facade = createRuntimeFacade();
    return eventStream(
      facade.resolveApproval(input, trusted.context),
      trusted.cleanup,
    );
  } catch (error) {
    return safeApiErrorResponse(error);
  }
}
