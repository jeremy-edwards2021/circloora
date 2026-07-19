"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  requireCloudConfiguration,
  type CloudPublicEnvironment,
} from "./config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(
  environment?: CloudPublicEnvironment,
): SupabaseClient {
  const configuration = requireCloudConfiguration(environment);
  if (!browserClient) {
    browserClient = createBrowserClient(
      configuration.url,
      configuration.publishableKey,
      {
        auth: {
          flowType: "pkce",
          autoRefreshToken: true,
          detectSessionInUrl: false,
          persistSession: true,
        },
      },
    );
  }
  return browserClient;
}

export function resetSupabaseBrowserClientForTesting(): void {
  browserClient = null;
}
