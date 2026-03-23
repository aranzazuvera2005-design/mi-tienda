import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// GET /api/resenas/puede-resenar?productoId=...&clienteId=...&pedidoId=...
// → { haPurchased: boolean, yaReseno: boolean, miResena: { id, valoracion, comentario, foto_url } | null }
export async function GET(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const productoId = url.searchParams.get('productoId');
  const clienteId = url.searchParams.get('clienteId');
  const pedidoId = url.searchParams.get('pedidoId');

  if (!productoId || !clienteId) {
    return new Response(JSON.stringify({ error: 'productoId y clienteId requeridos' }), { status: 400 });
  }

  try {
    let haPurchased = false;
    if (pedidoId) {
      const { data: compra } = await supabase
        .from('lineas_pedido')
        .select('id')
        .eq('producto_id', productoId)
        .eq('pedido_id', pedidoId)
        .limit(1)
        .maybeSingle();
      haPurchased = !!compra;
    } else {
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id')
        .eq('cliente_id', clienteId);
      const pedidoIds = (pedidos || []).map((p: any) => p.id);
      if (pedidoIds.length > 0) {
        const { data: compra } = await supabase
          .from('lineas_pedido')
          .select('id')
          .eq('producto_id', productoId)
          .in('pedido_id', pedidoIds)
          .limit(1)
          .maybeSingle();
        haPurchased = !!compra;
      }
    }

    // Comprobar si ya existe reseña para este pedido concreto
    let resenaQuery = supabase
      .from('resenas')
      .select('id, valoracion, comentario, foto_url')
      .eq('producto_id', productoId)
      .eq('cliente_id', clienteId);

    if (pedidoId) {
      resenaQuery = resenaQuery.eq('pedido_id', pedidoId);
    }

    const { data: resena } = await resenaQuery.maybeSingle();

    return new Response(JSON.stringify({
      haPurchased,
      yaReseno: !!resena,
      miResena: resena ?? null,
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
