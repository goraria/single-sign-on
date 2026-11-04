import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@gorth-io/primitive"],

  devIndicators: false,
  images: {
    remotePatterns: [],
  },
  allowedDevOrigins: ["192.168.1.37"],
}

export default nextConfig
