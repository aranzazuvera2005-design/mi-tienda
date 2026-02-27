'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { RotateCcw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';

export default function MisDevoluciones() {
  const [devoluciones, setDevoluciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useCart();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  useEffect(() => {
    if (!user || !supabase) {
      setCargando(false);
      return;
    }
    fetchDevoluciones();
  }, [user, supabase]);

  const fetchDevoluciones = async () => {
    if (!supabase || !user) return;
    setCargando(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('devoluciones')
        .select(`
          *,
          pedido:pedidos(id, cliente_id, creado_at, total),
          producto:productos(id, nombre, precio)
        `)
        .eq('pedido.cliente_id', user.id)
        .order('fecha_solicitud', { ascending: false });

      if (err) throw err;
      setDevoluciones(data || []);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar devoluciones');
    } finally {
      setCargando(false);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Aprobada':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'Rechazada':
        return <XCircle className="text-red-600" size={24} />;
      case 'Completada':
        return <CheckCircle className="text-blue-600" size={24} />;
      default:
        return <Clock className="text-yellow-600" size={24} />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Aprobada':
        return 'bg-green-100 text-green-800';
      case 'Rechazada':
        return 'bg-red-100 text-red-800';
      case 'Completada':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
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
            <p className="text-yellow-800 text-sm">Para ver tus devoluciones, inicia sesión primero.</p>
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
          <p className="mt-4 text-gray-600">Cargando tus devoluciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <RotateCcw size={32} className="text-orange-600" />
        <h1 className="text-3xl font-black">Mis Devoluciones</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {devoluciones.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <RotateCcw size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No tienes devoluciones</h3>
          <p className="text-gray-600 mb-6">Cuando solicites una devolución, aparecerá aquí.</p>
          <Link href="/perfil/mis-pedidos" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Ver mis pedidos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {devoluciones.map((devolucion) => (
            <div key={devolucion.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  {getEstadoIcon(devolucion.estado)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-600">Devolución #{devolucion.id.slice(0, 8).toUpperCase()}</p>
                      <h3 className="text-lg font-bold text-gray-900">
                        {devolucion.producto?.nombre || 'Producto no disponible'}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(devolucion.estado)}`}>
                      {devolucion.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Cantidad</p>
                      <p className="font-bold text-gray-900">{devolucion.cantidad} unidad(es)</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Precio unitario</p>
                      <p className="font-bold text-gray-900">${devolucion.producto?.precio || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Solicitado</p>
                      <p className="font-bold text-gray-900">{formatearFecha(devolucion.fecha_solicitud)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Límite</p>
                      <p className="font-bold text-gray-900">{formatearFecha(devolucion.fecha_limite)}</p>
                    </div>
                  </div>

                  {devolucion.motivo && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">Motivo:</p>
                      <p className="text-gray-700">{devolucion.motivo}</p>
                    </div>
                  )}

                  {devolucion.observaciones_admin && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                      <p className="text-blue-900">
                        <strong>Observación del equipo:</strong> {devolucion.observaciones_admin}
                      </p>
                    </div>
                  )}

                  {/* Información de estado */}
                  {devolucion.estado === 'Pendiente' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm mt-3">
                      <p className="text-yellow-900">
                        Tu solicitud está siendo revisada. Nos pondremos en contacto contigo pronto.
                      </p>
                    </div>
                  )}
                  {devolucion.estado === 'Aprobada' && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 text-sm mt-3">
                      <p className="text-green-900">
                        Tu devolución ha sido aprobada. Por favor, contacta con nuestro equipo para coordinar el envío.
                      </p>
                    </div>
                  )}
                  {devolucion.estado === 'Rechazada' && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm mt-3">
                      <p className="text-red-900">
                        Tu solicitud de devolución ha sido rechazada. Consulta la observación del equipo arriba.
                      </p>
                    </div>
                  )}
                  {devolucion.estado === 'Completada' && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm mt-3">
                      <p className="text-blue-900">
                        Tu devolución ha sido completada. Gracias por tu compra.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/perfil/mis-pedidos" className="text-blue-600 hover:text-blue-800 font-bold">
          ← Volver a mis pedidos
        </Link>
      </div>
    </div>
  );
}
