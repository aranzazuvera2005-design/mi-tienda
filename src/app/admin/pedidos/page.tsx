
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useRef } from 'react';
import { CheckCircle, Clock, Truck, User, MapPin, Package, RefreshCw } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { addToast } = useToast();

  // paginación server-side
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // filtros / búsqueda
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // paginación y selección
  const [pageSize] = useState(10);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const channelRef = useRef<any>(null);
  const searchTimer = useRef<any>(null);

  // debounce búsqueda y filtros
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchTodosLosPedidos({ page: 1 });
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, fromDate, toDate]);

  // cuando cambia la página (paginar) -> recargar esa página
  useEffect(() => {
    fetchTodosLosPedidos({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // carga inicial
    fetchTodosLosPedidos({ page: 1 });

    // Suscripción en tiempo real para INSERT/UPDATE/DELETE (protegida con try/catch)
    try {
      if (typeof supabase.channel !== 'function') {
        throw new Error('Realtime no disponible en la versión actual del cliente Supabase');
      }

      const channel = supabase
        .channel('public:pedidos')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
          // refrescar la página actual para incluir cambios coherentemente
          fetchTodosLosPedidos({ page });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, (payload) => {
          fetchTodosLosPedidos({ page });
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pedidos' }, (payload) => {
          fetchTodosLosPedidos({ page });
        })
        .subscribe();

      channelRef.current = channel;
    } catch (e: any) {
      console.error('Error iniciando suscripción realtime:', e);
      setError(e?.message || 'Error al iniciar suscripción realtime');
    }

    return () => {
      // Cleanup subscription (intentar varios métodos para compatibilidad)
      try {
        if (channelRef.current) {
          // si tiene unsubscribe
          if (typeof channelRef.current.unsubscribe === 'function') {
            channelRef.current.unsubscribe();
          }
          // si supabase ofrece removeChannel
          if (typeof supabase.removeChannel === 'function') {
            supabase.removeChannel(channelRef.current);
          }
        }
      } catch (e) {
        console.warn('Error limpiando canal realtime:', e);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTodosLosPedidos = async (params?: { page?: number }) => {
    const p = params?.page ?? page;
    setError(null);
    if (p === 1) setCargando(true);
    else setLoadingMore(true);

    try {
      const qs = new URLSearchParams();
      if (query) qs.set('q', query);
      if (fromDate) qs.set('from', fromDate);
      if (toDate) qs.set('to', toDate);
      qs.set('page', String(p));
      qs.set('limit', String(pageSize));

      const res = await fetch(`/api/admin/pedidos?${qs.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg = payload?.error || `HTTP ${res.status}`;
        setError(msg);
        addToast({ message: `Error cargando pedidos: ${msg}`, type: 'error' });
        setPedidos([]);
        return;
      }

      const payload = await res.json();
      const data = payload.data || [];
      const count = payload.count ?? data.length;

      setPedidos(data);
      setTotalCount(count);

      // manejar hasMore
      setHasMore(p * pageSize < count);
      setPage(p);
      addToast({ message: `Cargados ${data.length} pedidos (total ${count})`, type: 'info', duration: 1500 });
    } catch (e: any) {
      console.error('Error fetching admin pedidos (API):', e);
      setError(e?.message || String(e));
    } finally {
      setCargando(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setPage((p) => p + 1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(pedidos.map((p) => p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkMarkAsSent = async () => {
    if (selectedIds.size === 0) {
      addToast({ message: 'No hay pedidos seleccionados', type: 'info' });
      return;
    }
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('pedidos').update({ estado: 'Enviado' }).in('id', ids);
    if (error) {
      addToast({ message: 'Error al actualizar pedidos: ' + error.message, type: 'error' });
      return;
    }
    setPedidos((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, estado: 'Enviado' } : p)));
    clearSelection();
    addToast({ message: 'Pedidos marcados como Enviado', type: 'success' });

    // refrescar la página para garantizar coherencia
    fetchTodosLosPedidos({ page });
  };

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (!error) {
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p)));
      addToast({ message: `Pedido ${id} actualizado a ${nuevoEstado}`, type: 'success' });
    } else {
      addToast({ message: `Error actualizando pedido ${id}: ${error.message}`, type: 'error' });
    }

    // refrescar la página para consistencia
    fetchTodosLosPedidos({ page });
  };

  if (cargando) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando panel de control...</div>;

  // En esta versión usamos búsqueda server-side; `pedidos` ya viene filtrado y paginado desde la API.

  return (
    <div style={{ padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h1 style={{ fontWeight: 900, fontSize: '28px' }}>Gestión de Pedidos</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchTodosLosPedidos} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>
            <RefreshCw size={16} /> Refrescar
          </button>
        </div>
      </div>

      {/* Buscador, filtros y controles */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por pedido, producto o usuario..." style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
          <input value={fromDate} onChange={(e) => setFromDate(e.target.value)} type="date" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
          <input value={toDate} onChange={(e) => setToDate(e.target.value)} type="date" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
          <button onClick={() => { setQuery(''); setFromDate(''); setToDate(''); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>Limpiar</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', fontSize: '14px', color: '#374151' }}>
            <div><strong>{pedidos.length}</strong> en esta página</div>
            <div className="text-sm" style={{ color: '#6b7280' }}>Total: {totalCount}</div>
          </div>

          <button onClick={selectAllVisible} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>Seleccionar visibles</button>
          <button onClick={clearSelection} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff7ed', cursor: 'pointer' }}>Limpiar selección</button>
          <button onClick={bulkMarkAsSent} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#dcfce7', cursor: 'pointer' }}>Marcar seleccionados Enviado</button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'grid', gap: '20px' }}>
        {pedidos.map((pedido) => (
          <div key={pedido.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>PEDIDO #{pedido.id.toString().slice(-5)}</span>
                <h2 style={{ margin: '5px 0', fontSize: '18px', fontWeight: 900 }}>
                   {pedido.perfiles?.nombre || 'Cliente sin nombre'}
                </h2>
                <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#4b5563' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14}/> {pedido.direccion_entrega}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><User size={14}/> {pedido.perfiles?.telefono}</span>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: '20px', color: '#111827' }}>{Number(pedido.total || 0).toFixed(2)}€</div>
                <span style={{ 
                  fontSize: '11px', 
                  padding: '4px 10px', 
                  borderRadius: '10px', 
                  backgroundColor: pedido.estado === 'Pendiente' ? '#fef3c7' : '#dcfce7',
                  color: pedido.estado === 'Pendiente' ? '#92400e' : '#166534',
                  fontWeight: 'bold'
                }}>
                  {pedido.estado?.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' }}>ARTÍCULOS</p>
              {pedido.articulos?.map((art: any, index: number) => (
                <div key={index} style={{ fontSize: '14px', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{art.nombre} <strong>x{art.cantidad}</strong></span>
                  <span>{(art.precio * art.cantidad).toFixed(2)}€</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => cambiarEstado(pedido.id, 'Enviado')}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Truck size={18} /> Marcar como Enviado
              </button>
              <button 
                onClick={() => cambiarEstado(pedido.id, 'Pendiente')}
                style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#4b5563', cursor: 'pointer' }}
              >
                <Clock size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '18px', gap: '12px', alignItems: 'center' }}>
        <button onClick={() => { setPage((p) => Math.max(1, p - 1)); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: page <= 1 ? '#f3f4f6' : 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer' }} disabled={page <= 1}>Anterior</button>
        <div style={{ alignSelf: 'center' }}>Página {page} / {Math.max(1, Math.ceil(totalCount / pageSize))}</div>
        <button onClick={() => { if (hasMore) setPage((p) => p + 1); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: hasMore ? 'white' : '#f3f4f6', cursor: hasMore ? 'pointer' : 'not-allowed' }} disabled={!hasMore}>Siguiente</button>
      </div>
    </div>
  );
}