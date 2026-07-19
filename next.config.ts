import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: false,
  experimental: {
    optimizePackageImports: ["@openai/agents", "openai"],
  },
};

export default nextConfig;
