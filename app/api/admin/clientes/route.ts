import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: "Faltan variables de entorno SERVICE_ROLE" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // 1. Obtener perfiles incluyendo la relación con direcciones
    // Importante: direcciones(*) usa la FK definida en el schema
    const { data: perfiles, error: perfilesError } = await supabase
      .from('perfiles')
      .select('*, direcciones(*)')
      .order('nombre', { ascending: true });

    if (perfilesError) throw perfilesError;

    // 2. Obtener usuarios de Auth para sincronizar emails y metadatos
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    const users = authData?.users || [];
    
    // 3. Combinación de datos
    const clientesCompletos = (perfiles || []).map(perfil => {
      const authUser = users.find(u => u.id === perfil.id);
      return {
        ...perfil,
        email: perfil.email || authUser?.email,
        last_sign_in_at: authUser?.last_sign_in_at,
        password_placeholder: '********' 
      };
    });

    return NextResponse.json(clientesCompletos);
  } catch (err: any) {
    console.error('API GET Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE!, { auth: { persistSession: false } });

    // Eliminar en cascada manual (Auth -> Perfil -> Direcciones)
    await supabase.auth.admin.deleteUser(id);
    await supabase.from('perfiles').delete().eq('id', id);
    await supabase.from('direcciones').delete().eq('cliente_id', id);

    return NextResponse.json({ message: 'Eliminado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nombre, email, telefono, rol } = body;

    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE!, { auth: { persistSession: false } });

    if (email) await supabase.auth.admin.updateUserById(id, { email });

    const { error: profileError } = await supabase
      .from('perfiles')
      .update({
        nombre,
        email,
        telefono,
        rol,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (profileError) throw profileError;
    return NextResponse.json({ message: 'Actualizado' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
