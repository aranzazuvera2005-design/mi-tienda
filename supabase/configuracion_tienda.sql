-- ⚠️  EJECUTAR EN SUPABASE SQL EDITOR
-- Tabla de configuración general de la tienda (clave-valor JSON)

CREATE TABLE IF NOT EXISTS configuracion_tienda (
  clave       TEXT PRIMARY KEY,
  valor       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE configuracion_tienda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_select" ON configuracion_tienda;
DROP POLICY IF EXISTS "config_upsert" ON configuracion_tienda;

-- Lectura pública (la tienda puede mostrar horarios, contacto, etc.)
CREATE POLICY "config_select" ON configuracion_tienda FOR SELECT USING (true);
-- Escritura solo admin autenticado
CREATE POLICY "config_upsert" ON configuracion_tienda FOR ALL USING (auth.role() = 'authenticated');

-- Fila inicial
INSERT INTO configuracion_tienda (clave, valor)
VALUES ('politica', '{}'::jsonb)
ON CONFLICT (clave) DO NOTHING;
