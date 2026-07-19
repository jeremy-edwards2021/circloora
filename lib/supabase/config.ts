import { z } from "zod";

const EnabledFlagSchema = z.enum(["true", "false"]).default("false");

export const CloudPublicConfigurationSchema = z
  .object({
    enabled: EnabledFlagSchema,
    url: z.string().url().startsWith("https://").max(500),
    publishableKey: z.string().min(20).max(1_000),
    appUrl: z.string().url().max(500),
    googleEnabled: EnabledFlagSchema,
  })
  .strict();

export interface CloudPublicEnvironment {
  NEXT_PUBLIC_CLOUD_ACCOUNTS_ENABLED?: string | undefined;
  NEXT_PUBLIC_SUPABASE_URL?: string | undefined;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string | undefined;
  NEXT_PUBLIC_APP_URL?: string | undefined;
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED?: string | undefined;
}

export type CloudCapabilityStatus =
  | { state: "disabled"; reason: "feature_flag_off" }
  | { state: "disabled"; reason: "incomplete_configuration"; missing: string[] }
  | {
      state: "enabled";
      config: z.infer<typeof CloudPublicConfigurationSchema>;
    };

export function readCloudPublicEnvironment(): CloudPublicEnvironment {
  return {
    NEXT_PUBLIC_CLOUD_ACCOUNTS_ENABLED:
      process.env.NEXT_PUBLIC_CLOUD_ACCOUNTS_ENABLED,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED:
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED,
  };
}

export function cloudCapabilityStatus(
  environment: CloudPublicEnvironment = readCloudPublicEnvironment(),
): CloudCapabilityStatus {
  if (environment.NEXT_PUBLIC_CLOUD_ACCOUNTS_ENABLED !== "true")
    return { state: "disabled", reason: "feature_flag_off" };
  const values = {
    enabled: environment.NEXT_PUBLIC_CLOUD_ACCOUNTS_ENABLED,
    url: environment.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    appUrl: environment.NEXT_PUBLIC_APP_URL,
    googleEnabled: environment.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED ?? "false",
  };
  const missing = Object.entries(values)
    .filter(([key, value]) => key !== "googleEnabled" && !value)
    .map(([key]) => key);
  if (missing.length > 0)
    return { state: "disabled", reason: "incomplete_configuration", missing };
  const parsed = CloudPublicConfigurationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      state: "disabled",
      reason: "incomplete_configuration",
      missing: [
        ...new Set(
          parsed.error.issues
            .map((issue) => issue.path[0])
            .filter((key): key is string => typeof key === "string"),
        ),
      ],
    };
  }
  return { state: "enabled", config: parsed.data };
}

export class CloudAccountsDisabledError extends Error {
  readonly code = "CLOUD_ACCOUNTS_DISABLED";

  constructor(
    readonly status: Exclude<CloudCapabilityStatus, { state: "enabled" }>,
  ) {
    super(
      status.reason === "feature_flag_off"
        ? "Cloud accounts are disabled"
        : "Cloud account configuration is incomplete",
    );
    this.name = "CloudAccountsDisabledError";
  }
}

export function requireCloudConfiguration(
  environment?: CloudPublicEnvironment,
) {
  const status = cloudCapabilityStatus(environment);
  if (status.state !== "enabled") throw new CloudAccountsDisabledError(status);
  return status.config;
}
