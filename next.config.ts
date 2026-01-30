import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  i18n: {
    // Default locale (ru) is served without a path prefix; English lives under /en.
    locales: ["ru", "en"],
    defaultLocale: "ru",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
