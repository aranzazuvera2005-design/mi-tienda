import type { Metadata } from "next";
import "../globals.css";
import { CartProvider } from "../../context/CartContext";
import { AdminGuard } from "./admin-guard";

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
      <AdminGuard>
        <section className="admin-container">
          {children}
        </section>
      </AdminGuard>
    </CartProvider>
  );
}