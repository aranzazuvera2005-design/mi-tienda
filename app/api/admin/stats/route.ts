import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Configuración de Supabase faltante' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // 1. Obtener todos los pedidos para calcular métricas
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('total, creado_at, estado');

    if (pedidosError) throw pedidosError;

    // 2. Obtener líneas de pedido para productos más vendidos
    const { data: lineas, error: lineasError } = await supabase
      .from('lineas_pedido')
      .select('cantidad, producto:productos(nombre)');

    if (lineasError) throw lineasError;

    // 3. Calcular métricas básicas
    const totalVentasEuros = pedidos?.reduce((acc, p) => acc + (Number(p.total) || 0), 0) || 0;
    const totalPedidos = pedidos?.length || 0;
    const ticketMedio = totalPedidos > 0 ? totalVentasEuros / totalPedidos : 0;

    // 4. Ventas de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const pedidosHoy = pedidos?.filter(p => new Date(p.creado_at) >= hoy) || [];
    const ventasHoy = pedidosHoy.reduce((acc, p) => acc + (Number(p.total) || 0), 0);

    // 5. Productos más vendidos
    const productosMap: Record<string, number> = {};
    lineas?.forEach(l => {
      const nombre = (l.producto as any)?.nombre || 'Producto desconocido';
      productosMap[nombre] = (productosMap[nombre] || 0) + (l.cantidad || 0);
    });

    const topProductos = Object.entries(productosMap)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    return NextResponse.json({
      totalVentasEuros,
      totalPedidos,
      ticketMedio,
      ventasHoy,
      pedidosHoy: pedidosHoy.length,
      topProductos
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
