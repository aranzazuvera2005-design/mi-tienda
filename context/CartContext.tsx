'use client';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from './ToastContext';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
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

    const fetchPerfil = async (userId: string) => {
      try {
        const { data, error } = await supabase.from('perfiles').select('*').eq('id', userId).single();
        if (!error && data) setPerfil(data);
      } catch (e) {
        console.error('Error fetching profile:', e);
      }
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) fetchPerfil(currentUser.id);
      } catch (e) {
        console.error('CartContext: Auth Error', e);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchPerfil(currentUser.id);
      } else {
        setPerfil(null);
      }
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

  const clearCart = () => {
    setCart([]);
  };

  const enviarPedido = async (datos: { nombre: string; telefono: string; direccion: string }) => {
    if (!supabase || !user) {
      throw new Error('Usuario no autenticado');
    }

    if (cart.length === 0) {
      throw new Error('El carrito está vacío');
    }

    try {
      // 1. Calcular el total del pedido
      const totalPedido = cart.reduce((acc, item) => {
        const precio = Number(item.precio || 0);
        return acc + (precio * (item.cantidad || 1));
      }, 0);

      // 2. Crear el pedido en la tabla 'pedidos'
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([
          {
            cliente_id: user.id,
            total: totalPedido,
            estado: 'pagado',
            articulos: cart,
            direccion_entrega: datos.direccion,
          },
        ])
        .select('id')
        .single();

      if (pedidoError) {
        throw new Error(`Error al crear el pedido: ${pedidoError.message}`);
      }

      if (!pedidoData?.id) {
        throw new Error('No se pudo obtener el ID del pedido');
      }

      // 3. Crear las líneas de pedido
      const lineasPedido = cart.map((item) => ({
        pedido_id: pedidoData.id,
        producto_id: item.id,
        cantidad: item.cantidad || 1,
        precio_unitario_historico: Number(item.precio || 0),
      }));

      const { error: lineasError } = await supabase
        .from('lineas_pedido')
        .insert(lineasPedido);

      if (lineasError) {
        throw new Error(`Error al crear las líneas del pedido: ${lineasError.message}`);
      }

      // 4. Actualizar el perfil del cliente con los datos de envío
      const { error: perfilError } = await supabase
        .from('perfiles')
        .update({
          nombre: datos.nombre,
          telefono: datos.telefono,
        })
        .eq('id', user.id);

      if (perfilError) {
        console.warn('Advertencia: No se pudo actualizar el perfil', perfilError);
        // No lanzamos error aquí porque el pedido ya se creó exitosamente
      }

      return { success: true, pedidoId: pedidoData.id };
    } catch (error: any) {
      throw new Error(error?.message || 'Error desconocido al enviar el pedido');
    }
  };

  // Objeto de valor memoizado para evitar re-renders masivos
  const value = useMemo(() => ({
    cart,
    user,
    perfil,
    addToCart,
    removeFromCart,
    clearCart,
    enviarPedido,
    total,
    isAuthLoading,
    logout: async () => {
      if (supabase) {
        await supabase.auth.signOut();
        setCart([]);
        setUser(null);
        setPerfil(null);
      }
    }
  }), [cart, user, perfil, isAuthLoading, supabase]);

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
