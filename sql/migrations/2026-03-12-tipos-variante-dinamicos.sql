-- ============================================================
-- Migración: Sistema de variantes completamente dinámico
-- ============================================================

-- 1. Tabla de tipos de variante definidos por la tienda
CREATE TABLE IF NOT EXISTS tipos_variante (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,                          -- "Talla", "Color", "Diseño de tela"...
  descripcion  TEXT,                                   -- Texto de ayuda que ve el cliente
  tipo_input   TEXT NOT NULL DEFAULT 'selector',       -- 'selector' | 'texto_libre' | 'foto'
  es_requerido BOOLEAN DEFAULT false,
  orden        INTEGER DEFAULT 0,
  activo       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. Valores posibles para cada tipo (para tipo_input = 'selector' o 'foto')
CREATE TABLE IF NOT EXISTS valores_variante (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_id      UUID REFERENCES tipos_variante(id) ON DELETE CASCADE,
  valor        TEXT NOT NULL,                          -- "XL", "Rojo", "Satén floral"...
  etiqueta     VARCHAR(10),                            -- Letra identificadora (A, B, C...) para tipo 'foto'
  imagen_url   TEXT,                                   -- Foto del diseño/tela
  precio_extra NUMERIC DEFAULT 0,
  activo       BOOLEAN DEFAULT true,
  orden        INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 3. Relación qué tipos de variante aplican a qué producto (máx 5)
CREATE TABLE IF NOT EXISTS producto_variantes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  tipo_id    UUID REFERENCES tipos_variante(id) ON DELETE CASCADE,
  orden      INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (producto_id, tipo_id)
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_valores_tipo ON valores_variante(tipo_id);
CREATE INDEX IF NOT EXISTS idx_producto_variantes_producto ON producto_variantes(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_variantes_tipo ON producto_variantes(tipo_id);

-- 5. RLS permisivo para lectura pública (anon puede leer tipos/valores para la tienda)
ALTER TABLE tipos_variante   ENABLE ROW LEVEL SECURITY;
ALTER TABLE valores_variante ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_variantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "lectura_publica_tipos"   ON tipos_variante   FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "lectura_publica_valores" ON valores_variante FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "lectura_publica_pv"      ON producto_variantes FOR SELECT USING (true);

-- Para escritura solo service_role (admin) — ajusta según tu setup de Supabase
