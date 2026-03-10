import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ 
        error: 'Error de configuración en el servidor', 
        details: 'Faltan variables de entorno críticas.' 
      }, { status: 500 });
    }

    const body = await req.json();
    const { userId, email, nombre, calle, ciudad, cp, esPrincipal } = body || {};

    if (!userId || !calle) {
      return NextResponse.json({ error: 'ID de usuario y calle son obligatorios' }, { status: 400 });
    }

    // Cliente con Service Role para saltar RLS y asegurar la creación del perfil
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    // 1. Verificar si el perfil existe en la tabla 'perfiles'
    const { data: perfilExistente, error: errorPerfil } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', userId)
      .single();

    // 2. Si el perfil no existe, lo creamos automáticamente (Upsert/Creación Automática)
    if (errorPerfil || !perfilExistente) {
      console.log(`Perfil no encontrado para ${userId}, creando automáticamente...`);
      
      const { error: createProfileError } = await supabase
        .from('perfiles')
        .insert([{
          id: userId,
          email: email || null,
          nombre: nombre || email?.split('@')[0] || 'Usuario',
          rol: 'usuario',
          updated_at: new Date().toISOString()
        }]);

      if (createProfileError) {
        console.error('Error al crear perfil automático:', createProfileError);
        return NextResponse.json({ 
          error: 'No se pudo crear el perfil de usuario necesario.',
          details: createProfileError.message 
        }, { status: 500 });
      }
    }

    // 3. Insertar la dirección en la tabla 'direcciones'
    // El error 23503 ya no debería ocurrir porque el perfil ya existe
    const { data: nuevaDireccion, error: dirError } = await supabase
      .from('direcciones')
      .insert([{
        cliente_id: userId,
        calle,
        ciudad: ciudad || null,
        cp: cp || null,
        es_principal: esPrincipal || false
      }])
      .select()
      .single();

    if (dirError) {
      console.error('Error al insertar dirección:', dirError);
      return NextResponse.json({ 
        error: 'Error al guardar la dirección en la base de datos.',
        details: dirError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      direccion: nuevaDireccion,
      message: 'Dirección guardada correctamente.'
    });

  } catch (err: any) {
    console.error('UNEXPECTED API ERROR (direcciones):', err);
    return NextResponse.json({ error: 'Error interno del servidor', details: err.message }, { status: 500 });
  }
}
