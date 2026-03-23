import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Verifica que la petición viene de un administrador autenticado.
 * Lee el token del header Authorization: Bearer <token>
 * Retorna { userId } si es válido, o un NextResponse 401/403 si no.
 */
export async function requireAdmin(req: Request): Promise<{ userId: string } | NextResponse> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();

  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'administrador')) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  return { userId: user.id };
}

/** Comprueba si el resultado de requireAdmin es un error (NextResponse) */
export function isAuthError(result: { userId: string } | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
