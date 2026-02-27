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
    const clienteId = url.searchParams.get('clienteId');
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(url.searchParams.get('limit') || '10', 10) || 10;

    if (!clienteId) {
      return new Response(JSON.stringify({ error: 'clienteId is required' }), { status: 400 });
    }

    let query = supabase
      .from('devoluciones')
      .select(`
        *,
        pedido:pedidos(id, cliente_id, creado_at, total),
        producto:productos(id, nombre, precio)
      `, { count: 'exact' })
      .order('fecha_solicitud', { ascending: false });

    // Filtrar por cliente a través de la relación con pedidos
    query = query.eq('pedido.cliente_id', clienteId);

    const fromIndex = (page - 1) * limit;
    const toIndex = page * limit - 1;

    query = query.range(fromIndex, toIndex);

    const { data, error, count } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ data: data || [], count: count ?? (data || []).length }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const { pedidoId, productoId, cantidad, motivo, clienteId } = body;

    // Validaciones
    if (!pedidoId || !productoId || !cantidad || !clienteId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Verificar que el pedido pertenece al cliente
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, cliente_id, creado_at')
      .eq('id', pedidoId)
      .eq('cliente_id', clienteId)
      .single();

    if (pedidoError || !pedido) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado o no pertenece al cliente' }), { status: 403 });
    }

    // Verificar que no hayan pasado 30 días
    const fechaPedido = new Date(pedido.creado_at);
    const ahora = new Date();
    const diasTranscurridos = Math.floor((ahora.getTime() - fechaPedido.getTime()) / (1000 * 60 * 60 * 24));

    if (diasTranscurridos > 30) {
      return new Response(JSON.stringify({ error: 'El plazo de 30 días para solicitar devoluciones ha expirado' }), { status: 400 });
    }

    // Calcular fecha límite
    const fechaLimite = new Date(pedido.creado_at);
    fechaLimite.setDate(fechaLimite.getDate() + 30);

    // Verificar si ya existe una devolución para este producto en este pedido
    const { data: existente } = await supabase
      .from('devoluciones')
      .select('id')
      .eq('pedido_id', pedidoId)
      .eq('producto_id', productoId)
      .eq('estado', 'Pendiente')
      .single();

    if (existente) {
      return new Response(JSON.stringify({ error: 'Ya existe una solicitud de devolución pendiente para este producto' }), { status: 400 });
    }

    // Crear devolución
    const { data, error } = await supabase
      .from('devoluciones')
      .insert({
        pedido_id: pedidoId,
        producto_id: productoId,
        cantidad,
        motivo: motivo || 'No especificado',
        estado: 'Pendiente',
        fecha_limite: fechaLimite.toISOString()
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
