import type { Config } from "tailwindcss";

const config: Config = {
  // Aseguramos que todas las rutas de componentes estén cubiertas sin duplicados
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Definimos variables de CSS para mayor flexibilidad y consistencia
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      // Optimizamos el espaciado para que el grid sea más fluido
      gridTemplateColumns: {
        'products': 'repeat(auto-fill, minmax(280px, 1fr))',
      },
      // Animaciones personalizadas para una sensación de mayor velocidad
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  // Desactivamos utilidades que no usamos para reducir el tamaño del CSS generado
  plugins: [],
  // Habilitamos el modo JIT (Just-In-Time) por defecto en Tailwind 3+
  future: {
    hoverOnlyWhenSupported: true,
  },
};

export default config;
