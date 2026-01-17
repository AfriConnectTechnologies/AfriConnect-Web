import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

function getHostname(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const r2PublicHostname = getHostname(process.env.R2_PUBLIC_URL);
const r2AccountId = process.env.R2_ACCOUNT_ID;

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 public buckets (wildcard patterns)
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      ...(r2PublicHostname
        ? [{ protocol: "https" as const, hostname: r2PublicHostname }]
        : []),
      ...(r2AccountId
        ? [{ protocol: "https" as const, hostname: `${r2AccountId}.r2.cloudflarestorage.com` }]
        : []),
      // Placeholder/fallback image services (optional)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
