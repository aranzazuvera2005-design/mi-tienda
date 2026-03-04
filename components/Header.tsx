"use client";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";

export default function Header() {
  const { cart, user, logout, isAuthLoading } = useCart();
  const pathname = usePathname();

  const count = cart.reduce((acc: number, item: any) => acc + (item.cantidad || 1), 0);

  const handleLogout = async () => {
    await logout();
  };

  const showCart = !pathname?.startsWith("/admin");

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/90 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-2xl font-serif font-bold text-blue-600 hover:opacity-80 transition-opacity">
          Mi Tienda
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {showCart && (
            <Link 
              href="/carrito" 
              className="group flex items-center gap-2 px-4 py-2 rounded-full hover:bg-blue-50 transition-all text-slate-700 font-medium hover:-translate-y-1"
            >
              <span className="text-xl">🛒</span>
              <span className="hidden sm:inline">Carrito</span>
              {count > 0 && (
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-in fade-in zoom-in duration-300">
                  {count}
                </span>
              )}
            </Link>
          )}

          {isAuthLoading ? (
            <div className="px-4 py-2 text-slate-500 text-sm font-medium">
              Cargando...
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/perfil/mis-pedidos" 
                className="hidden md:block px-4 py-2 rounded-full hover:bg-slate-100 text-sm font-bold text-slate-700 transition-all hover:-translate-y-1"
              >
                Mis Pedidos
              </Link>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-full text-sm font-bold transition-all active:scale-95 hover:-translate-y-1 shadow-md"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 rounded-full text-sm font-bold transition-all shadow-lg hover:-translate-y-1 active:scale-95"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
