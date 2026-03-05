import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";

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
      <body className={`${inter.className} bg-[#f1f5f9] antialiased`}>
        <ToastProvider>
          <CartProvider>
            <Header />
            <main className="max-w-7xl mx-auto p-6">
              {children}
            </main>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
