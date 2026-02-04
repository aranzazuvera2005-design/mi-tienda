import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Supabase service role key not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { nombre, email, password, telefono, direccion } = body || {};

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'nombre, email y password son obligatorios' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // Create Auth user using service role key
    const { data: userData, error: signError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    } as any);

    if (signError) {
      return NextResponse.json({ error: signError.message || signError }, { status: 500 });
    }

    const userId = (userData as any)?.id;

    // Insert profile linked to user id
    const profile = { id: userId, nombre, email, telefono: telefono || null, direccion: direccion || null };
    const { data: profileData, error: profileError } = await supabase.from('perfiles').insert(profile).select().single();
    if (profileError) {
      // attempt to cleanup user
      try { await supabase.auth.admin.deleteUser(userId); } catch (_) {}
      return NextResponse.json({ error: profileError.message || profileError }, { status: 500 });
    }

    return NextResponse.json({ user: userData, perfil: profileData });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
