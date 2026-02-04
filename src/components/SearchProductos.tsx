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
      <form onSubmit={(e) => { e.preventDefault(); fetchResults(q, 1); }} className="mb-6 flex gap-2 items-center">
        <input
          aria-label="Buscar productos"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, descripción, familia o categoría..."
          className="flex-1 p-3 rounded-md border border-gray-200"
        />
        <button type="submit" className="px-4 py-3 rounded-md bg-indigo-600 text-white font-semibold">Buscar</button>
        {q && (
          <button type="button" onClick={clear} className="ml-2 px-3 py-2 rounded-md border border-gray-200 bg-white">Limpiar</button>
        )}
      </form>

      <div aria-live="polite">
        {loading && (<div className="text-gray-500">Buscando…</div>)}
        {!loading && results && results.length === 0 && (
          <div className="text-gray-500">No se han encontrado productos.</div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results && results.map((producto) => (
          <div key={producto.id} className="bg-white p-4 rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
            <div className="relative w-full h-48 rounded-md overflow-hidden mb-4">
              <img
                src={producto.imagen_url || producto.imagenUrl || '/globe.svg'}
                alt={producto.nombre || 'Producto'}
                className="w-full h-full object-cover"
              />
              {((producto.familias && producto.familias.nombre) || producto.categoria) && (
                <span className="absolute left-3 top-3 bg-white/80 text-xs px-2 py-1 rounded-md font-semibold">{producto.familias?.nombre || producto.categoria}</span>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold mb-1">{producto.nombre}</h2>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{producto.descripcion}</p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Precio</div>
                <div className="text-2xl font-extrabold text-indigo-600">{Number(producto.precio || 0).toFixed(2)}€</div>
              </div>
              <div className="w-36">
                <AgregarAlCarritoBtn producto={producto} />
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}