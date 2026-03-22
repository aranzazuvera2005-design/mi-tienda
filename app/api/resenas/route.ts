import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// GET /api/resenas?productoId=... → reseñas públicas de un producto
export async function GET(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const productoId = url.searchParams.get('productoId');

  if (!productoId) {
    return new Response(JSON.stringify({ error: 'productoId requerido' }), { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('resenas')
      .select(`
        id, valoracion, comentario, foto_url, creado_at,
        perfil:perfiles!cliente_id(nombre)
      `)
      .eq('producto_id', productoId)
      .order('creado_at', { ascending: false });

    if (error) {
      // Si el join falla por FK, intentar sin join
      const { data: dataPlain, error: e2 } = await supabase
        .from('resenas')
        .select('id, valoracion, comentario, foto_url, creado_at')
        .eq('producto_id', productoId)
        .order('creado_at', { ascending: false });

      if (e2) return new Response(JSON.stringify({ error: e2.message }), { status: 500 });
      return new Response(JSON.stringify({ data: dataPlain || [] }), { status: 200 });
    }

    return new Response(JSON.stringify({ data: data || [] }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}

// POST /api/resenas → crear reseña (valida que el usuario haya comprado el producto)
export async function POST(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const { productoId, clienteId, valoracion, comentario, fotoUrl } = body;

    if (!productoId || !clienteId || !valoracion) {
      return new Response(JSON.stringify({ error: 'productoId, clienteId y valoracion son obligatorios' }), { status: 400 });
    }

    if (valoracion < 1 || valoracion > 5) {
      return new Response(JSON.stringify({ error: 'La valoración debe ser entre 1 y 5' }), { status: 400 });
    }

    // Validar que el cliente haya comprado el producto
    // Paso 1: obtener IDs de pedidos del cliente
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('cliente_id', clienteId);

    if (pedidosError) {
      return new Response(JSON.stringify({ error: pedidosError.message }), { status: 500 });
    }

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

    if (!compra) {
      return new Response(
        JSON.stringify({ error: 'Solo puedes reseñar productos que hayas comprado' }),
        { status: 403 }
      );
    }

    // Verificar que no exista ya una reseña de este cliente para este producto
    const { data: existente } = await supabase
      .from('resenas')
      .select('id')
      .eq('producto_id', productoId)
      .eq('cliente_id', clienteId)
      .maybeSingle();

    if (existente) {
      return new Response(
        JSON.stringify({ error: 'Ya has reseñado este producto' }),
        { status: 409 }
      );
    }

    // Insertar reseña
    const { data, error } = await supabase
      .from('resenas')
      .insert({
        producto_id: productoId,
        cliente_id: clienteId,
        valoracion,
        comentario: comentario || null,
        foto_url: fotoUrl || null,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ data }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}

// PUT /api/resenas → editar reseña propia
export async function PUT(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const { id, clienteId, valoracion, comentario, fotoUrl } = body;

    if (!id || !clienteId || !valoracion) {
      return new Response(JSON.stringify({ error: 'id, clienteId y valoracion son obligatorios' }), { status: 400 });
    }

    if (valoracion < 1 || valoracion > 5) {
      return new Response(JSON.stringify({ error: 'La valoración debe ser entre 1 y 5' }), { status: 400 });
    }

    // Verificar que la reseña pertenece a este cliente
    const { data: existente } = await supabase
      .from('resenas')
      .select('id, cliente_id')
      .eq('id', id)
      .maybeSingle();

    if (!existente) {
      return new Response(JSON.stringify({ error: 'Reseña no encontrada' }), { status: 404 });
    }

    if (existente.cliente_id !== clienteId) {
      return new Response(JSON.stringify({ error: 'No tienes permiso para editar esta reseña' }), { status: 403 });
    }

    const { data, error } = await supabase
      .from('resenas')
      .update({
        valoracion,
        comentario: comentario || null,
        foto_url: fotoUrl !== undefined ? fotoUrl : undefined,
      })
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
