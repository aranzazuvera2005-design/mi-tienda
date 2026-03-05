import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mi Tienda Online",
  description: "Una experiencia de compra premium",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 antialiased text-slate-900`}>
        <ToastProvider>
          <CartProvider>
            <Header />
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
