import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    cacheId: "tutti-stock-readonly-2026-05-06",
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
