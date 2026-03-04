import "./globals.css";

import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import { ToastProvider } from "@/context/ToastContext";
import CartDrawerWrapper from "@/components/CartDrawerWrapper";

export const metadata = {
  title: "Mi Tienda Online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50">
        <ToastProvider>
          <CartProvider>
            <CartDrawerWrapper>
              <div className="min-h-screen bg-slate-50">
                {/* Header (cliente) */}
                {/* Import aquí para que sea renderizado dentro del layout */}
                <Header />

                {/* Contenedor principal con max-width y padding */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
            </CartDrawerWrapper>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
