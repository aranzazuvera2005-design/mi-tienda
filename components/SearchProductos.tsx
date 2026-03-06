'use client';

import React, { useEffect, useState } from 'react';
import AgregarAlCarritoBtn from './AgregarAlCarritoBtn';
import { Search, X, ChevronDown, Tag } from 'lucide-react';
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
        <div className="flex-1 flex items-center overflow-hidden rounded-full bg-white shadow-lg shadow-slate-200/50 border border-slate-100 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all px-2">
          <Search size={20} className="ml-4 text-slate-400" />
          <input
            aria-label="Buscar productos"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, descripción..."
            className="flex-1 p-4 outline-none text-slate-600 placeholder:text-slate-400 bg-transparent font-medium"
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
              className="appearance-none bg-white border border-slate-100 shadow-lg shadow-slate-200/50 rounded-full px-6 py-4 pr-12 text-slate-600 font-bold cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all"
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
              className="appearance-none bg-white border border-slate-100 shadow-lg shadow-slate-200/50 rounded-full px-6 py-4 pr-12 text-slate-600 font-bold cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all"
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

      {/* GRID DE PRODUCTOS BOUTIQUE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {results && results.map((producto) => (
          <div 
            key={producto.id} 
            className="bg-white rounded-[2.5rem] p-5 shadow-2xl shadow-slate-200/30 border border-slate-50 hover:shadow-blue-200/40 hover:-translate-y-3 transition-all duration-700 flex flex-col group"
          >
            {/* Imagen del producto con efecto premium */}
            <div className="relative w-full h-80 overflow-hidden bg-slate-50 rounded-[2rem] mb-8 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
              <img
                src={producto.imagen_url || producto.imagenUrl || '/globe.svg'}
                alt={producto.nombre || 'Producto'}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/globe.svg';
                }}
              />
              {/* Etiqueta de categoría flotante */}
              {(producto.familias?.nombre || producto.categoria) && (
                <span className="absolute left-5 top-5 bg-slate-900/80 backdrop-blur-md text-white text-[9px] uppercase tracking-[0.2em] px-5 py-2.5 rounded-full font-black shadow-2xl z-20 border border-white/10 flex items-center gap-2">
                  <Tag size={10} className="text-blue-400" />
                  {producto.familias?.nombre || producto.categoria}
                </span>
              )}
            </div>

            {/* Contenido Elegante */}
            <div className="flex flex-col flex-1 px-2">
              <div className="mb-4">
                <h2 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 tracking-tight">
                  {producto.nombre}
                </h2>
                <div className="h-1 w-12 bg-blue-600/20 rounded-full mt-2 group-hover:w-24 transition-all duration-500"></div>
              </div>
              
              <p className="text-sm text-slate-400 line-clamp-2 mb-10 leading-relaxed font-bold uppercase tracking-wider">
                {producto.descripcion || 'Exclusividad en cada detalle'}
              </p>
              
              <div className="mt-auto flex items-center justify-between gap-6 pt-6 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-slate-300 tracking-[0.2em] mb-1">Inversión</span>
                  <span className="text-3xl font-black text-slate-900 leading-none group-hover:text-blue-600 transition-colors">
                    {Number(producto.precio || 0).toFixed(2)}<span className="text-lg ml-0.5">€</span>
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
