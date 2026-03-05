import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster"; // Asegúrate de que esta ruta sea correcta

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mi Tienda Boutique | Fase 4",
  description: "La mejor experiencia de compra online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        {/* El CartProvider envuelve todo para evitar errores de contexto en el Header */}
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            
            <main className="flex-grow">
              {children}
            </main>

            <footer className="bg-white border-t py-8 text-center text-slate-400 text-sm">
              <p>&copy; {new Date().getFullYear()} Mi Tienda Boutique - Todos los derechos reservados.</p>
            </footer>
          </div>
          
          {/* El Toaster permite que cualquier página (incluida la 404) use notificaciones */}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
