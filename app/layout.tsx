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
      <body>
        <ToastProvider>
          <CartProvider>
            <CartDrawerWrapper>
              <div className="min-h-screen">
                {/* Header (cliente) */}
                {/* Import aquí para que sea renderizado dentro del layout */}
                <Header />

                {children}
              </div>
            </CartDrawerWrapper>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
