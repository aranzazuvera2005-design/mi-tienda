import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Las variables sensibles deben estar en el panel de Vercel (.env)
  },
  eslint: {
    // Ignoramos durante el build para que Vercel no falle por warnings menores
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Aseguramos que el build falle si hay errores de tipos reales
    ignoreBuildErrors: false,
  },
  images: {
    // Optimizamos la carga de imágenes externas permitiendo solo dominios de confianza
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      }
    ],
    // Formatos modernos para mejor compresión
    formats: ['image/avif', 'image/webp'],
    // Pasos de tamaño para optimizar según el dispositivo
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
