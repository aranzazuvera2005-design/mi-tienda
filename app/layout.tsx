import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Header from "@/components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mi Tienda Boutique",
  description: "Despliegue Exitoso",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Envolvemos TODO el contenido en un único componente de Providers */}
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header /> 
            <main className="flex-grow">
              {children}
            </main>
            <footer className="py-10 text-center text-gray-400 border-t">
              <p>&copy; {new Date().getFullYear()} Mi Tienda</p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
