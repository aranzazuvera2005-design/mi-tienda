'use client';

import { useEffect, useState, useRef } from 'react';
import { Star, Trash2, ArrowLeft, RefreshCw, Filter } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

interface Resena {
  id: string;
  valoracion: number;
  comentario: string | null;
  foto_url: string | null;
  creado_at: string;
  producto: { id: string; nombre: string } | null;
  perfil: { nombre: string | null; email: string | null } | null;
}

interface Stats {
  totalResenas: number;
  promedioGlobal: string;
  distribucion: Record<number, number>;
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={14}
          className={n <= valor ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
        />
      ))}
    </span>
  );
}

export default function AdminResenas() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filtroValoracion, setFiltroValoracion] = useState('');
  const [expandedFoto, setExpandedFoto] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const { addToast } = useToast();
  const PAGE_SIZE = 20;

  const fetchResenas = async (p = page, valoracion = filtroValoracion) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (valoracion) params.set('valoracion', valoracion);

      const res = await fetch(`/api/admin/resenas?${params}`);
      if (!res.ok) throw new Error('Error cargando reseñas');
      const json = await res.json();
      setResenas(json.data || []);
      setTotalCount(json.count || 0);
      setStats(json.stats || null);
    } catch (e: any) {
      addToast({ message: e.message || 'Error inesperado', type: 'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchResenas(1, filtroValoracion);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroValoracion]);

  useEffect(() => {
    fetchResenas(page, filtroValoracion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const eliminarResena = async (id: string) => {
    if (!confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return;
    setEliminando(id);
    try {
      const res = await fetch(`/api/admin/resenas?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al eliminar');
      }
      addToast({ message: 'Reseña eliminada', type: 'success' });
      fetchResenas(page, filtroValoracion);
    } catch (e: any) {
      addToast({ message: e.message, type: 'error' });
    } finally {
      setEliminando(null);
    }
  };

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        <header className="mb-8">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 mb-4 transition-colors">
            <ArrowLeft size={16} /> Volver al Panel
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-1">Reseñas de Productos</h1>
          <p className="text-gray-600">Analiza y modera las opiniones de tus clientes</p>
        </header>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5 col-span-2 md:col-span-1">
              <div className="text-4xl font-black text-gray-900">{stats.promedioGlobal}</div>
              <div className="flex gap-0.5 mt-1">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={16} className={n <= Math.round(Number(stats.promedioGlobal)) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
                ))}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stats.totalResenas} reseñas en total</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 col-span-2 md:col-span-3">
              <div className="text-sm font-semibold text-gray-700 mb-3">Distribución de valoraciones</div>
              <div className="flex flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map(n => {
                  const count = stats.distribucion[n] || 0;
                  const pct = stats.totalResenas > 0 ? Math.round((count / stats.totalResenas) * 100) : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-3 text-right font-semibold">{n}</span>
                      <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Filter size={15} className="text-gray-400" />
            <select
              value={filtroValoracion}
              onChange={e => setFiltroValoracion(e.target.value)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none"
            >
              <option value="">Todas las valoraciones</option>
              {[5, 4, 3, 2, 1].map(n => (
                <option key={n} value={String(n)}>{n} estrella{n !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => fetchResenas(page, filtroValoracion)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
          <span className="text-sm text-gray-500 ml-auto">{totalCount} reseña{totalCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Tabla / lista de reseñas */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando reseñas…</div>
        ) : resenas.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200">
            No hay reseñas {filtroValoracion ? `con ${filtroValoracion} estrella${filtroValoracion !== '1' ? 's' : ''}` : 'todavía'}.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {resenas.map(r => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4">
                {/* Info reseña */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{r.perfil?.nombre || 'Cliente'}</div>
                      <div className="text-xs text-gray-400">{r.perfil?.email || '—'}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Estrellas valor={r.valoracion} />
                      <span className="text-xs text-gray-400">{formatFecha(r.creado_at)}</span>
                    </div>
                  </div>

                  {r.producto && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
                      Producto: <span className="font-semibold text-gray-700">{r.producto.nombre}</span>
                    </div>
                  )}

                  {r.comentario && (
                    <p className="text-sm text-gray-600 leading-relaxed">{r.comentario}</p>
                  )}
                </div>

                {/* Foto + acciones */}
                <div className="flex md:flex-col items-start md:items-end gap-3 shrink-0">
                  {r.foto_url && (
                    <button onClick={() => setExpandedFoto(r.foto_url)} className="shrink-0">
                      <img
                        src={r.foto_url}
                        alt="Foto reseña"
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition-opacity cursor-zoom-in"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </button>
                  )}
                  <button
                    onClick={() => eliminarResena(r.id)}
                    disabled={eliminando === r.id}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    {eliminando === r.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || cargando}
              className="px-4 py-2 text-sm font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || cargando}
              className="px-4 py-2 text-sm font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Lightbox foto */}
      {expandedFoto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedFoto(null)}
        >
          <img
            src={expandedFoto}
            alt="Foto reseña ampliada"
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
