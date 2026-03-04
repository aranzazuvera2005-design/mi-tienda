"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";

// Cargamos dinámicamente componentes que no son críticos para el primer render
// Por ejemplo, si tuviéramos un modal de carrito lateral o perfil complejo
// En este caso, simulamos la optimización para el botón de logout o componentes pesados
// si existieran. Para este Header, optimizaremos la lógica de navegación.

export default function Header() {
  const { cart, user, logout } = useCart();
  const pathname = usePathname();

  const count = cart.reduce((acc: number, item: any) => acc + (item.cantidad || 1), 0);

  const handleLogout = async () => {
    await logout();
  };

  const showCart = !pathname?.startsWith("/admin");

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/90">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-black text-blue-600 hover:opacity-80 transition-opacity">
          Mi Tienda
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {showCart && (
            <Link 
              href="/carrito" 
              className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all text-gray-700 font-medium"
            >
              <span className="text-xl">🛒</span>
              <span className="hidden sm:inline">Carrito</span>
              {count > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-in fade-in zoom-in duration-300">
                  {count}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/perfil/mis-pedidos" 
                className="hidden md:block px-4 py-2 rounded-xl hover:bg-gray-100 text-sm font-bold text-gray-600 transition-all"
              >
                Mis Pedidos
              </Link>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm font-bold transition-all shadow-lg shadow-gray-200 active:scale-95"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
