'use client';
import { useCart } from '@/context/CartContext';
import { User, LogOut, ShoppingCart, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Header() {
  const { cart, logout } = useCart();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    setMounted(true);
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const count = cart.reduce((acc: number, item: any) => acc + (item.cantidad || 1), 0);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';

  if (!mounted) return <div className="h-20 bg-white border-b border-slate-200" />;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex justify-between items-center">
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">MI TIENDA</Link>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><User size={16} /></div>
              <span className="text-sm font-bold text-slate-700 hidden sm:block">{userName}</span>
              <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all"><LogIn size={18} /><span>Entrar</span></Link>
          )}
          
          <Link href="/carrito" className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <ShoppingCart size={24} />
            {count > 0 && <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
