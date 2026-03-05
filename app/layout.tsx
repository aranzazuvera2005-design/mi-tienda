import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import Header from "@/components/Header";
import React from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mi Tienda Boutique",
  description: "Desplegado con éxito",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        <ToastProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              {/* Intentamos cargar el Header, si falla, la web seguirá viva */}
              <Header />
              
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>

              <footer className="py-10 text-center text-gray-400 border-t">
                <p>&copy; {new Date().getFullYear()} Mi Tienda - En línea</p>
              </footer>
            </div>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
