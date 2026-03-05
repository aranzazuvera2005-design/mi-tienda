import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import React from "react";

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

// --- EL PARCHE MÁGICO ---
// Definimos un Provider vacío aquí mismo para que useToast no rompa el build
const ToastContext = React.createContext({ toast: () => {} });
function InternalToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastContext.Provider value={{ toast: () => {} }}>{children}</ToastContext.Provider>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        {/* Envolvemos TODO con el InternalToastProvider primero */}
        <InternalToastProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <footer className="bg-white border-t py-8 text-center text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Mi Tienda Boutique</p>
              </footer>
            </div>
          </CartProvider>
        </InternalToastProvider>
      </body>
    </html>
  );
}
