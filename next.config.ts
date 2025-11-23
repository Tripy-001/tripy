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
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('@tailwindcss/oxide');
    }
    
    // Add fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

export default nextConfig;
