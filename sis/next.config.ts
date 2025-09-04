import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Clarify monorepo/workspace boundaries to silence root inference warnings
  turbopack: {
    // Align with workspace root to avoid root inference warnings
    root: path.join(__dirname, ".."),
  },
  // For Node.js output tracing in monorepos, set the same workspace root
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
