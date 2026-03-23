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
  let medias: Record<string, { media: number; total: number }> = {};

  if (URL && KEY) {
    try {
      const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

      const [resProd, resCat] = await Promise.all([
        fetch(
          `${URL}/rest/v1/productos?select=id,nombre,precio,precio_tachado,descuento_pct,descripcion,descripcion_larga,imagen_url,imagenes,familia_id,familias(nombre)&or=(oculto.is.null,oculto.eq.false)`,
          { headers, cache: 'no-store' }
        ),
        fetch(
          `${URL}/rest/v1/familias?select=*&order=nombre.asc`,
          { headers, cache: 'no-store' }
        ),
      ]);
      if (resProd.ok) productos = await resProd.json();
      if (resCat.ok)  categorias = await resCat.json();
    } catch (e) {
      console.error("Error cargando productos/categorias");
    }

    // Medias de reseñas por separado para no bloquear si falla
    try {
      const resMedias = await fetch(
        `${URL}/rest/v1/resenas?select=producto_id,valoracion`,
        { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' }
      );
      if (resMedias.ok) {
        const rows: { producto_id: string; valoracion: number }[] = await resMedias.json();
        const mapa: Record<string, { suma: number; total: number }> = {};
        for (const r of rows) {
          if (!mapa[r.producto_id]) mapa[r.producto_id] = { suma: 0, total: 0 };
          mapa[r.producto_id].suma += r.valoracion;
          mapa[r.producto_id].total += 1;
        }
        for (const [pid, { suma, total }] of Object.entries(mapa)) {
          medias[pid] = { media: Math.round((suma / total) * 10) / 10, total };
        }
      }
    } catch (e) {
      // No bloqueante: las estrellas simplemente no aparecerán
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
          medias={medias}
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
