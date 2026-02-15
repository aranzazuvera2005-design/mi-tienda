import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // Calcular rango para paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    // Verificar variables de entorno
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Faltan variables de entorno de Supabase (URL o ANON_KEY); devolviendo resultados vacíos.');
      return NextResponse.json({ items: [], count: 0, warning: 'Supabase not configured' }, { status: 200 });
    }

    if (!supabaseUrl.startsWith('http')) {
      console.warn('NEXT_PUBLIC_SUPABASE_URL no comienza con http(s); devolviendo resultados vacíos.');
      return NextResponse.json({ items: [], count: 0, warning: 'Invalid Supabase URL' }, { status: 200 });
    }

    // Cliente de Supabase para el servidor (usamos ANON_KEY para búsquedas públicas)
    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    let query = supabase
      .from('productos')
      .select('*, familias(nombre)', { count: 'exact' });

    if (q) {
      // Búsqueda en nombre, descripción y categoría
      query = query.or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%,categoria.ilike.%${q}%`);
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error en la consulta a Supabase:', error);
      // Si es un error de red (fetch failed / DNS), devolver resultados vacíos en lugar de 500
      const msg = String(error.message || '');
      if (msg.includes('fetch failed') || msg.includes('getaddrinfo') || msg.includes('ENOTFOUND')) {
        return NextResponse.json({ items: [], count: 0, warning: 'Supabase unavailable' }, { status: 200 });
      }
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    // Devolvemos 'items' y 'count' que es lo que espera tu componente SearchProductos
    return NextResponse.json({ items: data, count });
  } catch (e: any) {
    console.error('Error inesperado en API search:', e);
    const msg = String(e?.message || '');
    if (msg.includes('fetch failed') || msg.includes('getaddrinfo') || msg.includes('ENOTFOUND')) {
      return NextResponse.json({ items: [], count: 0, warning: 'Supabase unavailable' }, { status: 200 });
    }
    return NextResponse.json({ error: e.message || 'Error interno del servidor' }, { status: 500 });
  }
}