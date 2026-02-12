import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Clarify monorepo/workspace boundaries to silence root inference warnings
  turbopack: {
    // Align with repo root (this directory) to avoid root inference warnings.
    root: __dirname,
  },
  // For Node.js output tracing, keep tracing root within this repo.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
