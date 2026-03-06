'use client';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from './ToastContext';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 1. Evitar ejecución en servidor para Supabase y Toasts
  useEffect(() => {
    setMounted(true);
  }, []);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Memoizamos el cliente de supabase para que no se recree
  const supabase = useMemo(() => {
    if (typeof window !== 'undefined' && SUPABASE_URL && SUPABASE_ANON) {
      return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    }
    return null;
  }, [SUPABASE_URL, SUPABASE_ANON]);

  const toastContext = useToast();

  useEffect(() => {
    if (!supabase || !mounted) {
      if (mounted) setIsAuthLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (e) {
        console.error('CartContext: Auth Error', e);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, [supabase, mounted]);

  const addToCart = (producto: any) => {
    if (!producto?.id) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === producto.id);
      if (existingItem) {
        toastContext?.addToast({ message: `${producto.nombre} actualizado`, type: 'info' });
        return prevCart.map((item) =>
          item.id === producto.id ? { ...item, cantidad: (item.cantidad || 1) + 1 } : item
        );
      }
      toastContext?.addToast({ message: `${producto.nombre} añadido`, type: 'success' });
      return [...prevCart, { ...producto, cantidad: 1 }];
    });
  };

  const removeFromCart = (productoId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productoId);
      if (existingItem && (existingItem.cantidad || 1) > 1) {
        return prevCart.map((item) =>
          item.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item
        );
      }
      return prevCart.filter((item) => item.id !== productoId);
    });
  };

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.precio || 0) * (item.cantidad || 1)), 0);
  }, [cart]);

  // Objeto de valor memoizado para evitar re-renders masivos
  const value = useMemo(() => ({
    cart,
    user,
    addToCart,
    removeFromCart,
    total,
    isAuthLoading,
    logout: async () => {
      if (supabase) {
        await supabase.auth.signOut();
        setCart([]);
        setUser(null);
      }
    }
  }), [cart, user, isAuthLoading, supabase]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
export const useCart = () => {
  const context = useContext(CartContext);
  // No devolvemos un objeto vacío, lanzamos un error claro si falta el Provider
  // Esto ayuda a React a identificar fallos de jerarquía inmediatamente
  if (context === undefined) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context || { cart: [], total: 0, addToCart: () => {} }; 
};
