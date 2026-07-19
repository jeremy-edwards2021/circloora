import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";

import type { PublicAgentEvent } from "../contracts/public-events";
import type { TrustedRequestContext } from "../contracts/runtime";

const SESSION_COOKIE = "circloora_session";
const MAX_JSON_BYTES = 1_000_000;
const SESSION_TTL_MS = 30 * 60_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const SessionPayloadSchema = z
  .object({
    sid: z.string().regex(/^[a-f0-9]{64}$/),
    csrf: z.string().regex(/^[a-f0-9]{64}$/),
    issuedAt: z.number().int().positive(),
    expiresAt: z.number().int().positive(),
    version: z.literal(1),
  })
  .strict();

export class SafeApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = "SafeApiError";
  }
}

export function assertSameOrigin(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
): void {
  const requestUrl = new URL(request.url);
  const configured = environment.NEXT_PUBLIC_APP_URL?.trim();
  const expectedOrigin = configured
    ? new URL(configured).origin
    : requestUrl.origin;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || origin !== expectedOrigin)
    throw new SafeApiError(403, "origin_rejected");
  if (!host || host !== requestUrl.host)
    throw new SafeApiError(403, "host_rejected");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin")
    throw new SafeApiError(403, "cross_site_rejected");
}

export function issueAnonymousSession(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date(),
): Response {
  assertSameOrigin(request, environment);
  const secret = readSessionSecret(environment);
  const payload = SessionPayloadSchema.parse({
    sid: randomBytes(32).toString("hex"),
    csrf: randomBytes(32).toString("hex"),
    issuedAt: now.getTime(),
    expiresAt: now.getTime() + SESSION_TTL_MS,
    version: 1,
  });
  const token = signSession(payload, secret);
  const secure = new URL(request.url).protocol === "https:";
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "set-cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1_000)}${secure ? "; Secure" : ""}`,
  });
  return new Response(
    JSON.stringify({
      ok: true,
      data: {
        csrfToken: payload.csrf,
        expiresAt: new Date(payload.expiresAt).toISOString(),
      },
    }),
    { status: 201, headers },
  );
}

export async function trustedRequestContext(
  request: Request,
  capability: string,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<{ context: TrustedRequestContext; cleanup(): void }> {
  assertSameOrigin(request, environment);
  const secret = readSessionSecret(environment);
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) throw new SafeApiError(401, "session_required");
  const payload = verifySession(token, secret);
  if (payload.expiresAt <= Date.now())
    throw new SafeApiError(401, "session_expired");
  const csrf = request.headers.get("x-circloora-csrf");
  if (!csrf || !safeEqual(csrf, payload.csrf))
    throw new SafeApiError(403, "csrf_rejected");
  enforceMemoryRateLimit(
    `${payload.sid}:${capability}`,
    capability === "realtime" ? 2 : 10,
    60_000,
  );

  const abortController = new AbortController();
  const timeout = setTimeout(
    () => abortController.abort(new DOMException("Timed out", "TimeoutError")),
    30_000,
  );
  const onAbort = () => abortController.abort(request.signal.reason);
  request.signal.addEventListener("abort", onAbort, { once: true });
  return {
    context: {
      requestId: randomUUID(),
      principal: {
        kind: "anonymous",
        bindingHash: createHmac("sha256", secret)
          .update(payload.sid)
          .digest("hex"),
      },
      abortSignal: abortController.signal,
      now: () => new Date(),
    },
    cleanup() {
      clearTimeout(timeout);
      request.signal.removeEventListener("abort", onAbort);
    },
  };
}

export async function parseStrictJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new SafeApiError(415, "json_content_type_required");
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_JSON_BYTES)
    throw new SafeApiError(413, "payload_too_large");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_JSON_BYTES)
    throw new SafeApiError(413, "payload_too_large");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new SafeApiError(400, "invalid_json");
  }
  const result = schema.safeParse(value);
  if (!result.success) throw new SafeApiError(400, "invalid_request");
  return result.data;
}

export function eventStream(
  events: AsyncIterable<PublicAgentEvent>,
  cleanup: () => void,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(
            encoder.encode(
              `id: ${event.sequence}\nevent: agent\ndata: ${JSON.stringify(event)}\n\n`,
            ),
          );
        }
        controller.enqueue(encoder.encode("event: end\ndata: {}\n\n"));
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode('event: error\ndata: {"code":"agent_run_failed"}\n\n'),
        );
        controller.close();
      } finally {
        cleanup();
      }
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

export function safeApiErrorResponse(
  error: unknown,
  requestId = randomUUID(),
): Response {
  const known =
    error instanceof SafeApiError
      ? error
      : new SafeApiError(500, "internal_error");
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  if (known.retryAfterSeconds)
    headers.set("retry-after", String(known.retryAfterSeconds));
  return new Response(
    JSON.stringify({ ok: false, error: { code: known.code, requestId } }),
    {
      status: known.status,
      headers,
    },
  );
}

function readSessionSecret(environment: NodeJS.ProcessEnv): Buffer {
  const raw = environment.ANON_SESSION_SECRET?.trim();
  if (!raw || raw.length < 32)
    throw new SafeApiError(503, "session_service_unavailable");
  return createHash("sha256").update(raw).digest();
}

function signSession(
  payload: z.infer<typeof SessionPayloadSchema>,
  secret: Buffer,
): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function verifySession(
  token: string,
  secret: Buffer,
): z.infer<typeof SessionPayloadSchema> {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra)
    throw new SafeApiError(401, "invalid_session");
  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  if (!safeEqual(signature, expected))
    throw new SafeApiError(401, "invalid_session");
  try {
    return SessionPayloadSchema.parse(
      JSON.parse(Buffer.from(body, "base64url").toString("utf8")),
    );
  } catch {
    throw new SafeApiError(401, "invalid_session");
  }
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function readCookie(header: string | null, name: string): string | undefined {
  return header
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)
    ?.slice(1)
    .join("=");
}

function enforceMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): void {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new SafeApiError(
      429,
      "rate_limited",
      Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    );
  }
  current.count += 1;
}
