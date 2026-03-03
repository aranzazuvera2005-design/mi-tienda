'use client';

import React, { useEffect, useState } from 'react';
import AgregarAlCarritoBtn from './AgregarAlCarritoBtn';

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
        // si la API devolvió un warning en JSON, trátalo como degradado: mantenemos resultados actuales
        if (json?.warning) {
          console.warn('Search API warning:', json.warning);
          setPage(pageNum);
          return;
        }
        console.error('Error detallado del servidor:', JSON.stringify(json, null, 2));
        throw new Error(json.error || `Error ${r.status}: ${r.statusText}`);
      }

      // Si la respuesta incluye warning, mantenemos los resultados actuales
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
        <button type="submit" className="px-8 py-4 bg-[#4f46e5] text-white font-bold hover:bg-blue-700 transition-colors">
          Buscar
        </button>
      </form>

      <div aria-live="polite">
        {loading && (<div className="text-gray-500">Buscando…</div>)}
        {!loading && results && results.length === 0 && (
          <div className="text-gray-500">No se han encontrado productos.</div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results && results.map((producto) => (
          <div key={producto.id} className="bg-white p-0 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col overflow-hidden">
            {/* Imagen del producto */}
            <div className="relative w-full h-48 overflow-hidden bg-gray-100">
              <img
                src={producto.imagen_url || producto.imagenUrl || '/globe.svg'}
                alt={producto.nombre || 'Producto'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/globe.svg';
                }}
              />
              {/* Etiqueta de categoría/familia */}
              {((producto.familias && producto.familias.nombre) || producto.categoria) && (
                <span className="absolute left-3 top-3 bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold">
                  {producto.familias?.nombre || producto.categoria}
                </span>
              )}
            </div>

            {/* Contenido */}
            <div className="p-5 flex flex-col flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-1">{producto.nombre}</h2>
              <p className="text-sm text-gray-500 line-clamp-1 mb-4">{producto.descripcion || 'Sin descripción disponible'}</p>
              
              <div className="mt-auto flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Precio</div>
                  <div className="text-xl font-black text-blue-600 leading-none">
                    {Number(producto.precio || 0).toFixed(2)}€
                  </div>
                </div>
                <div className="w-32">
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