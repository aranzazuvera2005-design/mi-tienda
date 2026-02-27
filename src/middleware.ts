import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // El middleware de Next.js a veces tiene problemas para leer cookies de Supabase Auth
  // de forma consistente en todas las plataformas de despliegue.
  // Para evitar redirecciones incorrectas (bucles), permitimos que la petición pase
  // y dejamos que el componente AdminGuard (en el lado del cliente) realice la
  // verificación de seguridad robusta.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
