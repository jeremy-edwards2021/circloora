import {
  issueAnonymousSession,
  safeApiErrorResponse,
} from "@/lib/agents/http/api.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    return issueAnonymousSession(request);
  } catch (error) {
    return safeApiErrorResponse(error);
  }
}
