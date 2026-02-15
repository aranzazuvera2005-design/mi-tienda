import AgregarAlCarritoBtn from "../components/AgregarAlCarritoBtn";
import SearchProductos from "../components/SearchProductos";

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // Usamos el endpoint REST de Supabase desde el servidor para evitar depender
  // de una conexión directa a Postgres (que falla si no hay acceso IPv4 al host)
  // Priorizamos las variables de servidor si están disponibles
  const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)?.trim();

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
      } else {
        const errorText = await res.text();
        console.error(`Error Supabase API (${res.status}):`, errorText);
      }
    } catch (e: any) {
      console.error("Error de red o fetch en HomePage:", e?.message || e);
    }
  }

  // Si no hay productos (error de conexión o falta de variables), mostrar mensaje informativo
  const noConfig = !SUPABASE_URL || !SERVICE_KEY;

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
        <SearchProductos initialProducts={productos} initialQuery={q} />

        {productos.length === 0 && (
          <div className="mt-12 p-8 bg-blue-50 border border-blue-100 rounded-2xl text-center">
            <h2 className="text-xl font-bold text-blue-900 mb-2">
              {noConfig ? 'Configuración pendiente' : 'No se encontraron productos'}
            </h2>
            <p className="text-blue-700">
              {noConfig 
                ? 'Para ver tus productos, asegúrate de configurar las variables de entorno de Supabase en Vercel.' 
                : 'Conexión establecida, pero la lista de productos está vacía o no se pudo cargar.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}