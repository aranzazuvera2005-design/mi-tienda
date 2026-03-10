import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  try {
    // Leer la sesión del usuario desde las cookies del servidor
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ isAdmin: false, reason: 'no_session' }, { status: 401 });
    }

    // Usar service role para evitar problemas de RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('rol, nombre')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil) {
      console.error('[check-rol] Error al obtener perfil:', perfilError, 'userId:', user.id);
      return NextResponse.json({ isAdmin: false, reason: 'no_perfil' }, { status: 403 });
    }

    const isAdmin = perfil.rol === 'admin' || perfil.rol === 'administrador';

    return NextResponse.json({
      isAdmin,
      rol: perfil.rol,
      nombre: perfil.nombre,
      userId: user.id
    });

  } catch (err: any) {
    console.error('[check-rol] Error general:', err);
    return NextResponse.json({ isAdmin: false, reason: err.message }, { status: 500 });
  }
}
