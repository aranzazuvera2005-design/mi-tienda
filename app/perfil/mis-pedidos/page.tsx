'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ShoppingBag, Calendar, ChevronDown, Package, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import Card from '@/components/Card';
import ResenaForm from '@/components/ResenaForm';

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // { [`${pedidoId}-${productoId}`]: { yaReseno, mostrando } }
  const [resenasEstado, setResenasEstado] = useState<Record<string, { yaReseno: boolean; mostrando: boolean }>>({});
  const { user } = useCart();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  useEffect(() => {
    if (!user || !supabase) { setCargando(false); return; }
    fetchPedidos();
  }, [user, supabase]);

  const fetchPedidos = async () => {
    if (!supabase || !user) return;
    setCargando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', user.id)
        .order('creado_at', { ascending: false });
      if (err) throw err;
      setPedidos(data || []);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar pedidos');
    } finally {
      setCargando(false);
    }
  };

  // Al expandir un pedido, comprobar estado de reseña de cada producto
  const handleExpand = async (pedidoId: string, articulos: any[]) => {
    const nuevo = expandedId === pedidoId ? null : pedidoId;
    setExpandedId(nuevo);

    if (nuevo && user) {
      const ids = articulos.map((a: any) => a.id).filter(Boolean);
      await Promise.all(ids.map(async (productoId: string) => {
        const key = `${pedidoId}-${productoId}`;
        if (resenasEstado[key] !== undefined) return;
        try {
          const res = await fetch(`/api/resenas/puede-resenar?productoId=${productoId}&clienteId=${user.id}&pedidoId=${pedidoId}`);
          if (res.ok) {
            const json = await res.json();
            setResenasEstado(prev => ({
              ...prev,
              [key]: { yaReseno: json.yaReseno, mostrando: false },
            }));
          }
        } catch {}
      }));
    }
  };

  const toggleFormulario = (key: string) => {
    setResenasEstado(prev => ({
      ...prev,
      [key]: { ...prev[key], mostrando: !prev[key]?.mostrando },
    }));
  };

  const onResenaCreada = (key: string) => {
    setResenasEstado(prev => ({
      ...prev,
      [key]: { yaReseno: true, mostrando: false },
    }));
  };

  const getStatusColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'enviado': return 'bg-green-100 text-green-700 border-green-200';
      case 'pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'enviado': return <Package size={16} />;
      case 'pagado': return <CheckCircle size={16} />;
      case 'cancelado': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      + ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const puedeSolicitarDevolucion = (fechaPedido: string) => {
    const dias = Math.floor((Date.now() - new Date(fechaPedido).getTime()) / (1000 * 60 * 60 * 24));
    return dias <= 30;
  };

  if (!user) {
    return (
      <div className="py-12 sm:py-20">
        <Card className="max-w-2xl mx-auto p-12 text-center rounded-[3rem] shadow-2xl shadow-slate-200/50 border-none animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle className="text-yellow-600" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Debes iniciar sesión</h1>
          <p className="text-slate-500 text-lg mb-10 font-medium">Para ver tus pedidos, primero debes identificarte.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            Iniciar Sesión
          </Link>
        </Card>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="py-12 sm:py-20 flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <ShoppingBag className="text-white" size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Mis Pedidos</h1>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">{error}</div>
        )}

        {pedidos.length === 0 ? (
          <Card className="p-16 text-center rounded-[3rem] shadow-xl shadow-slate-200/40 border-none">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Package size={40} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Aún no tienes pedidos</h3>
            <p className="text-slate-500 mb-8 font-medium">Cuando realices tu primera compra, aparecerá aquí.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95">
              <ArrowLeft size={20} /> Ir a la tienda
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => (
              <Card key={pedido.id} className="overflow-hidden rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-none hover:shadow-2xl transition-all duration-500 group">
                {/* Cabecera */}
                <button
                  onClick={() => handleExpand(pedido.id, pedido.articulos || [])}
                  className="w-full flex items-center justify-between p-6 sm:p-8 text-left transition-colors hover:bg-slate-50/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10">
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">ID Pedido</p>
                      <p className="text-sm font-black text-slate-900">#{pedido.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Fecha</p>
                      <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-600" />
                        {formatearFecha(pedido.creado_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Total</p>
                      <p className="text-lg font-black text-blue-600">{Number(pedido.total).toFixed(2)}€</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusColor(pedido.estado)}`}>
                      {getStatusIcon(pedido.estado)}
                      {pedido.estado}
                    </div>
                  </div>
                  <div className={`p-2 rounded-full bg-slate-50 text-slate-400 transition-transform duration-300 ${expandedId === pedido.id ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`}>
                    <ChevronDown size={24} />
                  </div>
                </button>

                {/* Detalles expandidos */}
                {expandedId === pedido.id && (
                  <div className="border-t border-slate-100 p-6 sm:p-8 bg-slate-50/30 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Productos */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Package size={14} /> Productos
                        </h4>
                        <div className="space-y-3">
                          {pedido.articulos?.map((item: any, idx: number) => {
                            const productoId = item.id;
                            const key = productoId ? `${pedido.id}-${productoId}` : undefined;
                            const estado = key ? resenasEstado[key] : undefined;
                            return (
                              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="flex justify-between items-center p-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-black text-slate-900">{item.nombre}</span>
                                    <span className="text-xs text-slate-500 font-bold">Cantidad: {item.cantidad}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-blue-600">{(Number(item.precio) * item.cantidad).toFixed(2)}€</span>
                                    {key && (
                                      estado?.yaReseno ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                                          <Star size={11} className="fill-amber-400 text-amber-400" /> Reseñado
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => toggleFormulario(key)}
                                          className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 px-3 py-1.5 rounded-full transition-colors"
                                        >
                                          <Star size={11} />
                                          {estado?.mostrando ? 'Cancelar' : 'Reseñar'}
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Formulario de reseña inline */}
                                {key && estado?.mostrando && !estado?.yaReseno && (
                                  <div className="border-t border-slate-100 p-4">
                                    <ResenaForm
                                      productoId={productoId}
                                      clienteId={user.id}
                                      pedidoId={pedido.id}
                                      onResenaCreada={() => onResenaCreada(key)}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Info adicional */}
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={14} /> Dirección de entrega
                          </h4>
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                              {pedido.direccion_ent || pedido.direccion_entrega || 'No especificada'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          {puedeSolicitarDevolucion(pedido.creado_at) ? (
                            <Link
                              href={`/perfil/solicitar-devolucion?pedidoId=${pedido.id}`}
                              className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white px-6 py-3.5 rounded-full font-black text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-95"
                            >
                              Solicitar Devolución
                            </Link>
                          ) : (
                            <div className="p-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-bold text-center border border-slate-200">
                              Plazo de devolución finalizado (30 días)
                            </div>
                          )}
                          <Link
                            href="/perfil/mis-devoluciones"
                            className="flex items-center justify-center gap-2 w-full bg-white text-slate-900 px-6 py-3.5 rounded-full font-black text-sm hover:bg-slate-50 transition-all border border-slate-200 shadow-sm active:scale-95"
                          >
                            Ver mis devoluciones
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-sm uppercase tracking-widest transition-colors">
            <ArrowLeft size={18} /> Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
