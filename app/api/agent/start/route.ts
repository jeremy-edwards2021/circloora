import { StartRunInputSchema } from "@/lib/agents/contracts/runtime";
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
    const input = await parseStrictJson(request, StartRunInputSchema);
    const trusted = await trustedRequestContext(request, "agent_start");
    const facade = createRuntimeFacade();
    return eventStream(
      facade.start(input as never, trusted.context),
      trusted.cleanup,
    );
  } catch (error) {
    return safeApiErrorResponse(error);
  }
}
