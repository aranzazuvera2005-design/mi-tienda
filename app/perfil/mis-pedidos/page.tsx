'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Package, Calendar, AlertCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import Card from '@/components/Card';

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { user } = useCart();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  useEffect(() => {
    if (!user || !supabase) {
      setCargando(false);
      return;
    }
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

  const puedeSolicitarDevolucion = (fechaPedido: string) => {
    const fecha = new Date(fechaPedido);
    const ahora = new Date();
    const diasTranscurridos = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
    return diasTranscurridos <= 30;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Enviado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (!user) {
    return (
      <div className="py-12">
        <Card className="p-8 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-extrabold text-yellow-900 text-lg">Debes iniciar sesión</h3>
              <p className="text-yellow-800 text-sm mt-1">Para ver tus pedidos, inicia sesión primero.</p>
              <Link href="/login" className="inline-block mt-4 text-yellow-700 font-bold hover:underline">
                Ir a login →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="py-12">
        <Card className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 font-medium">Cargando tus pedidos...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto">
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Package className="text-blue-600" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Mis Pedidos</h1>
        </div>

        {/* Error */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* Sin pedidos */}
        {pedidos.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">No tienes pedidos aún</h3>
            <p className="text-slate-600 mb-6">Cuando realices tu primer pedido, aparecerá aquí.</p>
            <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-bold transition-colors">
              Ir a la tienda
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <Card key={pedido.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Header del pedido */}
                <button
                  onClick={() => setExpandedId(expandedId === pedido.id ? null : pedido.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Package size={24} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 font-medium">Pedido #{pedido.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-lg font-extrabold text-slate-900 mt-1">{pedido.total}€</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-slate-600 flex items-center gap-1 justify-end mb-2">
                        <Calendar size={16} />
                        {formatearFecha(pedido.creado_at)}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(pedido.estado)}`}>
                        {pedido.estado}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-slate-400">
                    {expandedId === pedido.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </button>

                {/* Contenido expandido */}
                {expandedId === pedido.id && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50 space-y-4">
                    {/* Estado en mobile */}
                    <div className="sm:hidden">
                      <p className="text-sm text-slate-600 flex items-center gap-1 mb-2">
                        <Calendar size={16} />
                        {formatearFecha(pedido.creado_at)}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(pedido.estado)}`}>
                        {pedido.estado}
                      </span>
                    </div>

                    {/* Dirección de entrega */}
                    {pedido.direccion_entrega && (
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 mb-2">📍 Dirección de entrega:</p>
                        <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">{pedido.direccion_entrega}</p>
                      </div>
                    )}

                    {/* Productos */}
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 mb-3">📦 Productos:</p>
                      <div className="space-y-2">
                        {pedido.articulos && Array.isArray(pedido.articulos) && pedido.articulos.length > 0 ? (
                          pedido.articulos.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm bg-white p-3 rounded-lg border border-slate-200">
                              <span className="text-slate-700 font-medium">{item.nombre} <span className="text-slate-500">x{item.cantidad}</span></span>
                              <span className="font-extrabold text-slate-900">{(Number(item.precio) * item.cantidad).toFixed(2)}€</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 text-sm">No hay productos registrados</p>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col gap-2 pt-2">
                      {puedeSolicitarDevolucion(pedido.creado_at) && (
                        <Link
                          href={`/perfil/solicitar-devolucion?pedidoId=${pedido.id}`}
                          className="block w-full bg-orange-600 text-white px-4 py-2.5 rounded-lg hover:bg-orange-700 text-center font-bold transition-colors"
                        >
                          Solicitar Devolución
                        </Link>
                      )}
                      {!puedeSolicitarDevolucion(pedido.creado_at) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                          <p className="font-medium">No puedes solicitar devolución</p>
                          <p className="text-xs mt-1">Han pasado más de 30 días desde la compra</p>
                        </div>
                      )}
                      <Link
                        href="/perfil/mis-devoluciones"
                        className="block w-full bg-slate-200 text-slate-800 px-4 py-2.5 rounded-lg hover:bg-slate-300 text-center font-bold transition-colors"
                      >
                        Ver mis devoluciones
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Volver */}
        <div className="mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft size={18} />
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
