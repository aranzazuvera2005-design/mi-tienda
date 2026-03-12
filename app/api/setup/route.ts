import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sb: any, label: string, query: string): Promise<string> {
  try {
    await sb.rpc('exec_sql', { sql: query });
    return `✅ ${label}`;
  } catch (e: any) {
    return `❌ ${label}: ${e?.message || e}`;
  }
}

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json({ error: 'Faltan variables de entorno' }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const resultados: string[] = [];

  resultados.push(await runSQL(sb, 'productos: precio_tachado, descuento_pct, descripcion_larga',
    `ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS precio_tachado NUMERIC,
      ADD COLUMN IF NOT EXISTS descuento_pct  NUMERIC,
      ADD COLUMN IF NOT EXISTS descripcion_larga TEXT;`));

  resultados.push(await runSQL(sb, 'variantes: imagen_url, etiqueta, meta',
    `ALTER TABLE variantes
      ADD COLUMN IF NOT EXISTS imagen_url TEXT,
      ADD COLUMN IF NOT EXISTS etiqueta   VARCHAR(10),
      ADD COLUMN IF NOT EXISTS meta       JSONB;`));

  resultados.push(await runSQL(sb, 'tabla tipos_variante',
    `CREATE TABLE IF NOT EXISTS tipos_variante (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nombre TEXT NOT NULL, descripcion TEXT,
      tipo_input TEXT NOT NULL DEFAULT 'selector',
      es_requerido BOOLEAN DEFAULT false,
      orden INT DEFAULT 0, activo BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`));

  resultados.push(await runSQL(sb, 'tabla valores_variante',
    `CREATE TABLE IF NOT EXISTS valores_variante (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tipo_id UUID NOT NULL REFERENCES tipos_variante(id) ON DELETE CASCADE,
      valor TEXT NOT NULL, etiqueta VARCHAR(10), imagen_url TEXT,
      precio_extra NUMERIC DEFAULT 0, activo BOOLEAN DEFAULT true,
      orden INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
    );`));

  resultados.push(await runSQL(sb, 'tabla producto_variantes',
    `CREATE TABLE IF NOT EXISTS producto_variantes (
      producto_id UUID NOT NULL,
      tipo_id UUID NOT NULL REFERENCES tipos_variante(id) ON DELETE CASCADE,
      PRIMARY KEY (producto_id, tipo_id)
    );`));

  resultados.push(await runSQL(sb, 'lineas_pedido: variantes_seleccionadas, personalizacion',
    `ALTER TABLE lineas_pedido
      ADD COLUMN IF NOT EXISTS variantes_seleccionadas JSONB,
      ADD COLUMN IF NOT EXISTS personalizacion TEXT;`));

  return NextResponse.json({ resultados });
}
