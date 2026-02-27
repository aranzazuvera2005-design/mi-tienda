import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Supabase service role key not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // Obtener perfiles con sus direcciones
    const { data: perfiles, error: perfilesError } = await supabase
      .from('perfiles')
      .select('*, direcciones(*)')
      .order('nombre', { ascending: true });

    if (perfilesError) throw perfilesError;

    // Intentar obtener usuarios de Auth para ver contraseñas (si están en metadata o si se puede)
    // Nota: Supabase no devuelve contraseñas en texto plano por seguridad.
    // Pero podemos listar usuarios para tener más info si es necesario.
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) console.warn('Error fetching auth users:', authError);

    // Combinar info si es necesario (por ahora devolvemos perfiles)
    const clientesCompletos = perfiles.map(perfil => {
      const authUser = users?.find(u => u.id === perfil.id);
      return {
        ...perfil,
        last_sign_in_at: authUser?.last_sign_in_at,
        // La contraseña no se puede recuperar de Supabase Auth una vez creada.
        // Si el usuario la necesita ver, tendríamos que haberla guardado en una tabla (no recomendado)
        // o mostrar un placeholder.
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

    if (!id) {
      return NextResponse.json({ error: 'ID de cliente es obligatorio' }, { status: 400 });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Supabase service role key not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // 1. Eliminar de Auth (esto debería eliminar en cascada si está configurado, 
    // pero por si acaso lo hacemos manual en las tablas si no hay triggers)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    // 2. Eliminar de perfiles (si no hubo cascada)
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

    if (!id) {
      return NextResponse.json({ error: 'ID de cliente es obligatorio' }, { status: 400 });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Supabase service role key not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // 1. Actualizar en Auth si el email cambió
    if (email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, { email });
      if (authError) throw authError;
    }

    // 2. Actualizar en perfiles
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
