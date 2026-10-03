import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `npm run dev` use the same Cloudflare setup as production.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Needed so Prisma works on Cloudflare Workers.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
