import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.tsx", // or '*.tsx' if you are using TypeScript
      },
    },
  },
};

export default nextConfig;
