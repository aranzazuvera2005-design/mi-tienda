'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, ImageIcon } from 'lucide-react';
import ResenaForm from './ResenaForm';

interface Resena {
  id: string;
  valoracion: number;
  comentario: string | null;
  foto_url: string | null;
  creado_at: string;
  perfil: { nombre: string | null } | null;
}

interface ListaResenasProps {
  productoId: string;
  clienteId?: string | null;
}

function Estrellas({ valor, size = 14 }: { valor: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          className={n <= valor ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
        />
      ))}
    </span>
  );
}

function PromedioEstrellas({ resenas }: { resenas: Resena[] }) {
  if (resenas.length === 0) return null;
  const avg = resenas.reduce((s, r) => s + r.valoracion, 0) / resenas.length;
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  resenas.forEach(r => { dist[r.valoracion]++; });

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-amber-50 rounded-2xl p-4 mb-4">
      <div className="text-center">
        <div className="text-4xl font-black text-slate-900">{avg.toFixed(1)}</div>
        <Estrellas valor={Math.round(avg)} size={16} />
        <div className="text-xs text-slate-500 mt-1">{resenas.length} reseña{resenas.length !== 1 ? 's' : ''}</div>
      </div>
      <div className="flex-1 flex flex-col gap-1 w-full">
        {[5, 4, 3, 2, 1].map(n => {
          const pct = resenas.length > 0 ? Math.round((dist[n] / resenas.length) * 100) : 0;
          return (
            <div key={n} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-3 text-right">{n}</span>
              <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-amber-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right">{dist[n]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ListaResenas({ productoId, clienteId }: ListaResenasProps) {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);
  const [yaReseno, setYaReseno] = useState(false);
  const [haPurchased, setHaPurchased] = useState<boolean | null>(null);
  const [expandedFoto, setExpandedFoto] = useState<string | null>(null);

  const fetchResenas = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/resenas?productoId=${productoId}`);
      const json = await res.json();
      const data: Resena[] = json.data || [];
      setResenas(data);

      if (clienteId) {
        setYaReseno(data.some(r => {
          // La API no devuelve cliente_id por privacidad, así que usamos el endpoint de verificación
          return false; // se comprueba abajo
        }));
      }
    } finally {
      setCargando(false);
    }
  }, [productoId, clienteId]);

  // Verificar si el usuario ya reseñó y si ha comprado
  useEffect(() => {
    if (!clienteId) return;

    const check = async () => {
      const res = await fetch(`/api/resenas/puede-resenar?productoId=${productoId}&clienteId=${clienteId}`);
      if (res.ok) {
        const json = await res.json();
        setHaPurchased(json.haPurchased);
        setYaReseno(json.yaReseno);
      }
    };
    check();
  }, [productoId, clienteId]);

  useEffect(() => {
    fetchResenas();
  }, [fetchResenas]);

  const formatFecha = (iso: string) => {
    return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-black text-slate-900 text-lg">Reseñas del producto</h3>

      {cargando ? (
        <div className="text-sm text-slate-400 py-4 text-center">Cargando reseñas…</div>
      ) : (
        <>
          <PromedioEstrellas resenas={resenas} />

          {/* Formulario solo si ha comprado y no ha reseñado */}
          {clienteId && haPurchased && !yaReseno && (
            <ResenaForm
              productoId={productoId}
              clienteId={clienteId}
              onResenaCreada={() => {
                fetchResenas();
                setYaReseno(true);
              }}
            />
          )}

          {clienteId && haPurchased && yaReseno && (
            <div className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
              Ya has reseñado este producto. ¡Gracias por tu opinión!
            </div>
          )}

          {clienteId && haPurchased === false && (
            <div className="text-sm text-slate-400 bg-slate-50 rounded-xl px-4 py-3">
              Solo puedes reseñar productos que hayas comprado.
            </div>
          )}

          {!clienteId && (
            <div className="text-sm text-slate-400 bg-slate-50 rounded-xl px-4 py-3">
              Inicia sesión y compra el producto para poder reseñarlo.
            </div>
          )}

          {/* Lista de reseñas */}
          {resenas.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sé el primero en reseñar este producto.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {resenas.map(r => (
                <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                        {r.perfil?.nombre?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{r.perfil?.nombre || 'Cliente'}</div>
                        <div className="text-xs text-slate-400">{formatFecha(r.creado_at)}</div>
                      </div>
                    </div>
                    <Estrellas valor={r.valoracion} />
                  </div>
                  {r.comentario && (
                    <p className="text-sm text-slate-600 leading-relaxed">{r.comentario}</p>
                  )}
                  {r.foto_url && (
                    <button
                      onClick={() => setExpandedFoto(r.foto_url)}
                      className="self-start"
                    >
                      <img
                        src={r.foto_url}
                        alt="Foto de reseña"
                        className="w-24 h-24 object-cover rounded-xl border border-slate-200 hover:opacity-80 transition-opacity cursor-zoom-in"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lightbox foto */}
      {expandedFoto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedFoto(null)}
        >
          <img
            src={expandedFoto}
            alt="Foto reseña"
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
