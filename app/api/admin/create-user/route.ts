import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      const missing = [];
      if (!SUPABASE_URL) missing.push('SUPABASE_URL');
      if (!SERVICE_ROLE) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ 
        error: `Faltan variables de entorno: ${missing.join(', ')}`,
        details: 'Asegúrate de configurarlas en el panel de Vercel.'
      }, { status: 500 });
    }

    const body = await req.json();
    const { nombre, email, password, telefono, direccion } = body || {};

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'nombre, email y password son obligatorios' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // 1. Verificar si el email ya existe en Auth (Supabase lo hace automáticamente al crear)
    // No podemos verificar en 'perfiles' por email si la columna no existe.

    // 2. Intentar crear el usuario en Auth
    const { data: userData, error: signError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    } as any);

    if (signError) {
      if (signError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Este correo ya está registrado en el sistema de autenticación.' }, { status: 400 });
      }
      return NextResponse.json({ error: signError.message || signError }, { status: 500 });
    }

    const userId = (userData as any).user?.id || (userData as any).id;

    // 3. Insertar el perfil (con manejo de errores detallado)
    const profile: any = { 
      id: userId, 
      nombre,
      updated_at: new Date().toISOString()
    };
    
    // Solo añadimos campos si no son undefined para evitar errores de esquema
    if (email) profile.email = email;
    if (telefono) profile.telefono = telefono;
    if (direccion) profile.direccion = direccion;

    const { data: profileData, error: profileError } = await supabase
      .from('perfiles')
      .insert(profile)
      .select();

    if (profileError) {
      console.error('CRITICAL DATABASE ERROR:', profileError);
      // Intentamos borrar el usuario de auth para no dejar basura si falla el perfil
      try { await supabase.auth.admin.deleteUser(userId); } catch (e) { console.error('Failed to cleanup auth user:', e); }
      
      return NextResponse.json({ 
        error: `Error de base de datos: ${profileError.message}`,
        details: profileError,
        hint: "Verifica que la tabla 'perfiles' tenga las columnas correctas y que el SERVICE_ROLE tenga permisos."
      }, { status: 500 });
    }

    // 4. Insertar la dirección inicial en la tabla 'direcciones'
    if (direccion) {
      const { error: dirError } = await supabase
        .from('direcciones')
        .insert({
          cliente_id: userId,
          calle: direccion,
          es_principal: true
        });
      
      if (dirError) {
        console.warn('Error al crear la dirección inicial:', dirError);
      }
    }

    return NextResponse.json({ 
      user: userData, 
      perfil: profileData,
      message: 'Cliente creado correctamente con su dirección inicial'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
