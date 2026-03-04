/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vjkdxevzdtjsgabyxdgs.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Opción de emergencia si sigue fallando:
    unoptimized: true,
  },
};

module.exports = nextConfig;
