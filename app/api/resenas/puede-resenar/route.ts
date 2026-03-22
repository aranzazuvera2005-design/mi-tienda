import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// GET /api/resenas/puede-resenar?productoId=...&clienteId=...
// → { haPurchased: boolean, yaReseno: boolean }
export async function GET(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const productoId = url.searchParams.get('productoId');
  const clienteId = url.searchParams.get('clienteId');

  if (!productoId || !clienteId) {
    return new Response(JSON.stringify({ error: 'productoId y clienteId requeridos' }), { status: 400 });
  }

  try {
    // Paso 1: obtener IDs de pedidos del cliente
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id')
      .eq('cliente_id', clienteId);

    const pedidoIds = (pedidos || []).map((p: any) => p.id);

    // Paso 2: comprobar si alguna línea de esos pedidos contiene el producto
    const { data: compra } = pedidoIds.length > 0
      ? await supabase
          .from('lineas_pedido')
          .select('id')
          .eq('producto_id', productoId)
          .in('pedido_id', pedidoIds)
          .limit(1)
          .maybeSingle()
      : { data: null };

    // Comprobar si ya existe reseña
    const { data: resena } = await supabase
      .from('resenas')
      .select('id')
      .eq('producto_id', productoId)
      .eq('cliente_id', clienteId)
      .maybeSingle();

    return new Response(JSON.stringify({
      haPurchased: !!compra,
      yaReseno: !!resena,
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
