import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Move sensitive connection strings to environment variables.
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;