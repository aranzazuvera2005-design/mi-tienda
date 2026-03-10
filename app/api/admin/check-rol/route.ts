import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: Request) {
  try {
    // Leer token del header Authorization
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ isAdmin: false, reason: 'no_token' }, { status: 401 });
    }

    // Verificar el token con service role
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ isAdmin: false, reason: 'invalid_token' }, { status: 401 });
    }

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
