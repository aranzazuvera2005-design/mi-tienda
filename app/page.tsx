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
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* HERO SECTION - Premium Design con Degradado */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-900 rounded-3xl p-12 md:p-20 mb-20 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col md:flex-row items-center gap-16 overflow-hidden relative">
          {/* Efecto de luz de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="flex-1 relative z-10">
            <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Mi Tienda
            </h1>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed font-light">
              Productos seleccionados con cariño. Compra local, recibe en casa.
            </p>
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex items-center gap-3 text-white">
                <span className="text-4xl">✨</span>
                <div>
                  <div className="font-semibold">Calidad Premium</div>
                  <div className="text-sm text-blue-100">Productos seleccionados</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white">
                <span className="text-4xl">🚚</span>
                <div>
                  <div className="font-semibold">Envío Rápido</div>
                  <div className="text-sm text-blue-100">En 24-48 horas</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-shrink-0 w-80 h-80 rounded-3xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm items-center justify-center border border-white/20">
            <div className="text-9xl">🎁</div>
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
          <div className="mt-20 p-10 bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
              Configuración pendiente
            </h2>
            <p className="text-slate-600 text-lg">
              Para ver tus productos, asegúrate de configurar las variables de entorno de Supabase en Vercel.
            </p>
          </div>
        )}

        {/* Mensaje de sin productos */}
        {!noConfig && productos.length === 0 && (
          <div className="mt-20 p-10 bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
              {categoria ? '📭 No hay productos en esta categoría' : '📭 No se encontraron productos'}
            </h2>
            <p className="text-slate-600 text-lg">
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
