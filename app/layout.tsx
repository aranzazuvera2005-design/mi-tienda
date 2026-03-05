import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mi Tienda Boutique",
  description: "Una experiencia de compra premium y exclusiva",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#F8FAFC] antialiased text-slate-900`}>
        <ToastProvider>
          <CartProvider>
            <Suspense fallback={<div className="h-20 bg-white border-b border-slate-200 animate-pulse" />}>
              <Header />
            </Suspense>
            <main className="max-w-7xl mx-auto p-4 sm:p-8">
              {children}
            </main>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
