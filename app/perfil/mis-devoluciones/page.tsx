'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { RotateCcw, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext'
import Card from '@/components/Card';

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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rechazada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Completada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="py-12">
        <Card className="p-8 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-extrabold text-yellow-900 text-lg">Debes iniciar sesión</h3>
              <p className="text-yellow-800 text-sm mt-1">Para ver tus devoluciones, inicia sesión primero.</p>
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
          <p className="mt-4 text-slate-600 font-medium">Cargando tus devoluciones...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto">
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-orange-100 p-3 rounded-xl">
            <RotateCcw className="text-orange-600" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Mis Devoluciones</h1>
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

        {/* Sin devoluciones */}
        {devoluciones.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">No tienes devoluciones</h3>
            <p className="text-slate-600 mb-6">Cuando solicites una devolución, aparecerá aquí.</p>
            <Link href="/perfil/mis-pedidos" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-bold transition-colors">
              Ver mis pedidos
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {devoluciones.map((devolucion) => (
              <Card key={devolucion.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Icono de estado */}
                  <div className="bg-orange-100 p-3 rounded-lg flex-shrink-0">
                    {getEstadoIcon(devolucion.estado)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Encabezado */}
                    <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Devolución #{devolucion.id.slice(0, 8).toUpperCase()}</p>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                          {devolucion.producto?.nombre || 'Producto no disponible'}
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoColor(devolucion.estado)} flex-shrink-0`}>
                        {devolucion.estado}
                      </span>
                    </div>

                    {/* Detalles */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase mb-1">Cantidad</p>
                        <p className="font-extrabold text-slate-900">{devolucion.cantidad} unidad(es)</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase mb-1">Precio unitario</p>
                        <p className="font-extrabold text-slate-900">{devolucion.producto?.precio || 'N/A'}€</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase mb-1">Solicitado</p>
                        <p className="font-extrabold text-slate-900">{formatearFecha(devolucion.fecha_solicitud)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase mb-1">Límite</p>
                        <p className="font-extrabold text-slate-900">{formatearFecha(devolucion.fecha_limite)}</p>
                      </div>
                    </div>

                    {/* Motivo */}
                    {devolucion.motivo && (
                      <div className="mb-3">
                        <p className="text-sm font-bold text-slate-900 mb-1">Motivo:</p>
                        <p className="text-slate-700 text-sm">{devolucion.motivo}</p>
                      </div>
                    )}

                    {/* Observaciones del admin */}
                    {devolucion.observaciones_admin && (
                      <Card className="p-4 mb-3 bg-blue-50 border-blue-200">
                        <p className="text-blue-900 text-sm">
                          <strong>Observación del equipo:</strong> {devolucion.observaciones_admin}
                        </p>
                      </Card>
                    )}

                    {/* Mensajes de estado */}
                    {devolucion.estado === 'Pendiente' && (
                      <Card className="p-4 bg-yellow-50 border-yellow-200">
                        <p className="text-yellow-900 text-sm font-medium">
                          ⏳ Tu solicitud está siendo revisada. Nos pondremos en contacto contigo pronto.
                        </p>
                      </Card>
                    )}
                    {devolucion.estado === 'Aprobada' && (
                      <Card className="p-4 bg-green-50 border-green-200">
                        <p className="text-green-900 text-sm font-medium">
                          ✓ Tu devolución ha sido aprobada. Por favor, contacta con nuestro equipo para coordinar el envío.
                        </p>
                      </Card>
                    )}
                    {devolucion.estado === 'Rechazada' && (
                      <Card className="p-4 bg-red-50 border-red-200">
                        <p className="text-red-900 text-sm font-medium">
                          ✗ Tu solicitud de devolución ha sido rechazada. Consulta la observación del equipo arriba.
                        </p>
                      </Card>
                    )}
                    {devolucion.estado === 'Completada' && (
                      <Card className="p-4 bg-blue-50 border-blue-200">
                        <p className="text-blue-900 text-sm font-medium">
                          ✓ Tu devolución ha sido completada. Gracias por tu compra.
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Volver */}
        <div className="mt-8">
          <Link href="/perfil/mis-pedidos" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft size={18} />
            Volver a mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
