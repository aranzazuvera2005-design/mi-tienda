'use client';

import React, { useEffect, useState } from 'react';
import AgregarAlCarritoBtn from './AgregarAlCarritoBtn';
import { Search, X, ChevronDown } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function SearchProductos({ 
  initialProducts = [], 
  initialQuery = '',
  initialSort = 'newest',
  initialCategoria = null,
  categorias = []
}: { 
  initialProducts?: any[], 
  initialQuery?: string,
  initialSort?: string,
  initialCategoria?: string | null,
  categorias?: any[]
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initialQuery || '');
  const [results, setResults] = useState<any[] | null>(initialProducts || null);

  useEffect(() => {
    setResults(initialProducts);
  }, [initialProducts]);

  const updateSearchParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== initialQuery) {
        updateSearchParams({ q: q || null });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [q, initialQuery]);

  const clear = () => {
    setQ('');
    updateSearchParams({ q: null });
  };

  return (
    <section className="mb-12">
      {/* BUSCADOR Y FILTROS */}
      <div className="flex flex-col lg:flex-row gap-4 mb-12">
        <div className="flex-1 flex items-center overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <Search size={20} className="ml-4 text-slate-400" />
          <input
            aria-label="Buscar productos"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, descripción..."
            className="flex-1 p-4 outline-none text-slate-600 placeholder:text-slate-400 bg-transparent"
          />
          {q && (
            <button type="button" onClick={clear} className="px-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={initialCategoria || ''}
              onChange={(e) => updateSearchParams({ categoria: e.target.value || null })}
              className="appearance-none bg-white border border-slate-100 shadow-sm rounded-full px-6 py-3 pr-12 text-slate-600 font-medium cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={initialSort}
              onChange={(e) => updateSearchParams({ sort: e.target.value })}
              className="appearance-none bg-white border border-slate-100 shadow-sm rounded-full px-6 py-3 pr-12 text-slate-600 font-medium cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="newest">Más nuevos</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="name_asc">Nombre: A-Z</option>
              <option value="name_desc">Nombre: Z-A</option>
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* GRID DE PRODUCTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {results && results.map((producto) => (
          <div 
            key={producto.id} 
            className="bg-white rounded-[2.5rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-none hover:-translate-y-2 transition-all duration-300 flex flex-col group"
          >
            <div className="relative w-full h-64 overflow-hidden bg-slate-50 rounded-[1.5rem] mb-5">
              <img
                src={producto.imagen_url || producto.imagenUrl || '/globe.svg'}
                alt={producto.nombre || 'Producto'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/globe.svg';
                }}
              />
              {(producto.familias?.nombre || producto.categoria) && (
                <span className="absolute left-4 top-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full font-bold shadow-sm">
                  {producto.familias?.nombre || producto.categoria}
                </span>
              )}
            </div>

            <div className="px-2 flex flex-col flex-1">
              <h2 className="text-xl font-extrabold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{producto.nombre}</h2>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed">{producto.descripcion || 'Sin descripción disponible'}</p>
              
              <div className="mt-auto flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Precio</span>
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {Number(producto.precio || 0).toFixed(2)}€
                  </span>
                </div>
                <div className="flex-1">
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
