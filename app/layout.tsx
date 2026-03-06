import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// IMPORTANTE: Verifica que 'CartDrawerProvider' sea el nombre exportado en tu archivo de contexto
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartDrawerProvider } from "@/context/CartDrawerContext"; 
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
        {/* Envolvemos TODO el contenido para que el Header y las Pages tengan acceso */}
        <ToastProvider>
          <CartProvider>
            <CartDrawerProvider>
              <div className="flex flex-col min-h-screen">
                <Header /> 
                <main className="flex-grow">
                  {children}
                </main>
                <footer className="py-10 text-center text-gray-400 border-t">
                  <p>&copy; {new Date().getFullYear()} Mi Tienda</p>
                </footer>
              </div>
            </CartDrawerProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
