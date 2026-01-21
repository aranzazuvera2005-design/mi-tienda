import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
      console.error('Error: Faltan variables de entorno de Supabase (URL o ANON_KEY)');
      return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 });
    }

    if (!supabaseUrl.startsWith('http')) {
      console.error('Error crítico: NEXT_PUBLIC_SUPABASE_URL en .env debe comenzar con https://');
      return NextResponse.json({ error: 'Configuración de URL inválida' }, { status: 500 });
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
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    // Devolvemos 'items' y 'count' que es lo que espera tu componente SearchProductos
    return NextResponse.json({ items: data, count });
  } catch (e: any) {
    console.error('Error inesperado en API search:', e);
    return NextResponse.json({ error: e.message || 'Error interno del servidor' }, { status: 500 });
  }
}