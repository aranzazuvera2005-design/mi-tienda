import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Move sensitive connection strings to environment variables.
    // Use a `.env.local` or Vercel project secret instead of committing them here.
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;