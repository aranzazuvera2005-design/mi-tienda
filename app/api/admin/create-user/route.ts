import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    // 1. Verificación robusta de variables de entorno
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ 
        error: 'Error de configuración en el servidor', 
        details: 'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel.' 
      }, { status: 500 });
    }

    const body = await req.json();
    const { nombre, email, password, telefono, direccion } = body || {};

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y password son obligatorios' }, { status: 400 });
    }

    // Cliente con privilegios de administrador (Service Role)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // 2. Crear el usuario en el sistema de Autenticación
    const { data: userData, error: signError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre } // Metadata útil para recuperación
    });

    if (signError) {
      const isRegistered = signError.message.includes('already been registered');
      return NextResponse.json({ 
        error: isRegistered ? 'Este correo ya está registrado.' : signError.message 
      }, { status: isRegistered ? 400 : 500 });
    }

    const userId = userData.user.id;

    // 3. Insertar el perfil en la tabla 'perfiles' (Ajustado a tu esquema real)
    const profileDataToInsert = { 
      id: userId, 
      nombre, 
      email, 
      telefono: telefono || null, 
      direccion: direccion || null,
      rol: 'usuario', // Aseguramos el rol por defecto de tu tabla
      updated_at: new Date().toISOString()
    };

    const { data: profileData, error: profileError } = await supabase
      .from('perfiles')
      .insert([profileDataToInsert])
      .select()
      .single();

    if (profileError) {
      console.error('CRITICAL DATABASE ERROR (perfiles):', profileError);
      
      // Limpieza: Si el perfil falla, borramos el usuario de Auth para permitir reintentos
      await supabase.auth.admin.deleteUser(userId);
      
      return NextResponse.json({ 
        error: 'Database error creating profile',
        message: profileError.message,
        details: profileError.hint || 'Verifica nombres de columnas y políticas RLS.'
      }, { status: 500 });
    }

    // 4. Insertar dirección en tabla independiente (Opcional, no bloquea el éxito total)
    if (direccion) {
      const { error: dirError } = await supabase
        .from('direcciones')
        .insert([{
          cliente_id: userId,
          calle: direccion,
          es_principal: true
        }]);
      
      if (dirError) console.warn('Aviso: No se pudo guardar en tabla direcciones:', dirError.message);
    }

    // Éxito total
    return NextResponse.json({ 
      success: true,
      user: userData.user, 
      perfil: profileData,
      message: 'Cuenta creada y configurada correctamente.'
    });

  } catch (err: any) {
    console.error('UNEXPECTED API ERROR:', err);
    return NextResponse.json({ error: 'Error interno del servidor', details: err.message }, { status: 500 });
  }
}
