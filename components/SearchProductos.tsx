'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import AgregarAlCarritoBtn from '@/components/AgregarAlCarritoBtn';

export default function SearchProductos({ initialProducts = [], initialQuery = '' }: { initialProducts?: any[], initialQuery?: string }) {
  // debug: log initial products length
  useEffect(() => {
    try {
      console.debug('SearchProductos: initialProducts length =', Array.isArray(initialProducts) ? initialProducts.length : 'non-array');
    } catch (e) {
      // noop
    }
  }, [initialProducts]);

  const [q, setQ] = useState(initialQuery || '');
  const [results, setResults] = useState<any[] | null>(initialProducts || null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => {
      fetchResults(q, 1);
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function fetchResults(qStr: string, pageNum = 1) {
    setLoading(true);
    try {
      const url = qStr ? `/api/search?q=${encodeURIComponent(qStr)}&page=${pageNum}&limit=${limit}` : `/api/search?limit=${limit}`;
      const r = await fetch(url);
      let json: any = {};
      try {
        json = await r.json().catch(() => ({}));
      } catch (err) {
        // noop
      }

      if (!r.ok) {
        if (json?.warning) {
          console.warn('Search API warning:', json.warning);
          setPage(pageNum);
          return;
        }
        console.error('Error detallado del servidor:', JSON.stringify(json, null, 2));
        throw new Error(json.error || `Error ${r.status}: ${r.statusText}`);
      }

      if (json?.warning) {
        console.warn('Search API warning:', json.warning);
        setPage(pageNum);
        return;
      }

      setResults(json.items || []);
      setPage(pageNum);
    } catch (e) {
      console.error('Search failed', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const clear = () => {
    setQ('');
    fetchResults('', 1);
  };

  return (
    <section>
      <form onSubmit={(e) => { e.preventDefault(); fetchResults(q, 1); }} className="mb-8 flex gap-0 items-center overflow-hidden rounded-xl border border-gray-200 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
        <input
          aria-label="Buscar productos"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, descripción, familia o categoría..."
          className="flex-1 p-4 outline-none text-gray-600 placeholder:text-gray-400"
        />
        {q && (
          <button type="button" onClick={clear} className="px-4 text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        )}
        <button type="submit" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors active:scale-95">
          Buscar
        </button>
      </form>

      <div aria-live="polite">
        {loading && (<div className="text-gray-500 mb-4">🔍 Buscando…</div>)}
        {!loading && results && results.length === 0 && (
          <div className="text-gray-500 mb-4">No se han encontrado productos.</div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results && results.map((producto, index) => (
          <div key={producto.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 flex flex-col overflow-hidden h-full">
            {/* Imagen del producto optimizada con Next/Image - Dimensiones fijas para evitar CLS */}
            <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
              <Image
                src={producto.imagen_url || producto.imagenUrl || '/globe.svg'}
                alt={producto.nombre || 'Producto'}
                width={500}
                height={500}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                // Priority para la primera fila (primeros 3 productos)
                priority={index < 3}
                // Lazy loading para el resto
                loading={index < 3 ? undefined : "lazy"}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onError={(e) => {
                  // Fallback si la imagen no carga
                  const img = e.target as HTMLImageElement;
                  img.src = '/globe.svg';
                }}
              />
              
              {/* Badge dinámico con mejor contraste - Azul vibrante */}
              {((producto.familias && producto.familias.nombre) || producto.categoria) && (
                <div className="absolute left-3 top-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm border border-blue-400/40 flex items-center gap-1">
                  <span>🏷️</span>
                  {producto.familias?.nombre || producto.categoria}
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="p-5 flex flex-col flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{producto.nombre}</h2>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{producto.descripcion || 'Sin descripción disponible'}</p>
              
              <div className="mt-auto flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase font-bold text-gray-400 tracking-tight mb-1">Precio</div>
                  <div className="text-2xl font-black text-blue-600">
                    {Number(producto.precio || 0).toFixed(2)}€
                  </div>
                </div>
                <div className="flex-shrink-0 w-32">
                  <AgregarAlCarritoBtn producto={producto} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
