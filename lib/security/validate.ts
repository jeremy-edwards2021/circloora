import { z } from "zod";

import { SafeApiError } from "@/lib/agents/http/api.server";

export interface ValidatedResult<T> {
  success: true;
  data: T;
}

export async function validateBody<T>(
  schema: z.ZodType<T>,
  request: Request,
): Promise<T> {
  const contentType = request.headers.get("content-type")?.toLowerCase();
  if (!contentType?.startsWith("application/json")) {
    throw new SafeApiError(415, "json_content_type_required");
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > 1_000_000) {
    throw new SafeApiError(413, "payload_too_large");
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    throw new SafeApiError(400, "body_read_failed");
  }

  if (Buffer.byteLength(text, "utf8") > 1_000_000) {
    throw new SafeApiError(413, "payload_too_large");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SafeApiError(400, "invalid_json");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new SafeApiError(400, "validation_failed");
  }

  return result.data;
}

export function validateParams<T>(
  schema: z.ZodType<T>,
  params: unknown,
): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new SafeApiError(400, "invalid_params");
  }
  return result.data;
}

export function createValidationError(
  errors: z.ZodError,
): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: "validation_failed",
        details: errors.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    }),
    {
      status: 400,
      headers: { "content-type": "application/json" },
    },
  );
}
