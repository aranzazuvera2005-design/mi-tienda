import AgregarAlCarritoBtn from "../components/AgregarAlCarritoBtn";
import SearchProductos from "../components/SearchProductos";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // Usamos el endpoint REST de Supabase desde el servidor para evitar depender
  // de una conexión directa a Postgres (que falla si no hay acceso IPv4 al host)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const params = await searchParams;
  const q = params?.q?.toString()?.trim() || '';

  let productos: any[] = [];

  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      console.log('HomePage: SUPABASE_URL detected, attempting fetch from', SUPABASE_URL);
      // construir query: si hay q, buscar en nombre, descripcion, familia(relacion) y categoria
      // pedimos también la relación 'familias' para buscar por su nombre
      let url = `${SUPABASE_URL}/rest/v1/productos?select=*,familias(nombre)`;
      if (q) {
        // PostgREST: use `*` as wildcard; use `|` as separator in `or` to avoid parse errors
        const inner = `(${`nombre.ilike.*${q}*|descripcion.ilike.*${q}*|familias.nombre.ilike.*${q}*|categoria.ilike.*${q}*`})`;
        url += `&or=${encodeURIComponent(inner)}`;
      }

      const res = await fetch(url, {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        // volver a validar cada 10s en ISR
        next: { revalidate: 10 },
      });

      if (res.ok) {
        productos = await res.json();
        console.log('HomePage: fetched productos count=', productos.length);
      } else {
        console.error("Error al obtener productos desde Supabase:", res.status, res.statusText);
      }
    } catch (e) {
      console.error("Fetch productos falló:", e);
    }
  } else {
    console.warn("No hay SUPABASE_URL o SERVICE_KEY configurados; lista de productos vacía.");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* HERO */}
        <section className="bg-white rounded-xl p-8 mb-4 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-gray-900">Mi Tienda</h1>
            <p className="text-gray-600 mt-2">Productos seleccionados con cariño. Compra local, recibe en casa.</p>
          </div>
          <div className="hidden md:block">
            <img src="/globe.svg" alt="Mi Tienda" className="w-40 h-40" />
          </div>
        </section>

        {/* Buscador */}
        {/* Replaced with client-side search UI */}
        <SearchProductos initialProducts={productos} initialQuery={q} />
      </div>
    </main>
  );
}