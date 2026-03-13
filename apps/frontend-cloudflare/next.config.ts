import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@finta/shared-kernel",
    "@finta/price-query",
    "@finta/identity-access",
    "@finta/user-assets",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.tenor.com",
      },
    ],
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
