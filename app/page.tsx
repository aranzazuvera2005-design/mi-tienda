
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
    <div className="max-w-[1600px] mx-auto px-6 sm:px-16 py-12 space-y-16">
      {/* Hero Section Boutique */}
      <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white min-h-[400px] flex items-center p-12 sm:p-20 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.2em]">
            Nueva Colección 2026
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1]">
            Estilo que <span className="text-blue-500">Define</span> tu Historia.
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-lg leading-relaxed">
            Descubre una selección curada de piezas exclusivas diseñadas para quienes buscan la excelencia en cada detalle.
          </p>
          <div className="pt-4">
            <button 
              onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95"
            >
              Explorar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Componente de búsqueda y productos */}
      <div id="productos">
        <SearchProductos initialProducts={productos} categorias={categorias} />
      </div>
      
      {productos.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 font-semibold">No se encontraron productos en el inventario.</p>
        </div>
      )}
    </div>
  );
}
