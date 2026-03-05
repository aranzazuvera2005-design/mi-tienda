'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import { User, LogOut, ShoppingCart, LogIn } from 'lucide-react';

export default function Header() {
  const { cart, logout, user, isAuthLoading } = useCart();
  const pathname = usePathname();
  const count = cart.length;
  const showCart = !pathname?.startsWith('/admin');

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">
              MI TIENDA
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAuthLoading ? (
              <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-full"></div>
            ) : user ? (
              <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-full px-3 py-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={18} />
                </div>
                <span className="text-sm font-medium text-slate-700 hidden md:inline">
                  {userName}
                </span>
                <button 
                  onClick={logout}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
              >
                <LogIn size={18} />
                <span>Entrar</span>
              </Link>
            )}

            {showCart && (
              <Link href="/carrito" className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                <ShoppingCart size={24} />
                {count > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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
