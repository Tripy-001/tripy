import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode : false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure native dependencies are properly handled
  serverExternalPackages: ['lightningcss', '@tailwindcss/node', '@tailwindcss/oxide'],
  webpack: (config, { isServer }) => {
    // Exclude native bindings from webpack bundling
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@tailwindcss/oxide');
    }
    return config;
  },
};

export default nextConfig;
