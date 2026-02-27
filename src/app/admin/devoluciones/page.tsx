'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useRef } from 'react';
import { RotateCcw, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function AdminDevoluciones() {
  const [devoluciones, setDevoluciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const { addToast } = useToast();

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState('');
  const [query, setQuery] = useState('');

  const channelRef = useRef<any>(null);
  const searchTimer = useRef<any>(null);

  // Debounce búsqueda
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchDevoluciones({ page: 1 });
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filtroEstado]);

  // Cuando cambia la página
  useEffect(() => {
    fetchDevoluciones({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    let supabase: any = null;
    fetchDevoluciones({ page: 1 });

    // Suscripción en tiempo real
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON) {
        throw new Error('Supabase no configurado');
      }
      supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);

      const channel = supabase
        .channel('public:devoluciones')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'devoluciones' }, () => {
          fetchDevoluciones({ page });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devoluciones' }, () => {
          fetchDevoluciones({ page });
        })
        .subscribe();

      channelRef.current = channel;
    } catch (e: any) {
      console.error('Error iniciando suscripción realtime:', e);
    }

    return () => {
      try {
        if (channelRef.current && typeof channelRef.current.unsubscribe === 'function') {
          channelRef.current.unsubscribe();
        }
      } catch (e) {
        console.warn('Error limpiando canal:', e);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDevoluciones = async (params?: { page?: number }) => {
    const p = params?.page ?? page;
    setError(null);
    if (p === 1) setCargando(true);
    else setLoadingMore(true);

    try {
      const qs = new URLSearchParams();
      if (query) qs.set('q', query);
      if (filtroEstado) qs.set('estado', filtroEstado);
      qs.set('page', String(p));
      qs.set('limit', String(pageSize));

      const res = await fetch(`/api/admin/devoluciones?${qs.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg = payload?.error || `HTTP ${res.status}`;
        setError(msg);
        addToast({ message: `Error cargando devoluciones: ${msg}`, type: 'error' });
        setDevoluciones([]);
        return;
      }

      const payload = await res.json();
      const data = payload.data || [];
      const count = payload.count ?? data.length;

      setDevoluciones(data);
      setTotalCount(count);
      setHasMore(p * pageSize < count);
      setPage(p);
      addToast({ message: `Cargadas ${data.length} devoluciones (total ${count})`, type: 'info', duration: 1500 });
    } catch (e: any) {
      console.error('Error fetching devoluciones:', e);
      setError(e?.message || String(e));
    } finally {
      setCargando(false);
      setLoadingMore(false);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: string, observaciones?: string) => {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      addToast({ message: 'Supabase no configurado', type: 'error' });
      return;
    }

    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const updateData: any = { estado: nuevoEstado };
    if (observaciones) updateData.observaciones_admin = observaciones;

    const { error } = await supabase
      .from('devoluciones')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      setDevoluciones((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, estado: nuevoEstado, observaciones_admin: observaciones || d.observaciones_admin }
            : d
        )
      );
      addToast({ message: `Devolución actualizada a ${nuevoEstado}`, type: 'success' });
      fetchDevoluciones({ page });
    } else {
      addToast({ message: `Error: ${error.message}`, type: 'error' });
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Aprobada':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'Rechazada':
        return <XCircle className="text-red-600" size={20} />;
      case 'Completada':
        return <CheckCircle className="text-blue-600" size={20} />;
      default:
        return <Clock className="text-yellow-600" size={20} />;
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
      month: 'short',
      day: 'numeric'
    });
  };

  if (cargando) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando panel de devoluciones...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h1 style={{ fontWeight: 900, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RotateCcw size={32} /> Gestión de Devoluciones
        </h1>
        <button
          onClick={() => fetchDevoluciones({ page: 1 })}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
        >
          <RefreshCw size={16} /> Refrescar
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por cliente, producto o ID..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
        >
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobada">Aprobada</option>
          <option value="Rechazada">Rechazada</option>
          <option value="Completada">Completada</option>
        </select>
        <button
          onClick={() => { setQuery(''); setFiltroEstado(''); }}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
        >
          Limpiar
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'grid', gap: '20px' }}>
        {devoluciones.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
            <p style={{ color: '#6b7280' }}>No hay devoluciones para mostrar</p>
          </div>
        ) : (
          devoluciones.map((dev) => (
            <div
              key={dev.id}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
                display: 'grid',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>
                    DEVOLUCIÓN #{dev.id.slice(0, 8).toUpperCase()}
                  </span>
                  <h2 style={{ margin: '5px 0', fontSize: '18px', fontWeight: 900 }}>
                    {dev.producto?.nombre || 'Producto no disponible'}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Cantidad: {dev.cantidad} | Precio: ${dev.producto?.precio}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getEstadoIcon(dev.estado)}
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }} className={getEstadoColor(dev.estado)}>
                    {dev.estado}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Solicitado:</span>
                  <p style={{ fontWeight: 'bold' }}>{formatearFecha(dev.fecha_solicitud)}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Límite:</span>
                  <p style={{ fontWeight: 'bold' }}>{formatearFecha(dev.fecha_limite)}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Motivo:</span>
                  <p style={{ fontWeight: 'bold' }}>{dev.motivo || 'No especificado'}</p>
                </div>
              </div>

              {dev.observaciones_admin && (
                <div style={{ backgroundColor: '#eff6ff', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', color: '#1e40af' }}>
                  <strong>Observación:</strong> {dev.observaciones_admin}
                </div>
              )}

              {/* Acciones según estado */}
              {dev.estado === 'Pendiente' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => {
                      const obs = prompt('Observación (opcional):');
                      cambiarEstado(dev.id, 'Aprobada', obs || undefined);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#10b981',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      const obs = prompt('Motivo del rechazo (obligatorio):');
                      if (obs) cambiarEstado(dev.id, 'Rechazada', obs);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#ef4444',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              )}

              {dev.estado === 'Aprobada' && (
                <button
                  onClick={() => cambiarEstado(dev.id, 'Completada')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#3b82f6',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginTop: '12px'
                  }}
                >
                  Marcar como Completada
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loadingMore}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              opacity: loadingMore ? 0.5 : 1
            }}
          >
            {loadingMore ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
        Mostrando {devoluciones.length} de {totalCount} devoluciones
      </div>
    </div>
  );
}
