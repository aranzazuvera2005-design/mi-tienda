'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useToast } from "@/context/ToastContext";

// Importamos el carrito de forma dinámica
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); // Estado para abrir/cerrar
  const supabase = createClientComponentClient(); 

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
      } catch (e) {
        console.error("Error de conexión");
      }
    };
    checkUser();
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 h-20 flex items-center px-6 sm:px-12 justify-between">
      <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">
        MI TIENDA
      </Link>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Botón para abrir el carrito */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </button>

        {/* Carrito con sus propiedades obligatorias */}
        {mounted && (
          <CartDrawer 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)} 
          />
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-200">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <Link 
            href="/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-md"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
