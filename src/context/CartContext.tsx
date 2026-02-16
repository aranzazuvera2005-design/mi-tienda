'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from './ToastContext';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
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
      const msg = 'Supabase no está configurado. No se puede enviar el pedido ahora.';
      addToast({ message: msg, type: 'error' });
      throw new Error(msg);
    }

    try {
      // 1. Asegurar que el perfil existe (usar upsert)
      const { error: pError } = await supabase.from('perfiles').upsert({
        id: user.id,
        email: user.email,
        nombre: datosEnvio.nombre,
        telefono: datosEnvio.telefono,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (pError) throw new Error('Error Perfil: ' + pError.message);

      // 2. Verificar si la dirección ya existe para este cliente, si no, añadirla
      const { data: existingDir } = await supabase
        .from('direcciones')
        .select('id')
        .eq('cliente_id', user.id)
        .eq('calle', datosEnvio.direccion)
        .single();

      if (!existingDir) {
        await supabase.from('direcciones').insert({
          cliente_id: user.id,
          calle: datosEnvio.direccion,
          es_principal: false
        });
      }

      // 3. Crear el pedido
      const { data, error: oError } = await supabase.from('pedidos').insert({
        cliente_id: user.id,
        total: total,
        articulos: cart,
        direccion_entrega: datosEnvio.direccion,
        estado: 'Pendiente'
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
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart, total, user, enviarPedido, logout, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);