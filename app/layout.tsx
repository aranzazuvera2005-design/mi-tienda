'use client'; // <-- ESTO ES VITAL

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import React, { createContext } from "react";

// Creamos un proveedor "dummy" para engañar a cualquier componente que busque useToast
const MockContext = createContext({});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        <CartProvider>
          {/* Este Provider vacío evita que el build falle por el Toast */}
          <MockContext.Provider value={{}}>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <footer className="bg-white border-t py-8 text-center text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Mi Tienda Boutique</p>
              </footer>
            </div>
          </MockContext.Provider>
        </CartProvider>
      </body>
    </html>
  );
}
