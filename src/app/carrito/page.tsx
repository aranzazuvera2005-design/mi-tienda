"use client";

import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from '@supabase/ssr';

export default function CarritoPage() {
  const { cart, clearCart, removeFromCart, addToCart, enviarPedido, user } = useCart();
  const [mounted, setMounted] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Auto-completar datos del usuario si está logeado
  useEffect(() => {
    const fillProfile = async () => {
      if (!user) return;
      try {
        setLoadingPerfil(true);
        const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data, error } = await supabase.from('perfiles').select('nombre, telefono, direccion').eq('id', user.id).single();
        if (!error && data) {
          if (data.nombre) setNombre(data.nombre);
          if (data.telefono) setTelefono(data.telefono);
          if (data.direccion) setDireccion(data.direccion);
        }
      } catch (e) {
        console.error('Error cargando perfil:', e);
      } finally {
        setLoadingPerfil(false);
      }
    };

    fillProfile();
  }, [user]);

  if (!mounted) return null;

  const total = cart.reduce((acc: number, item: any) => {
    const precio = typeof item.precio === 'object' ? Number(item.precio) : Number(item.precio || 0);
    return acc + (precio * (item.cantidad || 0));
  }, 0);

  const perfilCompleto = Boolean(nombre && telefono && direccion);

  const handleConfirmar = async () => {
    if (cart.length === 0) return;
    if (!user) {
      alert("Debes iniciar sesión para confirmar la compra");
      return;
    }
    if (!perfilCompleto) {
      alert("Tu perfil está incompleto. Completa tus datos en Perfil antes de confirmar.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await enviarPedido({ nombre, telefono, direccion });
      setCompletado(true);
      clearCart();
    } catch (e: any) {
      setErrorMsg(e?.message || "Error al enviar el pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completado) {
    return (
      <div className="p-10 text-center min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">¡Pedido Recibido!</h1>
        <p className="text-gray-600 mb-8">Gracias {nombre}, procesaremos tu pedido en breve.</p>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">Volver a la tienda</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-white">
      <h1 className="text-2xl font-bold mb-6">Resumen del Carrito</h1>
      <div className="space-y-4 mb-8">
        {cart.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <img src={item.imagen_url || item.imagenUrl || '/globe.svg'} alt={item.nombre} className="w-20 h-20 object-cover rounded-md" />
              <div>
                <p className="font-medium">{item.nombre}</p>
                <p className="text-sm text-gray-500">{Number(item.precio || 0).toFixed(2)}€</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => removeFromCart(item.id)} className="px-3 py-1 bg-gray-100 rounded-md">-</button>
              <span className="w-8 text-center">{item.cantidad || 0}</span>
              <button onClick={() => addToCart(item)} className="px-3 py-1 bg-gray-100 rounded-md">+</button>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Subtotal</div>
              <div className="font-bold">{(Number(item.precio || 0) * (item.cantidad || 0)).toFixed(2)}€</div>
            </div>
          </div>
        ))}

        {cart.length === 0 && (
          <div className="text-center text-gray-500">Tu carrito está vacío.</div>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl shadow-inner mb-6">
        <h2 className="text-xs font-black text-gray-400 uppercase mb-4">Envío</h2>

        {loadingPerfil ? (
          <div className="text-sm text-gray-500 mb-3">Cargando datos del perfil...</div>
        ) : null}

        {/* Si no hay usuario logeado: no mostrar inputs y pedir login */}
        {!user ? (
          <div className="text-sm text-gray-600">Debes <a href="/login" className="text-blue-600 underline">iniciar sesión</a> para usar tus datos de envío. Si ya tienes datos, aparecerán aquí en modo lectura.</div>
        ) : (!nombre && !telefono && !direccion) ? (
          <div className="text-sm text-gray-600">Perfil incompleto. Completa tus datos en <a href="/perfil" className="text-blue-600 underline">Perfil</a> para poder confirmar pedidos.</div>
        ) : (
          <>
            <input value={nombre} readOnly type="text" placeholder="Tu nombre" className="w-full p-3 mb-3 border rounded-xl bg-gray-100" />
            <input value={telefono} readOnly type="text" placeholder="Teléfono" className="w-full p-3 mb-3 border rounded-xl bg-gray-100" />
            <textarea value={direccion} readOnly placeholder="Dirección completa" className="w-full p-3 border rounded-xl bg-gray-100" />
            <div className="text-xs text-gray-500 mt-2">Para modificar tus datos, ve a <a href="/perfil" className="underline text-blue-600">Perfil</a>.</div>
          </>
        )}
      </div>

      {errorMsg && <div className="text-red-500 mb-4">{errorMsg}</div>}

      <div className="flex justify-between items-center mb-6 px-2">
        <span className="text-xl font-bold">Total:</span>
        <span className="text-2xl font-black">{total.toFixed(2)}€</span>
      </div>

      <button onClick={handleConfirmar} disabled={isSubmitting || cart.length === 0} className={`w-full ${isSubmitting ? 'bg-gray-400' : 'bg-green-500'} text-white py-5 rounded-2xl font-bold text-lg shadow-lg`}>
        {isSubmitting ? 'Procesando...' : 'CONFIRMAR COMPRA'}
      </button>
    </div>
  );
}