import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ isAdmin: false, reason: 'no_token' }, { status: 401 });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ isAdmin: false, reason: 'missing_env' }, { status: 500 });
    }

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
      return NextResponse.json({ isAdmin: false, reason: 'no_perfil' }, { status: 403 });
    }

    const isAdmin = perfil.rol === 'admin' || perfil.rol === 'administrador';

    return NextResponse.json({
      isAdmin,
      rol: perfil.rol,
      nombre: perfil.nombre,
      userId: user.id
    });

  } catch {
    return NextResponse.json({ isAdmin: false, reason: 'error' }, { status: 500 });
  }
}
