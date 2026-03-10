import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // Verificar que el email existe (sin revelar si existe o no al cliente por seguridad)
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!perfil) {
      // Respuesta genérica por seguridad, no revelar si el email existe
      return NextResponse.json({ ok: true });
    }

    // Determinar la URL base — prioridad:
    // 1. Variable explícita NEXT_PUBLIC_SITE_URL (configurar en Vercel)
    // 2. VERCEL_PROJECT_PRODUCTION_URL (URL canónica de producción, sin preview)
    // 3. VERCEL_URL (URL del deploy actual, puede ser preview)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Enviar email de reset con enlace seguro de Supabase Auth
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/login?reset=1`
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[reset-password]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
