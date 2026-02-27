"use client";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { usePathname } from "next/navigation";

export default function Header() {
  const { cart, user, logout } = useCart();
  const pathname = usePathname();

  const count = cart.reduce((acc: number, item: any) => acc + (item.cantidad || 1), 0);

  const handleLogout = async () => {
    await logout();
  };

  const showCart = !pathname?.startsWith("/admin");

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold">Mi Tienda</Link>

        <nav className="flex items-center gap-4">
          {showCart && (
            <Link href="/carrito" className="px-3 py-2 rounded-md hover:bg-gray-100">🛒 Carrito {count > 0 && <span className="ml-1 inline-block bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{count}</span>}</Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">{user.email}</span>
              <Link href="/perfil/mis-pedidos" className="px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-bold">Mis Pedidos</Link>
              <button onClick={handleLogout} className="px-3 py-2 bg-red-600 text-white rounded-md">Cerrar sesión</button>
            </div>
          ) : (
            <Link href="/login" className="px-3 py-2 rounded-md hover:bg-gray-100">Iniciar sesión</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
