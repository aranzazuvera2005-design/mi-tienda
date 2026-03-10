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

  // Marcar que el componente está montado en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Crear cliente de Supabase solo en el cliente
  const supabase = useMemo(() => {
    if (typeof window !== 'undefined' && SUPABASE_URL && SUPABASE_ANON) {
      try {
        return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
      } catch (e) {
        console.error('Error creating Supabase client:', e);
        return null;
      }
    }
    return null;
  }, [SUPABASE_URL, SUPABASE_ANON]);

  const toastContext = useToast();

  // Inicializar autenticación solo cuando está montado
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
      const totalPedido = cart.reduce((acc, item) => {
        const precio = Number(item.precio || 0);
        return acc + (precio * (item.cantidad || 1));
      }, 0);

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

      const { error: perfilError } = await supabase
        .from('perfiles')
        .update({
          nombre: datos.nombre,
          telefono: datos.telefono,
        })
        .eq('id', user.id);

      if (perfilError) {
        console.warn('Advertencia: No se pudo actualizar el perfil', perfilError);
      }

      return { success: true, pedidoId: pedidoData.id };
    } catch (error: any) {
      throw new Error(error?.message || 'Error desconocido al enviar el pedido');
    }
  };

  // Memoizar el valor para evitar re-renders innecesarios
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
  
  if (!context) {
    // Retornar un objeto seguro por defecto
    return { 
      cart: [], 
      total: 0, 
      user: null, 
      perfil: null,
      isAuthLoading: true,
      addToCart: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      enviarPedido: async () => { throw new Error('CartProvider no encontrado'); },
      logout: async () => {}
    };
  }
  
  return context;
};
