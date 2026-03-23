import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Error de configuración en el servidor' }, { status: 500 });
    }

    // Verificar token del usuario autenticado
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const supabaseAuth = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, email, nombre, telefono, direccion, cart, totalPedido } = body || {};

    if (!userId || !cart || cart.length === 0) {
      return NextResponse.json({ error: 'Datos del pedido incompletos' }, { status: 400 });
    }

    // Verificar que userId coincide con el usuario autenticado
    if (user.id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // 1. Verificar/Crear Perfil (Upsert)
    const { data: perfilExistente, error: errorPerfil } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (errorPerfil || !perfilExistente) {
      const { error: createProfileError } = await supabase
        .from('perfiles')
        .insert([{
          id: userId,
          email: email || null,
          nombre: nombre || email?.split('@')[0] || 'Usuario',
          telefono: telefono || null,
          rol: 'usuario',
          updated_at: new Date().toISOString()
        }]);

      if (createProfileError) {
        throw new Error(`Error al crear perfil automático: ${createProfileError.message}`);
      }
    } else {
      // Actualizar nombre y teléfono si han cambiado
      await supabase
        .from('perfiles')
        .update({ nombre, telefono, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    // 2. Crear el pedido
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([{
        cliente_id: userId,
        total: totalPedido,
        estado: 'pagado',
        articulos: cart,
        direccion_entrega: direccion,
      }])
      .select('id')
      .single();

    if (pedidoError) {
      throw new Error(`Error al crear el pedido: ${pedidoError.message}`);
    }

    // 3. Crear líneas de pedido
    const lineasPedido = cart.map((item: any) => ({
      pedido_id: pedidoData.id,
      producto_id: item.id,
      cantidad: item.cantidad || 1,
      precio_unitario_historico: Number(item.precio || 0),
      variantes_seleccionadas: item.variantesSeleccionadas || null,
      personalizacion: item.personalizacion || null,
    }));

    const { error: lineasError } = await supabase
      .from('lineas_pedido')
      .insert(lineasPedido);

    if (lineasError) {
      throw new Error(`Error al crear las líneas del pedido: ${lineasError.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      pedidoId: pedidoData.id,
      message: 'Pedido procesado correctamente.'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
