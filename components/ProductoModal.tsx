'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Tag, Percent } from 'lucide-react';
import AgregarAlCarritoBtn from './AgregarAlCarritoBtn';

export default function ProductoModal({ producto, onClose }: { producto: any; onClose: () => void }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const imgs: string[] = Array.isArray(producto.imagenes) && producto.imagenes.length > 0
    ? producto.imagenes
    : producto.imagen_url ? [producto.imagen_url] : [];

  const pvp       = Number(producto.precio || 0);
  const tachado   = Number(producto.precio_tachado || 0);
  const descuento = Number(producto.descuento_pct || 0);

  // Calcular descuento si hay precio tachado pero no pct
  const pctMostrar = descuento > 0
    ? descuento
    : (tachado > pvp ? Math.round((1 - pvp / tachado) * 100) : 0);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
        >
          <X size={20} className="text-slate-600" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* ─── Columna izquierda: carrusel ─── */}
          <div className="relative bg-slate-50 rounded-[2rem] overflow-hidden min-h-[320px] md:min-h-[500px]">
            {imgs.length > 0 ? (
              <>
                <img
                  src={imgs[idx]}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                  style={{ minHeight: 320 }}
                  onError={e => { (e.target as HTMLImageElement).src = '/globe.svg'; }}
                />
                {imgs.length > 1 && (
                  <>
                    <button onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-lg">
                      <ChevronLeft size={18} className="text-slate-700" />
                    </button>
                    <button onClick={() => setIdx(i => (i + 1) % imgs.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-lg">
                      <ChevronRight size={18} className="text-slate-700" />
                    </button>
                    {/* Miniaturas */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {imgs.map((url, i) => (
                        <button key={i} onClick={() => setIdx(i)}
                          className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === idx ? 'border-slate-900 scale-110' : 'border-white/60 opacity-70'}`}>
                          <img src={url} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {/* Badge categoría */}
                {(producto.familias?.nombre || producto.categoria) && (
                  <span className="absolute left-4 top-4 bg-slate-900/80 backdrop-blur-md text-white text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-full font-black shadow-xl flex items-center gap-1.5">
                    <Tag size={9} className="text-blue-400" />
                    {producto.familias?.nombre || producto.categoria}
                  </span>
                )}
                {/* Badge descuento */}
                {pctMostrar > 0 && (
                  <span className="absolute right-4 top-4 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <Percent size={11} />-{pctMostrar}%
                  </span>
                )}
              </>
            ) : (
              <div className="w-full h-full min-h-[320px] flex items-center justify-center text-slate-300 text-sm">Sin imagen</div>
            )}
          </div>

          {/* ─── Columna derecha: info + variantes ─── */}
          <div className="p-6 md:p-8 flex flex-col gap-4">
            <h2 className="text-2xl font-black text-slate-900 leading-tight">{producto.nombre}</h2>

            {/* Precios */}
            <div className="flex items-end gap-3">
              <span className="text-3xl font-black text-slate-900">{pvp.toFixed(2)}<span className="text-lg ml-0.5">€</span></span>
              {tachado > pvp && (
                <span className="text-lg text-slate-400 line-through font-bold">{tachado.toFixed(2)}€</span>
              )}
              {pctMostrar > 0 && (
                <span className="text-sm font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg">-{pctMostrar}%</span>
              )}
            </div>

            {/* Descripción larga */}
            {(producto.descripcion_larga || producto.descripcion) && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {producto.descripcion_larga || producto.descripcion}
              </p>
            )}

            {/* Variantes + botón carrito */}
            <div className="mt-auto">
              <AgregarAlCarritoBtn producto={producto} onClose={onClose} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
