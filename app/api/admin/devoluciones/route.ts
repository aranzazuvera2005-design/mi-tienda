import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const estado = url.searchParams.get('estado') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(url.searchParams.get('limit') || '10', 10) || 10;

    let builder = supabase
      .from('devoluciones')
      .select(`
        *,
        pedido:pedidos(id, cliente_id, creado_at, total, cliente:perfiles(nombre, telefono)),
        producto:productos(id, nombre, precio)
      `, { count: 'exact' })
      .order('fecha_solicitud', { ascending: false });

    // Filtro por búsqueda
    if (q) {
      const escaped = q.replace(/[%_]/g, '\\$&');
      const parts = [
        `id.ilike.%${escaped}%`,
        `producto.nombre.ilike.%${escaped}%`,
        `pedido.cliente.nombre.ilike.%${escaped}%`
      ];
      builder = builder.or(parts.join(','));
    }

    // Filtro por estado
    if (estado) {
      builder = builder.eq('estado', estado);
    }

    const fromIndex = (page - 1) * limit;
    const toIndex = page * limit - 1;

    builder = builder.range(fromIndex, toIndex);

    const { data, error, count } = await builder;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ data: data || [], count: count ?? (data || []).length }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const { id, estado, observaciones_admin } = body;

    if (!id || !estado) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const updateData: any = { estado };
    if (observaciones_admin !== undefined) {
      updateData.observaciones_admin = observaciones_admin;
    }

    const { data, error } = await supabase
      .from('devoluciones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
