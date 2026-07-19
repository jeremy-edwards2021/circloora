import "server-only";

import { createServerClient } from "@supabase/ssr";

import {
  requireCloudConfiguration,
  type CloudPublicEnvironment,
} from "./config";

export interface SupabaseCookieAdapter {
  getAll(): Array<{ name: string; value: string }>;
  setAll(
    cookies: Array<{
      name: string;
      value: string;
      options: Record<string, unknown>;
    }>,
  ): void;
}

export function createSupabaseServerClient(
  cookies: SupabaseCookieAdapter,
  environment?: CloudPublicEnvironment,
) {
  const configuration = requireCloudConfiguration(environment);
  return createServerClient(configuration.url, configuration.publishableKey, {
    auth: { flowType: "pkce" },
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (values) => cookies.setAll(values),
    },
  });
}
