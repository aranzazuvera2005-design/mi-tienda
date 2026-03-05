import AgregarAlCarritoBtn from "@/components/AgregarAlCarritoBtn";
import SearchProductos from "@/components/SearchProductos";
import { Star, Sparkles } from "lucide-react";

export const dynamic = 'force-dynamic';

async function fetchData(url: string, key: string) {
  try {
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 10 }
    });
    return res.ok ? await res.json() : [];
  } catch (e) { return []; }
}

export default async function HomePage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const q = params?.q || '';
  const cat = params?.categoria || null;
  const sort = params?.sort || 'newest';

  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!URL || !KEY) return <div className="p-20 text-center font-bold">Error de Configuración: Revisa las Variables en Vercel.</div>;

  let urlProd = `${URL}/rest/v1/productos?select=*,familias(nombre)`;
  if (q) urlProd += `&or=(nombre.ilike.*${q}*,descripcion.ilike.*${q}*)`;
  if (cat) urlProd += `&familia_id=eq.${cat}`;

  const [productos, categorias] = await Promise.all([
    fetchData(urlProd, KEY),
    fetchData(`${URL}/rest/v1/familias?select=*&order=nombre.asc`, KEY)
  ]);

  return (
    <div className="space-y-12">
      {/* Banner Premium */}
      <section className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold inline-flex items-center gap-2 mb-6"><Sparkles size={14}/> Colección 2026</div>
          <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-none">Mi Tienda <span className="text-blue-200">Exclusiva</span></h1>
          <p className="text-xl text-blue-100 font-medium">Calidad garantizada y envíos express en 24h.</p>
        </div>
        <Star className="absolute right-10 bottom-10 text-white/10 w-64 h-64 rotate-12" />
      </section>

      <SearchProductos initialProducts={productos} categorias={categorias} />
    </div>
  );
}
