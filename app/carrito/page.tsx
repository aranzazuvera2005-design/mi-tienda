'use client';

import { useCart } from '@/context/CartContext';
import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from '@supabase/ssr';
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, MapPin, Phone, User as UserIcon, ShieldCheck } from 'lucide-react';
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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fillProfile = async () => {
      if (!user) return;
      try {
        setLoadingPerfil(true);
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
        const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
        if (!SUPABASE_URL || !SUPABASE_ANON) return;
        
        const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
        
        const { data: perfil } = await supabase.from('perfiles').select('nombre, telefono').eq('id', user.id).single();
        if (perfil) {
          setNombre(perfil.nombre || "");
          setTelefono(perfil.telefono || "");
        }

        const { data: dirs } = await supabase.from('direcciones').select('*').eq('cliente_id', user.id);
        if (dirs && dirs.length > 0) {
          setDirecciones(dirs);
          const principal = dirs.find(d => d.es_principal) || dirs[0];
          setDireccion(principal.calle);
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

  const handleConfirmar = async () => {
    if (cart.length === 0) return;
    if (!user) {
      alert("Debes iniciar sesión para confirmar la compra");
      return;
    }
    if (!nombre || !telefono || !direccion) {
      alert("Por favor, completa todos los datos de envío.");
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
      <div className="py-12 sm:py-20 min-h-[70vh] flex flex-col justify-center items-center">
        <Card className="max-w-md w-full p-10 text-center rounded-[3rem] shadow-2xl shadow-green-100 border-none animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldCheck className="text-green-600" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">¡Pedido Recibido!</h1>
          <p className="text-slate-600 mb-8 font-medium">Gracias {nombre}, procesaremos tu pedido en breve. Recibirás un email con los detalles.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95">
            <ArrowLeft size={20} />
            Volver a la tienda
          </Link>
        </Card>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="py-12 sm:py-20">
        <Card className="max-w-2xl mx-auto p-12 sm:p-20 text-center rounded-[3rem] shadow-2xl shadow-slate-200/50 border-none animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <ShoppingBag size={48} className="text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Tu carrito está vacío</h1>
          <p className="text-slate-500 text-lg mb-10 font-medium max-w-md mx-auto">
            Parece que aún no has añadido nada. ¡Explora nuestra tienda y encuentra algo increíble!
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-full font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
          >
            <ArrowLeft size={20} />
            Volver a la tienda
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Lista de productos */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <ShoppingCart className="text-white" size={28} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Tu Carrito</h1>
          </div>

          <div className="space-y-4">
            {cart.map((item: any) => (
              <Card key={item.id} className="p-4 sm:p-6 rounded-[2rem] shadow-xl shadow-slate-200/40 border-none hover:shadow-2xl transition-all duration-500 group">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-full sm:w-32 h-32 bg-slate-50 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                    <img 
                      src={item.imagen_url || item.imagenUrl || '/globe.svg'} 
                      alt={item.nombre} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/globe.svg'; }}
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{item.nombre}</h3>
                    <p className="text-blue-600 font-black text-lg">{Number(item.precio || 0).toFixed(2)}€</p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-full border border-slate-100 shadow-inner">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 hover:bg-white hover:text-red-500 rounded-full transition-all shadow-sm hover:shadow-md active:scale-90"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="font-black text-slate-900 min-w-[24px] text-center text-lg">{item.cantidad}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="p-2 hover:bg-white hover:text-blue-600 rounded-full transition-all shadow-sm hover:shadow-md active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal</p>
                    <p className="text-xl font-black text-slate-900">{(Number(item.precio || 0) * item.cantidad).toFixed(2)}€</p>
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Resumen y Envío */}
        <div className="w-full lg:w-[450px] space-y-6">
          {/* Información de Envío */}
          <Card className="p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-none">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <MapPin className="text-blue-600" size={24} />
              Envío
            </h2>

            {loadingPerfil ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !user ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-600 mb-4 font-medium">Inicia sesión para finalizar</p>
                <Link href="/login" className="inline-block bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-800 transition-all">
                  Iniciar Sesión
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    <UserIcon size={14} /> Nombre completo
                  </label>
                  <input 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    type="text" 
                    placeholder="Tu nombre" 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    <Phone size={14} /> Teléfono
                  </label>
                  <input 
                    value={telefono} 
                    onChange={(e) => setTelefono(e.target.value)} 
                    type="text" 
                    placeholder="Tu teléfono" 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    <MapPin size={14} /> Dirección de entrega
                  </label>
                  {direcciones.length > 0 ? (
                    <select
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800 appearance-none"
                    >
                      {direcciones.map((d, idx) => (
                        <option key={d.id || idx} value={d.calle}>{d.calle}{d.es_principal ? ' (Principal)' : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-bold text-amber-700 flex items-center justify-between gap-3">
                      <span>No tienes direcciones guardadas</span>
                      <Link href="/perfil" className="text-blue-600 underline font-black text-xs whitespace-nowrap">
                        Añadir en Mi Perfil →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Resumen Final */}
          <Card className="p-8 rounded-[2.5rem] shadow-2xl shadow-blue-100 border-none bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-8 relative z-10">Resumen</h2>
            
            <div className="space-y-4 mb-8 relative z-10">
              <div className="flex justify-between text-slate-500 font-bold">
                <span>Subtotal</span>
                <span className="text-slate-900">{total.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold">
                <span>Envío</span>
                <span className="text-green-600">Gratis</span>
              </div>
              <div className="h-px bg-slate-100 my-4"></div>
              <div className="flex justify-between items-end">
                <span className="text-lg font-black text-slate-900">Total</span>
                <span className="text-4xl font-black text-blue-600 leading-none">{total.toFixed(2)}€</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
                {errorMsg}
              </div>
            )}

            <button 
              onClick={handleConfirmar}
              disabled={isSubmitting || !user}
              className={`flex items-center justify-center gap-3 w-full py-5 rounded-full font-black text-xl transition-all shadow-xl active:scale-95 relative z-10 group ${
                isSubmitting || !user
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  Confirmar Pedido
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <p className="text-center text-slate-400 text-[10px] mt-6 font-black uppercase tracking-widest relative z-10">
              Seguridad Garantizada SSL
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
