import AgregarAlCarritoBtn from "@/components/AgregarAlCarritoBtn";
import SearchProductos from "@/components/SearchProductos";
import { Star, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

export const dynamic = 'force-dynamic';

function sortProducts(productos: any[], sortBy: string): any[] {
  const sorted = [...productos];
  switch (sortBy) {
    case 'name_asc': return sorted.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    case 'name_desc': return sorted.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
    case 'price_asc': return sorted.sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0));
    case 'price_desc': return sorted.sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0));
    case 'newest':
    default: return sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }
}

async function fetchCategories(SUPABASE_URL: string, SERVICE_KEY: string) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/familias?select=id,nombre&order=nombre.asc`;
    const res = await fetch(url, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      next: { revalidate: 60 },
    });
    return res.ok ? await res.json() : [];
  } catch (e) { return []; }
}

async function fetchProducts(SUPABASE_URL: string, SERVICE_KEY: string, q: string, categoriaId: string | null, sort: string) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/productos?select=*,familias(nombre)`;
    if (q) {
      const inner = `(${`nombre.ilike.*${q}*|descripcion.ilike.*${q}*|familias.nombre.ilike.*${q}*|categoria.ilike.*${q}*`})`;
      url += `&or=${encodeURIComponent(inner)}`;
    }
    if (categoriaId) url += `&familia_id=eq.${categoriaId}`;
    const res = await fetch(url, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      next: { revalidate: 10 },
    });
    if (res.ok) {
      let productos = await res.json();
      return sortProducts(productos, sort);
    }
    return [];
  } catch (e) { return []; }
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string; sort?: string }> }) {
  const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)?.trim();
  const params = await searchParams;
  const q = params?.q?.toString()?.trim() || '';
  const categoria = params?.categoria?.toString()?.trim() || null;
  const sort = params?.sort?.toString()?.trim() || 'newest';

  let productos: any[] = [];
  let categorias: any[] = [];
  const noConfig = !SUPABASE_URL || !SERVICE_KEY;

  if (!noConfig) {
    const [categoriasData, productosData] = await Promise.all([
      fetchCategories(SUPABASE_URL, SERVICE_KEY),
      fetchProducts(SUPABASE_URL, SERVICE_KEY, q, categoria, sort),
    ]);
    categorias = categoriasData;
    productos = productosData;
  }

  return (
    <div className="py-4 sm:py-8">
      {/* HERO SECTION PREMIUM */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-[2.5rem] p-8 sm:p-12 mb-12 shadow-2xl shadow-blue-200 flex flex-col md:flex-row items-center gap-12 overflow-hidden border border-white/10">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="flex-1 relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold mb-6 border border-white/30 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={16} className="text-yellow-300" />
            <span>Colección Premium 2026</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-sm">
            Mi Tienda <br className="hidden sm:block" />
            <span className="text-blue-200">Exclusiva</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 leading-relaxed font-medium max-w-xl mx-auto md:mx-0">
            Descubre productos seleccionados con los más altos estándares de calidad. Compra local, recibe en casa con total garantía.
          </p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-white/90 text-sm font-bold">
              <ShieldCheck size={20} className="text-green-400" />
              <span>Garantía Total</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 text-sm font-bold">
              <TrendingUp size={20} className="text-blue-300" />
              <span>Envío Express</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-shrink-0 relative z-10">
          <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] p-12 shadow-2xl border border-white/20 rotate-3 hover:rotate-0 transition-all duration-700 group">
            <div className="bg-white rounded-[2rem] p-8 shadow-inner group-hover:scale-105 transition-transform duration-500">
              <Star size={120} className="text-blue-600 animate-pulse" fill="currentColor" />
            </div>
          </div>
        </div>
      </section>

      {/* Buscador y Filtros */}
      <SearchProductos 
        initialProducts={productos} 
        initialQuery={q} 
        initialSort={sort}
        initialCategoria={categoria}
        categorias={categorias}
      />

      {/* Estados vacíos */}
      {productos.length === 0 && !noConfig && (
        <div className="mt-12 p-16 bg-white rounded-[2.5rem] shadow-xl text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Star size={48} className="text-slate-300" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">
            {categoria ? 'No hay productos aquí' : 'No se encontraron productos'}
          </h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto font-medium">
            Intenta ajustar tus filtros o búsqueda para encontrar lo que necesitas.
          </p>
        </div>
      )}
    </div>
  );
}
