'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from './ToastContext';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const { addToast } = useToast();

  const addToCart = (producto: any) => {
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

    try {
      // PASO 1: Upsert del perfil (crear o actualizar)
      const { error: pError } = await supabase.from('perfiles').upsert({
        id: user.id,
        nombre: datosEnvio.nombre,
        telefono: datosEnvio.telefono,
        direccion: datosEnvio.direccion,
        updated_at: new Date()
      }, { onConflict: 'id' });

      if (pError) throw new Error("Error Perfil: " + pError.message);

      // PASO 2: Insertar pedido
      const { data, error: oError } = await supabase.from('pedidos').insert({
        cliente_id: user.id,
        total: total,
        articulos: cart,
        direccion_entrega: datosEnvio.direccion,
        estado: 'Pendiente'
      }).select().single();

      if (oError) throw new Error("Error Pedido: " + oError.message);

      addToast({ message: 'Pedido enviado correctamente', type: 'success' });
      setCart([]);
      return data;
    } catch (e: any) {
      addToast({ message: `Error enviando pedido: ${e?.message || e}`, type: 'error' });
      throw e;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
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