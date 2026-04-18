import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.tsx", // or '*.tsx' if you are using TypeScript
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
        hostname: "res.cloudinary.com", // cloudinary
      },
      {
        protocol: "https",
        hostname: "wvndbmnkdnpafialnxlh.supabase.co", // supabase url
      },
      {
        protocol: "https",
        hostname: "pub-626aeddeabe146fb92f0e8ca1377235a.r2.dev", // cloudflare r2 url
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
