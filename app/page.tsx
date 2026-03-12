export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SearchProductos from "@/components/SearchProductos";
import HeroSection from "@/components/HeroSection";

export default async function HomePage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const q         = params.q || '';
  const sort      = params.sort || 'newest';
  const categoria = params.categoria || null;

  let productos: any[] = [];
  let categorias: any[] = [];

  if (URL && KEY) {
    try {
      const [resProd, resCat] = await Promise.all([
        fetch(
          `${URL}/rest/v1/productos?select=id,nombre,precio,precio_tachado,descuento_pct,descripcion,descripcion_larga,imagen_url,imagenes,familia_id,familias(nombre)`,
          { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, next: { revalidate: 1 } }
        ),
        fetch(
          `${URL}/rest/v1/familias?select=*&order=nombre.asc`,
          { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, next: { revalidate: 1 } }
        )
      ]);
      if (resProd.ok) productos = await resProd.json();
      if (resCat.ok)  categorias = await resCat.json();
    } catch (e) {
      console.error("Error cargando datos");
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-16 py-4 sm:py-12 space-y-6 sm:space-y-16">
      <HeroSection />
      <div id="productos">
        <SearchProductos
          initialProducts={productos}
          categorias={categorias}
          initialQuery={q}
          initialSort={sort}
          initialCategoria={categoria}
        />
      </div>
      {productos.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 font-semibold">No se encontraron productos en el inventario.</p>
        </div>
      )}
    </div>
  );
}
