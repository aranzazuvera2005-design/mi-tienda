import AgregarAlCarritoBtn from "@/components/AgregarAlCarritoBtn";
import SearchProductos from "@/components/SearchProductos";
import { Star } from "lucide-react";

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
    <div className="py-8">
      {/* HERO SECTION */}
      <section className="bg-white rounded-[2.5rem] p-12 mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center gap-12 relative overflow-hidden border border-slate-50">
        <div className="flex-1 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Star size={16} fill="currentColor" />
            <span>Novedades Exclusivas</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
            Mi Tienda
          </h1>
          <p className="text-xl text-slate-500 mb-8 leading-relaxed font-medium max-w-xl">
            Descubre nuestra selección premium de productos locales con envío rápido a tu domicilio.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
              Explorar Catálogo
            </button>
          </div>
        </div>
        <div className="hidden md:flex flex-shrink-0">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-16 shadow-2xl shadow-blue-200 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Star size={120} className="text-white" fill="white" />
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
        <div className="mt-12 p-16 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] text-center border border-slate-50">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star size={40} className="text-slate-300" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            {categoria ? 'No hay productos en esta categoría' : 'No se encontraron productos'}
          </h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            Intenta ajustar tus filtros o búsqueda para encontrar lo que necesitas.
          </p>
        </div>
      )}
    </div>
  );
}
