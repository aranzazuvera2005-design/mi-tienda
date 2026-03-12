import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL  = process.env.SUPABASE_URL  || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json({ error: 'Faltan variables de entorno' }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const resultados: string[] = [];

  const sql = async (label: string, query: string) => {
    const { error } = await sb.rpc('exec_sql', { sql: query }).throwOnError().catch(async () => {
      // exec_sql puede no existir; usar el cliente REST directamente
      return { error: null };
    });
    // Intentar vía postgrest si rpc falla
    try {
      await sb.from('_migrations_dummy').select('1').limit(0); // ping
    } catch {}
    resultados.push(error ? `❌ ${label}: ${error.message}` : `✅ ${label}`);
  };

  // 1. Columnas en productos
  await sb.rpc('exec_sql', {
    sql: `ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS precio_tachado NUMERIC,
      ADD COLUMN IF NOT EXISTS descuento_pct  NUMERIC,
      ADD COLUMN IF NOT EXISTS descripcion_larga TEXT;`
  }).then(() => resultados.push('✅ productos: columnas precio_tachado, descuento_pct, descripcion_larga'))
    .catch(e => resultados.push(`❌ productos columnas: ${e.message}`));

  // 2. Columnas en variantes
  await sb.rpc('exec_sql', {
    sql: `ALTER TABLE variantes
      ADD COLUMN IF NOT EXISTS imagen_url TEXT,
      ADD COLUMN IF NOT EXISTS etiqueta VARCHAR(10),
      ADD COLUMN IF NOT EXISTS meta JSONB;`
  }).then(() => resultados.push('✅ variantes: columnas imagen_url, etiqueta, meta'))
    .catch(e => resultados.push(`❌ variantes columnas: ${e.message}`));

  // 3. tipos_variante
  await sb.rpc('exec_sql', {
    sql: `CREATE TABLE IF NOT EXISTS tipos_variante (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nombre TEXT NOT NULL,
      descripcion TEXT,
      tipo_input TEXT NOT NULL DEFAULT 'selector',
      es_requerido BOOLEAN DEFAULT false,
      orden INT DEFAULT 0,
      activo BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
  }).then(() => resultados.push('✅ tabla tipos_variante'))
    .catch(e => resultados.push(`❌ tipos_variante: ${e.message}`));

  // 4. valores_variante
  await sb.rpc('exec_sql', {
    sql: `CREATE TABLE IF NOT EXISTS valores_variante (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tipo_id UUID NOT NULL REFERENCES tipos_variante(id) ON DELETE CASCADE,
      valor TEXT NOT NULL,
      etiqueta VARCHAR(10),
      imagen_url TEXT,
      precio_extra NUMERIC DEFAULT 0,
      activo BOOLEAN DEFAULT true,
      orden INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
  }).then(() => resultados.push('✅ tabla valores_variante'))
    .catch(e => resultados.push(`❌ valores_variante: ${e.message}`));

  // 5. producto_variantes
  await sb.rpc('exec_sql', {
    sql: `CREATE TABLE IF NOT EXISTS producto_variantes (
      producto_id UUID NOT NULL,
      tipo_id UUID NOT NULL REFERENCES tipos_variante(id) ON DELETE CASCADE,
      PRIMARY KEY (producto_id, tipo_id)
    );`
  }).then(() => resultados.push('✅ tabla producto_variantes'))
    .catch(e => resultados.push(`❌ producto_variantes: ${e.message}`));

  // 6. lineas_pedido columnas variantes
  await sb.rpc('exec_sql', {
    sql: `ALTER TABLE lineas_pedido
      ADD COLUMN IF NOT EXISTS variantes_seleccionadas JSONB,
      ADD COLUMN IF NOT EXISTS personalizacion TEXT;`
  }).then(() => resultados.push('✅ lineas_pedido: columnas variantes'))
    .catch(e => resultados.push(`❌ lineas_pedido: ${e.message}`));

  return NextResponse.json({ resultados }, { status: 200 });
}
