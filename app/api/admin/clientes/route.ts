import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
  auth: { persistSession: false }
});

export async function GET() {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error('[admin/clientes] Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 });
    }

    const { data: perfiles, error: perfilesError } = await supabaseAdmin
      .from('perfiles')
      .select('*, direcciones!direcciones_cliente_id_fkey(*)')
      .order('nombre', { ascending: true });

    if (perfilesError) {
      console.error('[admin/clientes] Error al consultar perfiles:', perfilesError);
      throw perfilesError;
    }

    console.log(`[admin/clientes] Perfiles encontrados: ${perfiles?.length ?? 0}`);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      console.error('[admin/clientes] Error al listar usuarios auth:', authError);
    }
    const users = authData?.users || [];
    
    const clientesCompletos = (perfiles || []).map(perfil => {
      const authUser = users.find(u => u.id === perfil.id);
      return {
        ...perfil,
        email: perfil.email || authUser?.email,
        password_placeholder: '********' 
      };
    });

    return NextResponse.json(clientesCompletos);
  } catch (err: any) {
    console.error('[admin/clientes] Error general:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nombre, email, telefono, rol, password } = body;

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    // 1. Si hay password, actualizar en Auth
    if (password && password.trim().length >= 6) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: password.trim()
      });
      if (authError) throw authError;
    }

    // 2. Actualizar datos en tabla Perfiles
    const { error: profileError } = await supabaseAdmin
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

    return NextResponse.json({ message: 'Actualizado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await supabaseAdmin.auth.admin.deleteUser(id);
    await supabaseAdmin.from('perfiles').delete().eq('id', id);

    return NextResponse.json({ message: 'Borrado con éxito' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
