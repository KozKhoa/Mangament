import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mangament/ui", "@mangament/services", "@mangament/types"],
  output: "standalone",
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.tsx",
      },
    },
  },
  images: {
    unoptimized: true,
    localPatterns: [
      {
        pathname: "/api/**",
      },
      {
        pathname: "/uploads/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "wvndbmnkdnpafialnxlh.supabase.co",
      },
      {
        protocol: "https",
        hostname: "pub-626aeddeabe146fb92f0e8ca1377235a.r2.dev",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
