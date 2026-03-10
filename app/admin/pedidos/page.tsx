
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

  const formatFecha = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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

      <div className="grid gap-4">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-gray-50">
              <div className="flex items-start gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedIds.has(pedido.id)}
                  onChange={() => toggleSelect(pedido.id)}
                  className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    Pedido #{pedido.id.toString().slice(-5)}
                  </p>
                  <h2 className="font-black text-gray-900 text-base sm:text-lg truncate">
                    {pedido.cliente?.nombre || 'Cliente sin nombre'}
                  </h2>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 font-medium">
                    {pedido.direccion_entrega && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="flex-shrink-0 text-blue-500" />
                        <span className="truncate max-w-[160px] sm:max-w-xs">{pedido.direccion_entrega}</span>
                      </span>
                    )}
                    {pedido.cliente?.telefono && (
                      <span className="flex items-center gap-1">
                        <User size={11} className="flex-shrink-0 text-blue-500" />
                        {pedido.cliente.telefono}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-gray-400">
                      <Clock size={11} className="flex-shrink-0" />
                      {formatFecha(pedido.creado_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total + estado */}
              <div className="flex-shrink-0 text-right">
                <p className="font-black text-lg sm:text-xl text-gray-900">{Number(pedido.total || 0).toFixed(2)}€</p>
                <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  pedido.estado === 'Pendiente'
                    ? 'bg-amber-100 text-amber-700'
                    : pedido.estado === 'Enviado'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {pedido.estado}
                </span>
              </div>
            </div>

            {/* Artículos */}
            {pedido.articulos?.length > 0 && (
              <div className="px-4 sm:px-5 py-3 bg-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Artículos</p>
                <div className="space-y-1">
                  {pedido.articulos.map((art: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm text-gray-700">
                      <span className="truncate mr-4">{art.nombre} <strong>×{art.cantidad}</strong></span>
                      <span className="flex-shrink-0 font-bold">{(art.precio * art.cantidad).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-2 p-4 sm:p-5">
              <button
                onClick={() => cambiarEstado(pedido.id, 'Enviado')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-colors active:scale-95"
              >
                <Truck size={16} /> <span className="hidden xs:inline sm:inline">Enviado</span>
              </button>
              <button
                onClick={() => cambiarEstado(pedido.id, 'Entregado')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white font-black text-sm hover:bg-green-700 transition-colors active:scale-95"
              >
                <CheckCircle size={16} /> <span className="hidden xs:inline sm:inline">Entregado</span>
              </button>
              <button
                onClick={() => cambiarEstado(pedido.id, 'Pendiente')}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors active:scale-95"
                title="Marcar como Pendiente"
              >
                <Clock size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Anterior
        </button>
        <span className="text-sm font-bold text-gray-600">
          Página {page} / {Math.max(1, Math.ceil(totalCount / pageSize))}
        </span>
        <button
          onClick={() => { if (hasMore) setPage((p) => p + 1); }}
          disabled={!hasMore}
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
