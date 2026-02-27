import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ 
        error: "Faltan variables de entorno en Vercel",
        details: "Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
      }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // 1. Obtener perfiles
    let { data: perfiles, error: perfilesError } = await supabase
      .from('perfiles')
      .select('*, direcciones(*)')
      .order('nombre', { ascending: true });

    // Reintento si falla la relación
    if (perfilesError && perfilesError.message.includes('relationship')) {
      const { data: soloPerfiles, error: soloPerfilesError } = await supabase
        .from('perfiles')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (soloPerfilesError) throw soloPerfilesError;
      perfiles = soloPerfiles;
    } else if (perfilesError) {
      throw perfilesError;
    }

    // 2. Obtener usuarios de Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    const users = authData?.users || [];
    
    if (authError) console.warn('Error fetching auth users:', authError);

    // 3. Combinación segura (Aquí estaba el error de Vercel)
    // Usamos (perfiles || []) para asegurar que nunca sea null
    const clientesCompletos = (perfiles || []).map(perfil => {
      const authUser = users.find(u => u.id === perfil.id);
      return {
        ...perfil,
        last_sign_in_at: authUser?.last_sign_in_at,
        password_placeholder: '********' 
      };
    });

    return NextResponse.json(clientesCompletos);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'ID faltante o error de configuración' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    await supabase.from('perfiles').delete().eq('id', id);
    await supabase.from('direcciones').delete().eq('cliente_id', id);

    return NextResponse.json({ message: 'Cliente eliminado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nombre, email, telefono, direccion } = body || {};

    if (!id || !SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'ID faltante o error de configuración' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    if (email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, { email });
      if (authError) throw authError;
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (direccion !== undefined) updateData.direccion = direccion;

    const { error: profileError } = await supabase
      .from('perfiles')
      .update(updateData)
      .eq('id', id);

    if (profileError) throw profileError;

    return NextResponse.json({ message: 'Cliente actualizado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
