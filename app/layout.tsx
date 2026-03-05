// app/layout.tsx
import { CartProvider } from '@/context/CartContext'; // Asegúrate de que la ruta sea correcta
import Header from '@/components/Header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* TODO debe estar dentro del CartProvider */}
        <CartProvider> 
          <Header />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
