import type { NextConfig } from "next";
// Security headers are set in worker/index.ts: Vinext applies next.config headers to some responses only
// (not to "/" or React Server Components requests).
const nextConfig: NextConfig = {};
export default nextConfig;
