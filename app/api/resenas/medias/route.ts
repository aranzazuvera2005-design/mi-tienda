import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// GET /api/resenas/medias → media de valoraciones por producto
// Devuelve: [{ producto_id, media, total }]
export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const { data, error } = await supabase
      .from('resenas')
      .select('producto_id, valoracion');

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    // Agrupar y calcular medias en servidor
    const mapa: Record<string, { suma: number; total: number }> = {};
    for (const r of data || []) {
      if (!mapa[r.producto_id]) mapa[r.producto_id] = { suma: 0, total: 0 };
      mapa[r.producto_id].suma += r.valoracion;
      mapa[r.producto_id].total += 1;
    }

    const resultado = Object.entries(mapa).map(([producto_id, { suma, total }]) => ({
      producto_id,
      media: Math.round((suma / total) * 10) / 10,
      total,
    }));

    return new Response(JSON.stringify({ data: resultado }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
