import type { Metadata } from "next";
import "../globals.css"; // Subimos un nivel para encontrar el CSS
import { CartProvider } from "../../context/CartContext"; // Usamos @ para ir directo a src/context

export const metadata: Metadata = {
  title: "MI STORE - ADMIN",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <section className="admin-container">
        {children}
      </section>
    </CartProvider>
  );
}