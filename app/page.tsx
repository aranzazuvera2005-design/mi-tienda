
export const dynamic = 'force-dynamic';
export const revalidate = 0;


import SearchProductos from "@/components/SearchProductos";


export default async function HomePage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Añadimos : any[] para que Vercel no dé error de tipo
  let productos: any[] = [];
  let categorias: any[] = [];

  if (URL && KEY) {
    try {
      const [resProd, resCat] = await Promise.all([
        fetch(`${URL}/rest/v1/productos?select=*,familias(nombre)`, {
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
          next: { revalidate: 1 }
        }),
        fetch(`${URL}/rest/v1/familias?select=*&order=nombre.asc`, {
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
          next: { revalidate: 1 }
        })
      ]);

      if (resProd.ok) productos = await resProd.json();
      if (resCat.ok) categorias = await resCat.json();
    } catch (e) {
      console.error("Error cargando datos");
    }
  }

  return (
    <div className="space-y-10">
      {/* Banner de Bienvenida */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-10 text-white shadow-xl">
        <h1 className="text-4xl sm:text-5xl font-black mb-4">Mi Tienda Boutique</h1>
        <p className="text-lg text-blue-100 font-medium">Explora nuestra colección exclusiva.</p>
      </section>

      {/* Componente de búsqueda y productos */}
      <SearchProductos initialProducts={productos} categorias={categorias} />
      
      {productos.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 font-semibold">No se encontraron productos en el inventario.</p>
        </div>
      )}
    </div>
  );
}
