import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase config' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    // Perfiles
    const { data: perfiles } = await supabase
      .from('perfiles')
      .select('id, nombre, email, telefono');

    // Todos los pedidos
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, cliente_id, total, articulos, creado_at, estado');

    // Todas las devoluciones
    const { data: devoluciones } = await supabase
      .from('devoluciones')
      .select('id, cliente_id, estado, creado_at');

    const pedidosArr = pedidos || [];
    const devolucionesArr = devoluciones || [];

    const clientes = (perfiles || []).map(p => {
      const misPedidos = pedidosArr.filter(x => x.cliente_id === p.id);
      const misDevs = devolucionesArr.filter(x => x.cliente_id === p.id);

      const totalVentas = misPedidos.reduce((acc, x) => acc + Number(x.total || 0), 0);
      const totalArticulos = misPedidos.reduce((acc, x) => {
        const arts = Array.isArray(x.articulos) ? x.articulos : [];
        return acc + arts.reduce((s: number, a: any) => s + (Number(a.cantidad) || 1), 0);
      }, 0);
      const ticketMedio = misPedidos.length > 0 ? totalVentas / misPedidos.length : 0;
      const ultimaCompra = misPedidos.length > 0
        ? misPedidos.sort((a, b) => new Date(b.creado_at).getTime() - new Date(a.creado_at).getTime())[0].creado_at
        : null;

      // Top productos comprados
      const productosMap: Record<string, { nombre: string; cantidad: number; total: number }> = {};
      misPedidos.forEach(ped => {
        (Array.isArray(ped.articulos) ? ped.articulos : []).forEach((a: any) => {
          const key = a.nombre || 'Desconocido';
          if (!productosMap[key]) productosMap[key] = { nombre: key, cantidad: 0, total: 0 };
          productosMap[key].cantidad += Number(a.cantidad) || 1;
          productosMap[key].total += (Number(a.precio) || 0) * (Number(a.cantidad) || 1);
        });
      });
      const topProductos = Object.values(productosMap)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 3);

      return {
        id: p.id,
        nombre: p.nombre || 'Sin nombre',
        email: p.email || '',
        telefono: p.telefono || '',
        totalPedidos: misPedidos.length,
        totalArticulos,
        totalVentas,
        ticketMedio,
        totalDevoluciones: misDevs.length,
        ultimaCompra,
        topProductos,
        esFrecuente: misPedidos.length >= 3,
        pedidos: misPedidos.sort((a, b) => new Date(b.creado_at).getTime() - new Date(a.creado_at).getTime()),
      };
    });

    // Ordenar por ventas desc por defecto
    clientes.sort((a, b) => b.totalVentas - a.totalVentas);

    return new Response(JSON.stringify(clientes), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
