'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from './ToastContext';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  // Inicializar sesión al montar
  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    // Obtener sesión actual
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        console.debug('CartContext: Initial session loaded', session?.user?.id);
      } catch (e) {
        console.error('CartContext: Error loading initial session', e);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      console.debug('CartContext: Auth state changed', _event, session?.user?.id);
    });

    return () => subscription?.unsubscribe();
  }, [supabase]);

  const { addToast } = useToast();

  const addToCart = (producto: any) => {
    try {
      console.debug('CartContext.addToCart called with producto:', producto);
    } catch (e) {
      // noop
    }

    if (!producto || !producto.id) {
      try {
        addToast({ message: 'Producto inválido. No se pudo añadir al carrito.', type: 'error' });
      } catch (e) {
        // silent
      }
      return;
    }

    try {
      setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === producto.id);
      if (existingItem) {
        addToast({ message: `${producto.nombre} actualizado en el carrito`, type: 'info' });
        return prevCart.map((item) =>
          item.id === producto.id ? { ...item, cantidad: (item.cantidad || 1) + 1 } : item
        );
      }
      addToast({ message: `${producto.nombre} añadido al carrito`, type: 'success' });
      return [...prevCart, { ...producto, cantidad: 1 }];
    });
    } catch (e) {
      console.error('CartContext.addToCart error:', e);
      try { addToast({ message: 'Error interno al añadir al carrito', type: 'error' }); } catch (_) {}
    }
  };

  const removeFromCart = (productoId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productoId);
      if (existingItem && existingItem.cantidad > 1) {
        addToast({ message: `${existingItem.nombre} cantidad reducida`, type: 'info' });
        return prevCart.map((item) =>
          item.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item
        );
      }
      const removed = prevCart.find((i) => i.id === productoId);
      if (removed) addToast({ message: `${removed.nombre} eliminado del carrito`, type: 'info' });
      return prevCart.filter((item) => item.id !== productoId);
    });
  };

  const total = cart.reduce((acc, item) => acc + (Number(item.precio) * (item.cantidad || 1)), 0);

  const enviarPedido = async (datosEnvio: any) => {
    if (!user) throw new Error("Inicia sesión primero");
    if (!supabase) {
      throw new Error("Supabase no está configurado");
    }

    try {
      const { data, error: oError } = await supabase.from('pedidos').insert({
        cliente_id: user.id,  // Vinculamos el ID del usuario autenticado
        total: total,
        articulos: cart,
        direccion_ent: datosEnvio.direccion,  // Mapeo correcto a la columna direccion_ent
        estado: 'pagado'
      }).select().single();

      if (oError) throw new Error('Error Pedido: ' + oError.message);

      addToast({ message: 'Pedido enviado correctamente', type: 'success' });
      setCart([]);
      return data;
    } catch (e: any) {
      addToast({ message: `Error enviando pedido: ${e?.message || e}`, type: 'error' });
      throw e;
    }
  };

  const logout = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCart([]);
      addToast({ message: 'Sesión cerrada correctamente', type: 'success' });
    } catch (e: any) {
      addToast({ message: `Error al cerrar sesión: ${e?.message || e}`, type: 'error' });
    }
  };

  return (
    <CartContext.Provider value={{ cart, user, addToCart, removeFromCart, total, enviarPedido, logout, isAuthLoading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};
