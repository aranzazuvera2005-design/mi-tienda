'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Importamos el carrito de forma dinámica para que no rompa el servidor
import dynamic from 'next/dynamic';
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClientComponentClient(); 

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
      } catch (e) {
        console.error("Error de conexión con Supabase");
      }
    };
    checkUser();
  }, [supabase.auth]);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 h-20 flex items-center px-6 sm:px-12 justify-between">
      {/* Logo */}
      <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">
        MI TIENDA
      </Link>

      <div className="flex items-center gap-6">
        {/* Carrito Seguro: Solo se carga si el componente está montado */}
        {mounted && <CartDrawer />}

        {/* Usuario / Auth */}
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-slate-500 text-sm font-medium">
              {user.email}
            </span>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-200"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
