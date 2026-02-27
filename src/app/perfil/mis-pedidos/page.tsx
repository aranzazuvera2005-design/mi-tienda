'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Package, Calendar, DollarSign, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';

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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={24} />
          <div>
            <h3 className="font-bold text-yellow-900">Debes iniciar sesión</h3>
            <p className="text-yellow-800 text-sm">Para ver tus pedidos, inicia sesión primero.</p>
          </div>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <Package size={32} className="text-blue-600" />
        <h1 className="text-3xl font-black">Mis Pedidos</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No tienes pedidos aún</h3>
          <p className="text-gray-600 mb-6">Cuando realices tu primer pedido, aparecerá aquí.</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Volver a la tienda
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Header del pedido */}
              <button
                onClick={() => setExpandedId(expandedId === pedido.id ? null : pedido.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Package size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Pedido #{pedido.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-lg font-bold text-gray-900">${pedido.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar size={16} />
                      {formatearFecha(pedido.creado_at)}
                    </p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                      pedido.estado === 'Enviado' ? 'bg-green-100 text-green-800' :
                      pedido.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pedido.estado}
                    </span>
                  </div>
                </div>
                <div className="ml-4 text-gray-400">
                  {expandedId === pedido.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </button>

              {/* Contenido expandido */}
              {expandedId === pedido.id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                  {/* Dirección de entrega */}
                  {pedido.direccion_entrega && (
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-1">Dirección de entrega:</p>
                      <p className="text-gray-600">{pedido.direccion_entrega}</p>
                    </div>
                  )}

                  {/* Productos */}
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3">Productos:</p>
                    <div className="space-y-2">
                      {pedido.articulos && Array.isArray(pedido.articulos) && pedido.articulos.length > 0 ? (
                        pedido.articulos.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded">
                            <span className="text-gray-700">{item.nombre} x{item.cantidad}</span>
                            <span className="font-bold text-gray-900">${(Number(item.precio) * item.cantidad).toFixed(2)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No hay productos registrados</p>
                      )}
                    </div>
                  </div>

                  {/* Botón de devolución */}
                  {puedeSolicitarDevolucion(pedido.creado_at) && (
                    <Link
                      href={`/perfil/solicitar-devolucion?pedidoId=${pedido.id}`}
                      className="block w-full mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-center font-bold transition-colors"
                    >
                      Solicitar Devolución
                    </Link>
                  )}
                  {!puedeSolicitarDevolucion(pedido.creado_at) && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                      <p>No puedes solicitar devolución (han pasado más de 30 días desde la compra)</p>
                    </div>
                  )}

                  {/* Ver devoluciones */}
                  <Link
                    href="/perfil/mis-devoluciones"
                    className="block w-full mt-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-center font-bold transition-colors"
                  >
                    Ver mis devoluciones
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
