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
    // Comprobar si ha comprado el producto
    const { data: compra } = await supabase
      .from('lineas_pedido')
      .select('id, pedido:pedidos!inner(cliente_id)')
      .eq('producto_id', productoId)
      .eq('pedido.cliente_id', clienteId)
      .limit(1)
      .maybeSingle();

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
