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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#F1F5F9] antialiased text-slate-900`}>
        <ToastProvider>
          <CartProvider>
            <Suspense fallback={
              <div className="h-20 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                  <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
                  <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-full"></div>
                </div>
              </div>
            }>
              <Header />
            </Suspense>
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }>
                {children}
              </Suspense>
            </main>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
