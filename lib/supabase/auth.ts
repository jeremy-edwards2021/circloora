import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountProviderStatus } from "../identity/types";
import {
  cloudCapabilityStatus,
  requireCloudConfiguration,
  type CloudPublicEnvironment,
} from "./config";

export function validateReturnTo(returnTo: string): string {
  if (
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\\")
  )
    throw new Error("INVALID_RETURN_TO");
  const parsed = new URL(returnTo, "https://circloora.invalid");
  if (parsed.origin !== "https://circloora.invalid")
    throw new Error("INVALID_RETURN_TO");
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function accountProviderStatuses(
  environment?: CloudPublicEnvironment,
): AccountProviderStatus[] {
  const status = cloudCapabilityStatus(environment);
  if (status.state !== "enabled") {
    const reason =
      status.reason === "feature_flag_off"
        ? "cloud_disabled"
        : "incomplete_configuration";
    return (["apple", "email_magic_link", "google"] as const).map(
      (provider) => ({
        provider,
        configured: false,
        enabled: false,
        reason,
      }),
    );
  }
  return [
    { provider: "apple", configured: true, enabled: true },
    { provider: "email_magic_link", configured: true, enabled: true },
    {
      provider: "google",
      configured: status.config.googleEnabled === "true",
      enabled: status.config.googleEnabled === "true",
      ...(status.config.googleEnabled === "true"
        ? {}
        : { reason: "provider_disabled" as const }),
    },
  ];
}

function callbackUrl(appUrl: string, returnTo: string): string {
  const callback = new URL("/auth/callback", appUrl);
  callback.searchParams.set("returnTo", validateReturnTo(returnTo));
  return callback.toString();
}

export async function startOAuthSignIn(
  client: SupabaseClient,
  provider: "apple" | "google",
  returnTo: string,
  environment?: CloudPublicEnvironment,
): Promise<void> {
  const configuration = requireCloudConfiguration(environment);
  if (provider === "google" && configuration.googleEnabled !== "true")
    throw new Error("AUTH_PROVIDER_DISABLED");
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl(configuration.appUrl, returnTo),
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) throw new Error("AUTH_START_FAILED");
  globalThis.location.assign(data.url);
}

export async function requestMagicLink(
  client: SupabaseClient,
  email: string,
  returnTo: string,
  environment?: CloudPublicEnvironment,
): Promise<{ accepted: true }> {
  const configuration = requireCloudConfiguration(environment);
  const normalizedEmail = email.trim().toLowerCase();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedEmail.length > 254
  )
    throw new Error("INVALID_EMAIL");
  await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: callbackUrl(configuration.appUrl, returnTo),
      shouldCreateUser: true,
    },
  });
  // Deliberately neutral: callers do not learn whether the account exists.
  return { accepted: true };
}
