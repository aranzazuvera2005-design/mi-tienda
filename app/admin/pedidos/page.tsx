
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useRef } from 'react';
import { CheckCircle, Clock, Truck, User, MapPin, Package, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { useToast } from '@/context/ToastContext'

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Create Supabase client lazily inside effects/functions to avoid runtime errors during build
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

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
    let supabase: any = null;
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
    let supabase: any = null;
    // carga inicial
    fetchTodosLosPedidos({ page: 1 });

    // Suscripción en tiempo real para INSERT/UPDATE/DELETE (protegida con try/catch)
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON) {
        throw new Error('Supabase no configurado; realtime deshabilitado');
      }
      supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);

      if (typeof supabase.channel !== 'function') {
        throw new Error('Realtime no disponible en la versión actual del cliente Supabase');
      }

      const channel = supabase
        .channel('public:pedidos')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload: any) => {
          // refrescar la página actual para incluir cambios coherentemente
          fetchTodosLosPedidos({ page });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, (payload: any) => {
          fetchTodosLosPedidos({ page });
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pedidos' }, (payload: any) => {
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
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      addToast({ message: 'Supabase no configurado. Acción no disponible.', type: 'error' });
      return;
    }
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
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
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      addToast({ message: 'Supabase no configurado. Acción no disponible.', type: 'error' });
      return;
    }
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
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
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm mb-2 transition-colors">
            <ArrowLeft size={16} /> Volver al Panel
          </Link>
          <h1 className="font-black text-2xl md:text-3xl text-gray-900">Gestión de Pedidos</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchTodosLosPedidos({ page: 1 })} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium">
            <RefreshCw size={16} /> Refrescar
          </button>
        </div>
      </div>

      {/* Buscador, filtros y controles */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por pedido, producto o usuario..." className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            <input value={fromDate} onChange={(e) => setFromDate(e.target.value)} type="date" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <input value={toDate} onChange={(e) => setToDate(e.target.value)} type="date" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <button onClick={() => { setQuery(''); setFromDate(''); setToDate(''); }} className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-sm">Limpiar</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-sm text-gray-700">
            <span className="font-bold">{pedidos.length}</span> en esta página <span className="text-gray-400 mx-2">|</span> Total: <span className="font-bold">{totalCount}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={selectAllVisible} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-xs font-medium">Seleccionar visibles</button>
            <button onClick={clearSelection} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors cursor-pointer text-xs font-medium">Limpiar selección</button>
            <button onClick={bulkMarkAsSent} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-green-50 hover:bg-green-100 text-green-700 transition-colors cursor-pointer text-xs font-medium">Marcar seleccionados Enviado</button>
          </div>
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
                   {pedido.cliente?.nombre || 'Cliente sin nombre'}
                </h2>
                <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#4b5563' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14}/> {pedido.direccion_entrega}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><User size={14}/> {pedido.cliente?.telefono}</span>
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
