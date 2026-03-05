import SearchProductos from "@/components/SearchProductos";

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: any }) {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let productos = [];
  let categorias = [];

  try {
    // Intentamos cargar, pero si falla, no rompemos la web
    if (URL && KEY) {
      const res = await fetch(`${URL}/rest/v1/productos?select=*,familias(nombre)`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        next: { revalidate: 1 }
      });
      if (res.ok) productos = await res.json();
    }
  } catch (e) {
    console.log("Error silencioso de base de datos");
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
        <header className="bg-blue-600 rounded-[2rem] p-12 text-white shadow-xl">
          <h1 className="text-4xl font-black">Mi Tienda Boutique</h1>
          <p className="opacity-90">Si ves esto, el diseño ya funciona. Ahora solo falta la conexión.</p>
        </header>

        {productos.length > 0 ? (
          <SearchProductos initialProducts={productos} categorias={categorias} />
        ) : (
          <div className="bg-white p-20 rounded-[2rem] text-center shadow-md">
            <p className="text-slate-400 font-bold">Conectando con el inventario...</p>
          </div>
        )}
      </div>
    </div>
  );
}
