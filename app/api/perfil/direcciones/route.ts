import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ 
        error: 'Error de configuración: Faltan variables SERVICE_ROLE' 
      }, { status: 500 });
    }

    const body = await req.json();
    const { userId, email, nombre, calle, ciudad, cp, esPrincipal } = body;

    // Cliente con SERVICE_ROLE para asegurar que podemos escribir en 'perfiles'
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. UPSERT del Perfil: Si no existe en 'perfiles', lo crea. Si existe, lo ignora.
    // Esto garantiza que la FK de direcciones siempre tenga un padre.
    const { error: perfilError } = await supabase
      .from('perfiles')
      .upsert({
        id: userId,
        email: email,
        nombre: nombre || email?.split('@')[0],
        rol: 'usuario',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (perfilError) throw new Error(`Error Perfil: ${perfilError.message}`);

    // 2. Insertar la dirección vinculada a 'perfiles'
    const { data: nuevaDireccion, error: dirError } = await supabase
      .from('direcciones')
      .insert([{
        cliente_id: userId, // Vincula a perfiles.id
        calle,
        ciudad,
        cp,
        es_principal: esPrincipal
      }])
      .select()
      .single();

    if (dirError) throw new Error(`Error Dirección: ${dirError.message}`);

    return NextResponse.json({ success: true, data: nuevaDireccion });

  } catch (err: any) {
    console.error('API ERROR:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
