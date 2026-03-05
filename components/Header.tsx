'use client';

import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import { User, LogOut, ShoppingCart, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { cart, logout, user, isAuthLoading } = useCart();
  const pathname = usePathname();
  const count = cart.reduce((acc: number, item: any) => acc + (item.cantidad || 1), 0);
  const showCart = !pathname?.startsWith('/admin');

  // Obtener el nombre del usuario (metadata o email)
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tighter hover:opacity-90 transition-opacity">
              MI TIENDA
            </Link>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthLoading ? (
              <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-full"></div>
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-white border border-slate-200 shadow-sm rounded-full pl-1 pr-2 sm:pr-3 py-1 transition-all hover:shadow-md">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-inner">
                  <User size={18} />
                </div>
                <div className="flex flex-col max-w-[100px] sm:max-w-[150px]">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 truncate leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate hidden sm:block">
                    {user.email}
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
                <button 
                  onClick={logout}
                  className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500 group"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
              >
                <LogIn size={18} />
                <span>Entrar</span>
              </Link>
            )}

            {/* Carrito */}
            {showCart && (
              <Link 
                href="/carrito" 
                className="relative p-2.5 text-slate-600 hover:bg-slate-100 rounded-full transition-all group active:scale-90"
              >
                <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
                {count > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-lg shadow-blue-200 border-2 border-white animate-in zoom-in">
                    {count}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
