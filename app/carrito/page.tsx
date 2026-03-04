"use client";

import { useCart } from '@/context/CartContext';
import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from '@supabase/ssr';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import Card from '@/components/Card';

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
  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [mostrarNuevaDir, setMostrarNuevaDir] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auto-completar datos del usuario y cargar sus direcciones
  useEffect(() => {
    const fillProfile = async () => {
      if (!user) return;
      try {
        setLoadingPerfil(true);
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
        const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
        if (!SUPABASE_URL || !SUPABASE_ANON) return;
        
        const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
        
        // 1. Cargar perfil
        const { data: perfil } = await supabase.from('perfiles').select('nombre, telefono').eq('id', user.id).single();
        if (perfil) {
          setNombre(perfil.nombre || "");
          setTelefono(perfil.telefono || "");
        }

        // 2. Cargar direcciones
        const { data: dirs } = await supabase.from('direcciones').select('*').eq('cliente_id', user.id);
        if (dirs && dirs.length > 0) {
          setDirecciones(dirs);
          const principal = dirs.find(d => d.es_principal) || dirs[0];
          setDireccion(principal.calle);
        } else {
          setMostrarNuevaDir(true);
        }
      } catch (e) {
        console.error('Error cargando datos:', e);
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

  const perfilCompleto = true;

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
      <div className="py-12 min-h-screen flex flex-col justify-center items-center">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="text-green-600" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">¡Pedido Recibido!</h1>
          <p className="text-slate-600 mb-6">Gracias {nombre}, procesaremos tu pedido en breve.</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
            Volver a la tienda
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto">
        {/* Título */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-xl">
            <ShoppingCart className="text-blue-600" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Carrito de Compra</h1>
        </div>

        {/* Productos */}
        <Card className="p-6 mb-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="text-slate-300 mx-auto mb-4" size={48} />
              <p className="text-slate-600 text-lg">Tu carrito está vacío</p>
              <Link href="/" className="inline-block mt-4 text-blue-600 font-bold hover:underline">
                Continuar comprando
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item: any) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  {/* Imagen */}
                  <div className="w-20 h-20 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200">
                    <img 
                      src={item.imagen_url || item.imagenUrl || '/globe.svg'} 
                      alt={item.nombre} 
                      className="max-w-full max-h-full object-contain p-1"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/globe.svg'; }}
                    />
                  </div>

                  {/* Detalles */}
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{item.nombre}</h3>
                    <p className="text-sm text-slate-600 mt-1">{Number(item.precio || 0).toFixed(2)}€</p>
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                    >
                      <Minus size={16} className="text-slate-600" />
                    </button>
                    <span className="w-6 text-center font-bold text-slate-900">{item.cantidad || 0}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                    >
                      <Plus size={16} className="text-slate-600" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-fit">
                    <p className="text-sm text-slate-600">Subtotal</p>
                    <p className="font-extrabold text-slate-900">{(Number(item.precio || 0) * (item.cantidad || 0)).toFixed(2)}€</p>
                  </div>

                  {/* Eliminar */}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Formulario de envío */}
        {cart.length > 0 && (
          <>
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">📦</span>
                </div>
                Información de Envío
              </h2>

              {loadingPerfil ? (
                <div className="text-sm text-slate-500 text-center py-4">Cargando datos del perfil...</div>
              ) : !user ? (
                <div className="text-center py-6">
                  <p className="text-slate-600 mb-4">Debes <Link href="/login" className="text-blue-600 font-bold hover:underline">iniciar sesión</Link> para finalizar tu compra.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre para el envío</label>
                    <input 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value)} 
                      type="text" 
                      placeholder="Tu nombre completo" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono de contacto</label>
                    <input 
                      value={telefono} 
                      onChange={(e) => setTelefono(e.target.value)} 
                      type="text" 
                      placeholder="Tu teléfono" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Dirección de entrega</label>
                    {direcciones.length > 0 && !mostrarNuevaDir ? (
                      <div className="space-y-2">
                        <select 
                          value={direccion} 
                          onChange={(e) => {
                            if (e.target.value === "nueva") {
                              setMostrarNuevaDir(true);
                              setDireccion("");
                            } else {
                              setDireccion(e.target.value);
                            }
                          }}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                          {direcciones.map((d, idx) => (
                            <option key={d.id || idx} value={d.calle}>
                              {d.calle} {d.es_principal ? '(Principal)' : ''}
                            </option>
                          ))}
                          <option value="nueva">+ Añadir nueva dirección...</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <textarea 
                          value={direccion} 
                          onChange={(e) => setDireccion(e.target.value)} 
                          placeholder="Calle, número, piso, ciudad, código postal..." 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                          rows={3}
                        />
                        {direcciones.length > 0 && (
                          <button 
                            type="button"
                            onClick={() => {
                              setMostrarNuevaDir(false);
                              const principal = direcciones.find(d => d.es_principal) || direcciones[0];
                              setDireccion(principal.calle);
                            }}
                            className="text-sm text-blue-600 font-bold mt-2 hover:underline"
                          >
                            ← Volver a mis direcciones guardadas
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Resumen y total */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{total.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Envío</span>
                  <span>Gratis</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="font-extrabold text-slate-900 text-lg">Total</span>
                  <span className="font-extrabold text-slate-900 text-lg">{total.toFixed(2)}€</span>
                </div>
              </div>
            </Card>

            {/* Errores */}
            {errorMsg && (
              <Card className="p-4 mb-6 bg-red-50 border-red-200">
                <p className="text-red-800 text-sm">{errorMsg}</p>
              </Card>
            )}

            {/* Botón confirmar */}
            <button 
              onClick={handleConfirmar} 
              disabled={isSubmitting || cart.length === 0 || !user}
              className={`w-full py-4 rounded-xl font-extrabold text-lg transition-all ${
                isSubmitting || cart.length === 0 || !user
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isSubmitting ? 'Procesando...' : 'CONFIRMAR COMPRA'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
