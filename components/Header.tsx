'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCartDrawer } from "@/context/CartDrawerContext";
import { useCart } from "@/context/CartContext";

// Importamos el componente de forma dinámica y segura
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });

export default function Header() {
  const cartContext = useCart();
  const drawerContext = useCartDrawer();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Si no está montado (SSR), devolvemos un header básico para evitar errores de hidratación
  if (!mounted) {
    return (
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 h-24 flex items-center px-6 sm:px-16 justify-between">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-slate-900 tracking-[0.2em]">BOUTIQUE</span>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.4em] uppercase -mt-1">v2026</span>
        </div>
      </header>
    );
  }

  const { user, perfil, logout } = cartContext || {};
  const { isOpen, openDrawer, closeDrawer } = drawerContext || {};

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 h-24 flex items-center px-6 sm:px-16 justify-between transition-all duration-300">
      <div className="flex items-center gap-12">
        <Link href="/" className="group flex flex-col">
          <span className="text-2xl font-black text-slate-900 tracking-[0.2em] group-hover:text-blue-600 transition-colors">
            BOUTIQUE
          </span>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.4em] uppercase -mt-1">
            v2026
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">Inicio</Link>
          <Link href="/perfil/mis-pedidos" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">Mis Pedidos</Link>
        </nav>
      </div>

      <div className="flex items-center gap-6 sm:gap-10">
        {/* Carrito con contador visual */}
        <button 
          onClick={openDrawer}
          className="relative p-2.5 text-slate-700 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </button>

        <CartDrawer 
          isOpen={isOpen} 
          onClose={closeDrawer} 
        />

        {user ? (
          <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bienvenido</span>
              <span className="text-sm font-bold text-slate-900">{perfil?.nombre || user.user_metadata?.nombre || user.email?.split('@')[0]}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/perfil" className="group relative">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold shadow-xl shadow-slate-200 group-hover:bg-blue-600 group-hover:rotate-3 transition-all duration-500">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </Link>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Cerrar Sesión"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <Link 
            href="/login" 
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-widest"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
