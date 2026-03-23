'use client';

import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Search, X, ChevronDown, Tag, ChevronLeft, ChevronRight, Percent, Eye, Star } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

function MiniEstrellas({ media, total }: { media: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            size={10}
            className={n <= Math.round(media) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
          />
        ))}
      </div>
      <span className="text-[10px] text-slate-400 font-semibold">{media.toFixed(1)} <span className="font-normal">({total})</span></span>
    </div>
  );
}

const ProductoModal = lazy(() => import('./ProductoModal'));

export default function SearchProductos({
  initialProducts = [],
  initialQuery = '',
  initialSort = 'newest',
  initialCategoria = null,
  categorias = [],
  medias = {}
}: {
  initialProducts?: any[];
  initialQuery?: string;
  initialSort?: string;
  initialCategoria?: string | null;
  categorias?: any[];
  medias?: Record<string, { media: number; total: number }>;
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ]                         = useState(initialQuery || '');
  const [sort, setSort]                   = useState(initialSort || 'newest');
  const [categoria, setCategoria]         = useState(initialCategoria || '');
  const [carouselIdx, setCarouselIdx]     = useState<Record<string, number>>({});
  const [modalProducto, setModalProducto] = useState<any | null>(null);

  useEffect(() => { setQ(initialQuery || ''); }, [initialQuery]);
  useEffect(() => { setSort(initialSort || 'newest'); }, [initialSort]);
  useEffect(() => { setCategoria(initialCategoria || ''); }, [initialCategoria]);

  const updateSearchParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== (searchParams.get('q') || '')) updateSearchParams({ q: q || null });
    }, 500);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    let r = [...initialProducts];
    if (q.trim()) {
      const lq = q.toLowerCase();
      r = r.filter(p => p.nombre?.toLowerCase().includes(lq) || p.descripcion?.toLowerCase().includes(lq));
    }
    if (categoria) r = r.filter(p => String(p.familia_id) === String(categoria) || String(p.id_familia) === String(categoria));
    r.sort((a, b) => {
      switch (sort) {
        case 'price_asc':     return Number(a.precio || 0) - Number(b.precio || 0);
        case 'price_desc':    return Number(b.precio || 0) - Number(a.precio || 0);
        case 'name_asc':      return (a.nombre || '').localeCompare(b.nombre || '');
        case 'name_desc':     return (b.nombre || '').localeCompare(a.nombre || '');
        case 'discount_desc': {
          const pct = (p: any) => {
            const pvp = Number(p.precio || 0), tachado = Number(p.precio_tachado || 0), d = Number(p.descuento_pct || 0);
            if (d > 0) return d;
            if (tachado > pvp && pvp > 0) return Math.round((1 - pvp / tachado) * 100);
            return 0;
          };
          return pct(b) - pct(a);
        }
        case 'discount_asc': {
          const pct = (p: any) => {
            const pvp = Number(p.precio || 0), tachado = Number(p.precio_tachado || 0), d = Number(p.descuento_pct || 0);
            if (d > 0) return d;
            if (tachado > pvp && pvp > 0) return Math.round((1 - pvp / tachado) * 100);
            return 0;
          };
          return pct(a) - pct(b);
        }
        default:              return (b.id || 0) - (a.id || 0);
      }
    });
    return r;
  }, [initialProducts, q, categoria, sort]);

  const calcDescuento = (p: any) => {
    const pvp     = Number(p.precio || 0);
    const tachado = Number(p.precio_tachado || 0);
    const pct     = Number(p.descuento_pct || 0);
    if (pct > 0) return pct;
    if (tachado > pvp) return Math.round((1 - pvp / tachado) * 100);
    return 0;
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
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, descripción…"
            className="flex-1 p-4 outline-none text-slate-600 placeholder:text-slate-400 bg-transparent font-medium"
          />
          {q && (
            <button type="button" onClick={() => { setQ(''); updateSearchParams({ q: null }); }} className="px-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select value={categoria} onChange={e => { setCategoria(e.target.value); updateSearchParams({ categoria: e.target.value || null }); }}
              className="appearance-none bg-white border border-slate-100 shadow-lg shadow-slate-200/50 rounded-full px-6 py-4 pr-12 text-slate-600 font-bold cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all">
              <option value="">Todas las categorías</option>
              {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={sort} onChange={e => { setSort(e.target.value); updateSearchParams({ sort: e.target.value }); }}
              className="appearance-none bg-white border border-slate-100 shadow-lg shadow-slate-200/50 rounded-full px-6 py-4 pr-12 text-slate-600 font-bold cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all">
              <option value="newest">Más nuevos</option>
              <option value="discount_desc">Mayor descuento</option>
              <option value="discount_asc">Menor descuento</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="name_asc">Nombre: A-Z</option>
              <option value="name_desc">Nombre: Z-A</option>
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-10">
        {filtered.length > 0 ? filtered.map(producto => {
          const imgs: string[] = Array.isArray(producto.imagenes) && producto.imagenes.length > 0
            ? producto.imagenes : producto.imagen_url ? [producto.imagen_url] : [];
          const cidx    = carouselIdx[producto.id] || 0;
          const pvp     = Number(producto.precio || 0);
          const tachado = Number(producto.precio_tachado || 0);
          const pct     = calcDescuento(producto);

          return (
            <div key={producto.id}
              className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-3 sm:p-5 shadow-2xl shadow-slate-200/30 border border-slate-50 hover:shadow-blue-200/40 hover:-translate-y-3 transition-all duration-700 flex flex-col group cursor-pointer"
              onClick={() => setModalProducto(producto)}
            >
              {/* Carrusel */}
              <div className="relative w-full h-40 sm:h-80 overflow-hidden bg-slate-50 rounded-[1.2rem] sm:rounded-[2rem] mb-3 sm:mb-8 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                {(() => {
                  return (
                    <>
                      <img
                        src={imgs[cidx] || '/globe.svg'}
                        alt={producto.nombre || 'Producto'}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        onError={e => { (e.target as HTMLImageElement).src = '/globe.svg'; }}
                      />
                      {imgs.length > 1 && (
                        <>
                          <button onClick={e => { e.stopPropagation(); setCarouselIdx(c => ({...c, [producto.id]: (cidx - 1 + imgs.length) % imgs.length})); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ChevronLeft size={16} className="text-slate-700" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); setCarouselIdx(c => ({...c, [producto.id]: (cidx + 1) % imgs.length})); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ChevronRight size={16} className="text-slate-700" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
                            {imgs.map((_, i) => (
                              <button key={i} onClick={e => { e.stopPropagation(); setCarouselIdx(c => ({...c, [producto.id]: i})); }}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === cidx ? 'bg-white w-4' : 'bg-white/50'}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}

                {/* Categoría */}
                {(producto.familias?.nombre || producto.categoria) && (
                  <span className="absolute left-2 sm:left-5 top-2 sm:top-5 bg-slate-900/80 backdrop-blur-md text-white text-[7px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] px-2 sm:px-5 py-1 sm:py-2.5 rounded-full font-black shadow-2xl z-20 border border-white/10 flex items-center gap-1 sm:gap-2">
                    <Tag size={8} className="text-blue-400 hidden sm:block" />
                    {producto.familias?.nombre || producto.categoria}
                  </span>
                )}

                {/* Badge descuento */}
                {pct > 0 && (
                  <span className="absolute right-2 sm:right-4 top-2 sm:top-4 bg-red-500 text-white text-[9px] sm:text-xs font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg z-20 flex items-center gap-0.5">
                    <Percent size={9} />-{pct}%
                  </span>
                )}

                {/* Botón "Ver" en hover */}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="bg-white/90 backdrop-blur-sm text-slate-900 font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2">
                    <Eye size={14} /> Ver producto
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 px-1 sm:px-2">
                <div className="mb-2 sm:mb-4">
                  <h2 className="text-sm sm:text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 tracking-tight">
                    {producto.nombre}
                  </h2>
                  {medias[producto.id] ? (
                    <MiniEstrellas media={medias[producto.id].media} total={medias[producto.id].total} />
                  ) : (
                    <div className="h-0.5 sm:h-1 w-8 sm:w-12 bg-blue-600/20 rounded-full mt-1 sm:mt-2 group-hover:w-16 sm:group-hover:w-24 transition-all duration-500" />
                  )}
                </div>

                {/* Descripción corta */}
                <p className="hidden sm:block text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed font-bold uppercase tracking-wider">
                  {producto.descripcion || 'Exclusividad en cada detalle'}
                </p>

                {/* Precios */}
                <div className="mt-auto pt-2 sm:pt-4 border-t border-slate-50">
                  <div className="flex items-end gap-2">
                    <span className="text-base sm:text-3xl font-black text-slate-900 leading-none group-hover:text-blue-600 transition-colors">
                      {pvp.toFixed(2)}<span className="text-xs sm:text-lg ml-0.5">€</span>
                    </span>
                    {tachado > pvp && (
                      <span className="text-xs sm:text-base text-slate-400 line-through font-bold">
                        {tachado.toFixed(2)}€
                      </span>
                    )}
                  </div>
                  {pct > 0 && (
                    <p className="text-[10px] sm:text-xs text-red-500 font-black mt-0.5">
                      Ahorras {(tachado > 0 ? tachado - pvp : 0).toFixed(2)}€
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 font-semibold">No se encontraron productos que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>

      {/* Modal de producto (página 2) */}
      {modalProducto && (
        <Suspense fallback={null}>
          <ProductoModal producto={modalProducto} onClose={() => setModalProducto(null)} />
        </Suspense>
      )}
    </section>
  );
}
