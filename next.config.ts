import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DATABASE_URL: "postgresql://postgres:kAz8wrtZCaMyn3/@db.vjkdxevzdtjsgabyxdgs.supabase.co:5432/postgres",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;