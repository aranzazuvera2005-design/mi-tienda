import { createClient } from '@supabase/supabase-js';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const clienteId = url.searchParams.get('cliente_id') || null;
    const from = url.searchParams.get('from') || null;
    const to = url.searchParams.get('to') || null;
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 100));

    let builder = supabase
      .from('pedidos')
      .select('*, cliente:perfiles(nombre, telefono)', { count: 'exact' })
      .order('creado_at', { ascending: false });

    if (clienteId) {
      builder = builder.eq('cliente_id', clienteId);
    } else if (q) {
      // intentar buscar en varios campos (id, perfil nombre, telefono, productos.nombre)
      const escaped = q.replace(/[%_]/g, '\\$&');
      const parts = [
        `id.ilike.%${escaped}%`,
        `cliente.nombre.ilike.%${escaped}%`,
        `cliente.telefono.ilike.%${escaped}%`
      ];
      builder = builder.or(parts.join(','));
    }

    if (from) builder = builder.gte('creado_at', from);
    if (to) builder = builder.lte('creado_at', to);

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
