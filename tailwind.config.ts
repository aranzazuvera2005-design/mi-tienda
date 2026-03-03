import type { Config } from "tailwindcss";

const config: Config = {
  content: [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./context/**/*.{js,ts,jsx,tsx,mdx}", // IMPORTANTE: Añade esta línea
],
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
