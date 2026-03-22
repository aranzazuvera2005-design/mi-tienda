import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error('Missing Supabase configuration');
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

// PATCH /api/admin/productos → actualizar producto
export async function PATCH(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { id, ...campos } = body;

    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400 });

    // Limpiar campos no válidos
    const permitidos = ['nombre', 'precio', 'precio_tachado', 'descuento_pct', 'familia_id', 'familia', 'descripcion', 'descripcion_larga', 'imagen_url', 'imagenes'];
    const payload: any = {};
    for (const key of permitidos) {
      if (key in campos) payload[key] = campos[key];
    }

    const { error } = await supabase.from('productos').update(payload).eq('id', id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}

// DELETE /api/admin/productos?id=... → eliminar producto
export async function DELETE(req: Request) {
  try {
    const supabase = getSupabase();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400 });

    // Borrar dependencias que son seguras de eliminar en cascada
    await supabase.from('resenas').delete().eq('producto_id', id);
    await supabase.from('variantes').delete().eq('producto_id', id);

    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) {
      // FK con lineas_pedido: el producto tiene pedidos asociados
      if (error.code === '23503') {
        return new Response(
          JSON.stringify({ error: 'No se puede eliminar: el producto tiene pedidos asociados. Puedes ocultarlo en cambio.' }),
          { status: 409 }
        );
      }
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
