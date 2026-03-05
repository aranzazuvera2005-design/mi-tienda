import SearchProductos from "@/components/SearchProductos";

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: any }) {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Corregido: Definimos el tipo como 'any[]' para que el sistema no se queje
  let productos: any[] = [];
  let categorias: any[] = [];

  try {
    if (URL && KEY) {
      // 1. Intentamos traer productos
      const resProd = await fetch(`${URL}/rest/v1/productos?select=*,familias(nombre)`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        next: { revalidate: 1 }
      });
      if (resProd.ok) productos = await resProd.json();

      // 2. Intentamos traer categorías
      const resCat = await fetch(`${URL}/rest/v1/familias?select=*&order=nombre.asc`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        next: { revalidate: 1 }
      });
      if (resCat.ok) categorias = await resCat.json();
    }
  } catch (e) {
    console.log("Error de conexión con la base de datos");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Banner Premium */}
        <header className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 sm:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-5xl sm:text-6xl font-black mb-4 tracking-tighter">Mi Tienda</h1>
            <p className="text-xl text-blue-100 font-medium max-w-lg">
              Diseño boutique y experiencia premium.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </header>

        {/* Si hay productos, los mostramos. Si no, mostramos el estado de carga/error suave */}
        {productos.length > 0 ? (
          <SearchProductos 
            initialProducts={productos} 
            categorias={categorias} 
          />
        ) : (
          <div className="bg-white p-20 rounded-[2.5rem] text-center shadow-sm border border-slate-100">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full mb-4"></div>
              <p className="text-slate-400 font-bold text-lg">Sincronizando inventario...</p>
              <p className="text-slate-300 text-sm mt-2">Revisa que las llaves de Supabase en Vercel sean correctas.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
