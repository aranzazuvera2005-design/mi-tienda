'use client';

import React, { useEffect, useState, useMemo } from 'react';
import AgregarAlCarritoBtn from './AgregarAlCarritoBtn';
import { Search, X, ChevronDown, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [sort, setSort] = useState(initialSort || 'newest');
  const [categoria, setCategoria] = useState(initialCategoria || '');
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({});

  // Sincronizar estados locales con las props iniciales (que vienen de la URL)
  useEffect(() => {
    setQ(initialQuery || '');
  }, [initialQuery]);

  useEffect(() => {
    setSort(initialSort || 'newest');
  }, [initialSort]);

  useEffect(() => {
    setCategoria(initialCategoria || '');
  }, [initialCategoria]);

  const updateSearchParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Debounce para la búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== (searchParams.get('q') || '')) {
        updateSearchParams({ q: q || null });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [q]);

  const clear = () => {
    setQ('');
    updateSearchParams({ q: null });
  };

  // Lógica de filtrado y ordenación en el cliente para respuesta inmediata
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...initialProducts];

    // 1. Filtrar por búsqueda (nombre o descripción)
    if (q.trim()) {
      const query = q.toLowerCase();
      result = result.filter(p => 
        p.nombre?.toLowerCase().includes(query) || 
        p.descripcion?.toLowerCase().includes(query)
      );
    }

    // 2. Filtrar por categoría
    if (categoria) {
      result = result.filter(p => 
        String(p.familia_id) === String(categoria) || 
        String(p.id_familia) === String(categoria) ||
        String(p.categoria_id) === String(categoria)
      );
    }

    // 3. Ordenar
    result.sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return Number(a.precio || 0) - Number(b.precio || 0);
        case 'price_desc':
          return Number(b.precio || 0) - Number(a.precio || 0);
        case 'name_asc':
          return (a.nombre || '').localeCompare(b.nombre || '');
        case 'name_desc':
          return (b.nombre || '').localeCompare(a.nombre || '');
        case 'newest':
        default:
          // Asumiendo que tienen un campo created_at o id incremental
          return (b.id || 0) - (a.id || 0);
      }
    });

    return result;
  }, [initialProducts, q, categoria, sort]);

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
              value={categoria}
              onChange={(e) => {
                const val = e.target.value;
                setCategoria(val);
                updateSearchParams({ categoria: val || null });
              }}
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
              value={sort}
              onChange={(e) => {
                const val = e.target.value;
                setSort(val);
                updateSearchParams({ sort: val });
              }}
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-10">
        {filteredAndSortedProducts.length > 0 ? (
          filteredAndSortedProducts.map((producto) => (
            <div 
              key={producto.id} 
              className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-3 sm:p-5 shadow-2xl shadow-slate-200/30 border border-slate-50 hover:shadow-blue-200/40 hover:-translate-y-3 transition-all duration-700 flex flex-col group"
            >
              {/* Carousel de imágenes */}
              <div className="relative w-full h-40 sm:h-80 overflow-hidden bg-slate-50 rounded-[1.2rem] sm:rounded-[2rem] mb-3 sm:mb-8 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                {(() => {
                  const imgs: string[] = Array.isArray(producto.imagenes) && producto.imagenes.length > 0
                    ? producto.imagenes
                    : producto.imagen_url ? [producto.imagen_url] : [];
                  const idx = carouselIdx[producto.id] || 0;
                  return (
                    <>
                      <img
                        src={imgs[idx] || '/globe.svg'}
                        alt={producto.nombre || 'Producto'}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/globe.svg'; }}
                      />
                      {imgs.length > 1 && (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); setCarouselIdx(c => ({...c, [producto.id]: (idx - 1 + imgs.length) % imgs.length})); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            <ChevronLeft size={16} className="text-slate-700" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setCarouselIdx(c => ({...c, [producto.id]: (idx + 1) % imgs.length})); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            <ChevronRight size={16} className="text-slate-700" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                            {imgs.map((_, i) => (
                              <button key={i} onClick={e => { e.stopPropagation(); setCarouselIdx(c => ({...c, [producto.id]: i})); }}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
                {/* Etiqueta de categoría flotante */}
                {(producto.familias?.nombre || producto.categoria) && (
                  <span className="absolute left-2 sm:left-5 top-2 sm:top-5 bg-slate-900/80 backdrop-blur-md text-white text-[7px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] px-2 sm:px-5 py-1 sm:py-2.5 rounded-full font-black shadow-2xl z-20 border border-white/10 flex items-center gap-1 sm:gap-2">
                    <Tag size={8} className="text-blue-400 hidden sm:block" />
                    {producto.familias?.nombre || producto.categoria}
                  </span>
                )}
              </div>

              {/* Contenido Elegante */}
              <div className="flex flex-col flex-1 px-1 sm:px-2">
                <div className="mb-2 sm:mb-4">
                  <h2 className="text-sm sm:text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 tracking-tight">
                    {producto.nombre}
                  </h2>
                  <div className="h-0.5 sm:h-1 w-8 sm:w-12 bg-blue-600/20 rounded-full mt-1 sm:mt-2 group-hover:w-16 sm:group-hover:w-24 transition-all duration-500"></div>
                </div>
                
                <p className="hidden sm:block text-sm text-slate-400 line-clamp-2 mb-10 leading-relaxed font-bold uppercase tracking-wider">
                  {producto.descripcion || 'Exclusividad en cada detalle'}
                </p>
                
                <div className="mt-auto flex items-center justify-between gap-1 sm:gap-6 pt-2 sm:pt-6 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="hidden sm:block text-[9px] uppercase font-black text-slate-300 tracking-[0.2em] mb-1">Inversión</span>
                    <span className="text-base sm:text-3xl font-black text-slate-900 leading-none group-hover:text-blue-600 transition-colors">
                      {Number(producto.precio || 0).toFixed(2)}<span className="text-xs sm:text-lg ml-0.5">€</span>
                    </span>
                  </div>
                  <div className="flex-1">
                    <AgregarAlCarritoBtn producto={producto} />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 font-semibold">No se encontraron productos que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>
    </section>
  );
}
