'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import AgregarAlCarritoBtn from '@/components/AgregarAlCarritoBtn';
import SortDropdown from '@/components/SortDropdown';

// Base URL de Supabase para construcción de URLs completas
const SUPABASE_BASE_URL = 'https://vjkdxevzdtjsgabyxdgs.supabase.co/storage/v1/object/public';

// Función para construir URL completa de imagen
const buildImageUrl = (imagenUrl: string | null | undefined): string => {
  if (!imagenUrl) return '/globe.svg';
  
  // Si ya es una URL completa, devolverla tal cual
  if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
    return imagenUrl;
  }
  
  // Si es solo el nombre del archivo, construir la URL completa
  return `${SUPABASE_BASE_URL}/${imagenUrl}`;
};

export default function SearchProductos({ initialProducts = [], initialQuery = '', initialSort = 'newest' }: { initialProducts?: any[], initialQuery?: string, initialSort?: string }) {
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
  const [isReordering, setIsReordering] = useState(false);

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

  // Efecto para mostrar transición cuando se reordena
  useEffect(() => {
    setIsReordering(true);
    const timer = setTimeout(() => setIsReordering(false), 300);
    return () => clearTimeout(timer);
  }, [initialSort]);

  return (
    <section>
      {/* Buscador */}
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

      {/* Controles de Ordenación y Estado */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div aria-live="polite" className="text-sm">
          {loading && (<span className="text-gray-500">🔍 Buscando…</span>)}
          {!loading && results && results.length === 0 && (
            <span className="text-gray-500">No se han encontrado productos.</span>
          )}
          {!loading && results && results.length > 0 && (
            <span className="text-gray-600 font-medium">{results.length} producto{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        
        {/* Dropdown de Ordenación */}
        <div className="w-full sm:w-auto">
          <SortDropdown />
        </div>
      </div>

      {/* Grid de Productos con Transición */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${isReordering ? 'opacity-50' : 'opacity-100'}`}>
        {results && results.map((producto, index) => {
          const imageUrl = buildImageUrl(producto.imagen_url || producto.imagenUrl);
          
          return (
            <div key={producto.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 flex flex-col overflow-hidden h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Imagen del producto - Fase 4 Design */}
              <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={imageUrl}
                  alt={producto.nombre || 'Producto'}
                  width={500}
                  height={500}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  priority={index < 3}
                  loading={index < 3 ? undefined : "lazy"}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={false}
                />
                
                {/* Badge dinámico - Fase 4: Azul semi-transparente con bordes redondeados */}
                {((producto.familias && producto.familias.nombre) || producto.categoria) && (
                  <div className="absolute left-3 top-3 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg border border-blue-400/40 flex items-center gap-1.5">
                    <span>🏷️</span>
                    {producto.familias?.nombre || producto.categoria}
                  </div>
                )}
              </div>

              {/* Contenido - Fase 4 Design */}
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{producto.nombre}</h2>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{producto.descripcion || 'Sin descripción disponible'}</p>
                
                <div className="mt-auto flex items-end justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase font-bold text-gray-400 tracking-tight mb-1">Precio</div>
                    {/* Fase 4: Precio en negrita y azul vibrante */}
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
          );
        })}
      </div>
    </section>
  );
}
