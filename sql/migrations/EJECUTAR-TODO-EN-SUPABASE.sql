-- ================================================================
-- EJECUTAR ESTO EN SUPABASE → SQL EDITOR (de una vez)
-- ================================================================

-- 1. Función helper para ejecutar SQL dinámico (necesaria para la API de setup)
CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN EXECUTE sql; END; $$;

-- 2. Columnas de precio/descuento en productos
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_tachado NUMERIC,
  ADD COLUMN IF NOT EXISTS descuento_pct  NUMERIC,
  ADD COLUMN IF NOT EXISTS descripcion_larga TEXT;

-- 3. Columnas extra en variantes
ALTER TABLE variantes
  ADD COLUMN IF NOT EXISTS imagen_url TEXT,
  ADD COLUMN IF NOT EXISTS etiqueta   VARCHAR(10),
  ADD COLUMN IF NOT EXISTS meta       JSONB;

-- 4. Tipos de variante personalizados
CREATE TABLE IF NOT EXISTS tipos_variante (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  tipo_input   TEXT NOT NULL DEFAULT 'selector',
  es_requerido BOOLEAN DEFAULT false,
  orden        INT DEFAULT 0,
  activo       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Valores por tipo
CREATE TABLE IF NOT EXISTS valores_variante (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_id      UUID NOT NULL REFERENCES tipos_variante(id) ON DELETE CASCADE,
  valor        TEXT NOT NULL,
  etiqueta     VARCHAR(10),
  imagen_url   TEXT,
  precio_extra NUMERIC DEFAULT 0,
  activo       BOOLEAN DEFAULT true,
  orden        INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Relación producto ↔ tipos asignados
CREATE TABLE IF NOT EXISTS producto_variantes (
  producto_id UUID NOT NULL,
  tipo_id     UUID NOT NULL REFERENCES tipos_variante(id) ON DELETE CASCADE,
  PRIMARY KEY (producto_id, tipo_id)
);

-- 7. Columnas de variantes en líneas de pedido
ALTER TABLE lineas_pedido
  ADD COLUMN IF NOT EXISTS variantes_seleccionadas JSONB,
  ADD COLUMN IF NOT EXISTS personalizacion          TEXT;

-- ================================================================
-- FIN — todo listo
-- ================================================================
