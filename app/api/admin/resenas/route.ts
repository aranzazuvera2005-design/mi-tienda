import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// GET /api/admin/resenas → todas las reseñas con estadísticas para el panel de admin
export async function GET(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);

  const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
  const limit = parseInt(url.searchParams.get('limit') || '20', 10) || 20;
  const filtroValoracion = url.searchParams.get('valoracion') || '';
  const busqueda = url.searchParams.get('q') || '';

  try {
    let query = supabase
      .from('resenas')
      .select(`
        id, valoracion, comentario, foto_url, creado_at,
        producto:productos(id, nombre),
        perfil:perfiles(nombre, email)
      `, { count: 'exact' })
      .order('creado_at', { ascending: false });

    if (filtroValoracion) {
      query = query.eq('valoracion', parseInt(filtroValoracion));
    }

    const from = (page - 1) * limit;
    const to = page * limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Estadísticas globales
    const { data: stats } = await supabase
      .from('resenas')
      .select('valoracion');

    const totalResenas = stats?.length || 0;
    const promedioGlobal = totalResenas > 0
      ? (stats!.reduce((sum, r) => sum + r.valoracion, 0) / totalResenas).toFixed(1)
      : '0';
    const distribucion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats?.forEach(r => { distribucion[r.valoracion] = (distribucion[r.valoracion] || 0) + 1; });

    return new Response(JSON.stringify({
      data: data || [],
      count: count ?? 0,
      stats: { totalResenas, promedioGlobal, distribucion },
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}

// DELETE /api/admin/resenas?id=... → eliminar una reseña
export async function DELETE(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400 });
  }

  try {
    const { error } = await supabase.from('resenas').delete().eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
