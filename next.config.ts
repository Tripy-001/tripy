import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode : false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure native dependencies are properly handled
  serverExternalPackages: ['lightningcss', '@tailwindcss/node', '@tailwindcss/oxide'],
};

export default nextConfig;
