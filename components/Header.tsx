"use client";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";
import { User, LogOut, ShoppingCart } from "lucide-react";

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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/95 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="text-2xl font-black text-slate-900 hover:opacity-80 transition-opacity tracking-tight">
          Mi Tienda
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          {showCart && (
            <Link 
              href="/carrito" 
              className="group flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-slate-100/80 transition-all text-slate-700 font-medium hover:-translate-y-0.5 active:scale-95"
            >
              <ShoppingCart size={20} className="text-slate-600" />
              <span className="hidden sm:inline text-sm">Carrito</span>
              {count > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold">
                  {count}
                </span>
              )}
            </Link>
          )}

          {isAuthLoading ? (
            <div className="px-4 py-2 text-slate-500 text-sm font-medium animate-pulse">
              Cargando...
            </div>
          ) : user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link 
                href="/perfil/mis-pedidos" 
                className="hidden md:block px-4 py-2.5 rounded-full hover:bg-slate-100/80 text-sm font-medium text-slate-700 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Mis Pedidos
              </Link>
              <div className="bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1 flex items-center gap-2">
                <User size={16} className="text-slate-700" />
                <span className="text-slate-700 font-medium text-sm">{userName}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-slate-500 hover:text-slate-700 font-normal transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline text-sm">Salir</span>
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1 flex items-center gap-2 text-slate-700 font-medium hover:border-blue-300 transition-colors"
            >
              <User size={16} />
              <span className="text-sm">Iniciar sesión</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
