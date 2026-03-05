import SearchProductos from "@/components/SearchProductos";

export const dynamic = 'force-dynamic';

async function fetchSafe(url: string, key: string) {
  try {
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 10 },
    });
    return res.ok ? await res.json() : [];
  } catch (error) {
    console.error("Fallo en la carga de datos:", error);
    return [];
  }
}

export default async function HomePage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!URL || !KEY) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-500 font-medium">Configurando conexión...</p>
      </div>
    );
  }

  const [productos, categorias] = await Promise.all([
    fetchSafe(`${URL}/rest/v1/productos?select=*,familias(nombre)`, KEY),
    fetchSafe(`${URL}/rest/v1/familias?select=*&order=nombre.asc`, KEY)
  ]);

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl">
        <h1 className="text-4xl font-black mb-2">Mi Tienda</h1>
        <p className="text-blue-100">Productos exclusivos seleccionados para ti.</p>
      </section>

      <SearchProductos initialProducts={productos} categorias={categorias} />
    </div>
  );
}
