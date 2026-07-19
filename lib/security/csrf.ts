import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const CSRF_COOKIE = "circloora_csrf";
const CSRF_HEADER = "x-circloora-csrf";
const TOKEN_BYTES = 32;
const DEFAULT_TTL_MS = 30 * 60_000;

export interface CsrfOptions {
  secret: string;
  ttlMs?: number;
}

export interface CsrfToken {
  value: string;
  expiresAt: number;
}

export function generateCsrfToken(options: CsrfOptions): CsrfToken {
  const raw = randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = Date.now() + (options.ttlMs ?? DEFAULT_TTL_MS);
  const signature = signCsrf(raw, expiresAt, options.secret);
  const value = `${raw}.${expiresAt}.${signature}`;
  return { value, expiresAt };
}

export function validateCsrfToken(
  token: string,
  options: CsrfOptions,
): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [raw, expiresAtStr, signature] = parts;
  if (!raw || !expiresAtStr || !signature) return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expected = signCsrf(raw, expiresAt, options.secret);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function doubleSubmitCookie(
  request: Request,
  options: CsrfOptions,
): boolean {
  const cookieHeader = request.headers.get("cookie");
  const cookie = readCookie(cookieHeader, CSRF_COOKIE);
  if (!cookie) return false;

  const headerValue = request.headers.get(CSRF_HEADER);
  if (!headerValue) return false;

  if (!validateCsrfToken(cookie, options)) return false;
  if (!validateCsrfToken(headerValue, options)) return false;

  const cookieRaw = cookie.split(".")[0];
  const headerRaw = headerValue.split(".")[0];
  if (!cookieRaw || !headerRaw) return false;

  return timingSafeEqual(Buffer.from(cookieRaw), Buffer.from(headerRaw));
}

export function setCsrfCookie(
  response: Response,
  token: CsrfToken,
  secure: boolean,
): void {
  response.headers.append(
    "set-cookie",
    `${CSRF_COOKIE}=${token.value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor((token.expiresAt - Date.now()) / 1_000)}${secure ? "; Secure" : ""}`,
  );
}

export function verifyRequestCsrf(
  request: Request,
  options: CsrfOptions,
): boolean {
  const header = request.headers.get(CSRF_HEADER);
  if (!header) return false;
  return validateCsrfToken(header, options);
}

function signCsrf(
  raw: string,
  expiresAt: number,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`${raw}.${expiresAt}`)
    .digest("hex");
}

function readCookie(
  header: string | null,
  name: string,
): string | undefined {
  return header
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)
    ?.slice(1)
    .join("=");
}

export { CSRF_COOKIE, CSRF_HEADER };
