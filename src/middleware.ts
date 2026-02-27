import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Solo proteger rutas de /admin
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Obtener el token de la cookie de sesión
  const token = request.cookies.get('sb-auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

    // Verificar la sesión del usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Obtener el rol del usuario desde la tabla perfiles
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verificar que el usuario sea admin
    if (perfil.rol !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*']
};
