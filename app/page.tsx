import AgregarAlCarritoBtn from "@/components/AgregarAlCarritoBtn";
import SearchProductos from "@/components/SearchProductos";
import CategoryFilter from "@/components/CategoryFilter";
import { Suspense } from "react";
import Loading from "./loading";

export const dynamic = 'force-dynamic';

// Función para ordenar productos en el servidor
function sortProducts(productos: any[], sortBy: string): any[] {
  const sorted = [...productos];
  
  switch (sortBy) {
    case 'name_asc':
      return sorted.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    case 'name_desc':
      return sorted.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
    case 'price_asc':
      return sorted.sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0));
    case 'price_desc':
      return sorted.sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0));
    case 'newest':
    default:
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Descendente: lo más nuevo primero
      });
  }
}

async function fetchCategories(SUPABASE_URL: string, SERVICE_KEY: string) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/familias?select=id,nombre&order=nombre.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      next: { revalidate: 60 }, // Cache de 60 segundos
    });

    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (e) {
    console.error("Error fetching categories:", e);
    return [];
  }
}

async function fetchProducts(
  SUPABASE_URL: string,
  SERVICE_KEY: string,
  q: string,
  categoriaId: string | null,
  sort: string
) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/productos?select=*,familias(nombre)`;
    
    // Filtro por búsqueda
    if (q) {
      const inner = `(${`nombre.ilike.*${q}*|descripcion.ilike.*${q}*|familias.nombre.ilike.*${q}*|categoria.ilike.*${q}*`})`;
      url += `&or=${encodeURIComponent(inner)}`;
    }

    // Filtro por categoría (familia_id)
    if (categoriaId) {
      url += `&familia_id=eq.${categoriaId}`;
    }

    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      next: { revalidate: 10 },
    });

    if (res.ok) {
      let productos = await res.json();
      // Aplicar ordenación en el servidor
      productos = sortProducts(productos, sort);
      return productos;
    }
    return [];
  } catch (e) {
    console.error("Error fetching products:", e);
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; sort?: string }>;
}) {
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
    // Obtener categorías y productos en paralelo
    const [categoriasData, productosData] = await Promise.all([
      fetchCategories(SUPABASE_URL, SERVICE_KEY),
      fetchProducts(SUPABASE_URL, SERVICE_KEY, q, categoria, sort),
    ]);

    categorias = categoriasData;
    productos = productosData;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* HERO SECTION - Premium Design */}
        <section className="bg-white rounded-3xl p-8 md:p-12 mb-12 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8 overflow-hidden">
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 mb-4 leading-tight">
              Mi Tienda
            </h1>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Productos seleccionados con cariño. Compra local, recibe en casa.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-2xl">✨</span>
                <span className="font-medium">Calidad Premium</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-2xl">🚚</span>
                <span className="font-medium">Envío Rápido</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block flex-shrink-0 w-64 h-64 rounded-2xl overflow-hidden shadow-lg">
            <img 
              src="/globe.svg" 
              alt="Mi Tienda - Productos Premium" 
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
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

        {/* Mensaje de configuración pendiente */}
        {noConfig && (
          <div className="mt-12 p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center">
            <h2 className="text-xl font-bold text-amber-900 mb-2">
              Configuración pendiente
            </h2>
            <p className="text-amber-700">
              Para ver tus productos, asegúrate de configurar las variables de entorno de Supabase en Vercel.
            </p>
          </div>
        )}

        {/* Mensaje de sin productos */}
        {!noConfig && productos.length === 0 && (
          <div className="mt-12 p-8 bg-blue-50 border border-blue-200 rounded-3xl text-center">
            <h2 className="text-xl font-bold text-blue-900 mb-2">
              {categoria ? '📭 No hay productos en esta categoría' : '📭 No se encontraron productos'}
            </h2>
            <p className="text-blue-700">
              {categoria 
                ? 'Intenta seleccionar otra categoría o ajusta tu búsqueda.' 
                : 'Conexión establecida, pero la lista de productos está vacía o no se pudo cargar.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
