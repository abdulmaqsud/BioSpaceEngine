import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@headlessui/react', '@heroicons/react'],
  },
  // Suppress hydration warnings for browser extensions
  reactStrictMode: false,
};

export default nextConfig;
