import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode : false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure native dependencies are properly handled
  experimental: {
    serverComponentsExternalPackages: ['lightningcss', '@tailwindcss/node'],
  },
};

export default nextConfig;
