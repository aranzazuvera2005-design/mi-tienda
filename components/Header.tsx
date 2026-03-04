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

  // Obtener el nombre del usuario (email o nombre)
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="bg-white border-b border-slate-200/50 sticky top-0 z-50 backdrop-blur-md bg-white/95 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="text-2xl font-extrabold text-slate-900 hover:opacity-80 transition-opacity tracking-tight">
          Mi Tienda
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          {showCart && (
            <Link 
              href="/carrito" 
              className="group flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-slate-100/80 transition-all text-slate-700 font-medium hover:-translate-y-0.5 active:scale-95"
            >
              <span className="text-xl">🛒</span>
              <span className="hidden sm:inline text-sm">Carrito</span>
              {count > 0 && (
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] px-2.5 py-1 rounded-full font-bold animate-in fade-in zoom-in duration-300">
                  {count}
                </span>
              )}
            </Link>
          )}

          {isAuthLoading ? (
            <div className="px-4 py-2 text-slate-500 text-sm font-medium">
              ⏳
            </div>
          ) : user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-100/50 border border-slate-200/50 backdrop-blur-sm">
                <span className="text-lg">👤</span>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Usuario</span>
                  <span className="text-sm font-bold text-slate-900">{userName}</span>
                </div>
              </div>
              <Link 
                href="/perfil/mis-pedidos" 
                className="hidden md:block px-4 py-2.5 rounded-full hover:bg-slate-100/80 text-sm font-medium text-slate-700 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Mis Pedidos
              </Link>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-6 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
