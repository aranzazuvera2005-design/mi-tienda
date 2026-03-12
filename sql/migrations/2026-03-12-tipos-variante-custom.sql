-- ============================================================
-- Tipos de variante personalizados por la tienda
-- ============================================================

-- Tabla de tipos de variante (definidos por la tienda, no hardcodeados)
CREATE TABLE IF NOT EXISTS tipos_variante (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,          -- "Talla", "Color", "Tela", "Acabado"...
  descripcion TEXT,                   -- ayuda al cliente
  tipo_input  TEXT NOT NULL DEFAULT 'selector', -- 'selector' | 'texto_libre' | 'foto'
  es_requerido BOOLEAN DEFAULT false,
  orden       INT DEFAULT 0,
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Valores posibles para cada tipo (solo para tipo_input='selector' y 'foto')
CREATE TABLE IF NOT EXISTS valores_variante (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_id     UUID NOT NULL REFERENCES tipos_variante(id) ON DELETE CASCADE,
  valor       TEXT NOT NULL,          -- "S", "Rojo", "Tela A"
  etiqueta    VARCHAR(10),            -- letra/código (A, B, C) para fotos
  imagen_url  TEXT,                   -- foto del valor (telas, etc)
  precio_extra NUMERIC DEFAULT 0,
  activo      BOOLEAN DEFAULT true,
  orden       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Relación producto <-> tipos_variante que aplican
CREATE TABLE IF NOT EXISTS producto_tipos_variante (
  producto_id UUID NOT NULL,
  tipo_id     UUID NOT NULL REFERENCES tipos_variante(id) ON DELETE CASCADE,
  PRIMARY KEY (producto_id, tipo_id)
);

-- Stock por combinación producto + valor_variante
-- (La tabla variantes existente se mantiene para compatibilidad)
-- Añadimos columna valor_id para referenciar al nuevo sistema
ALTER TABLE variantes
  ADD COLUMN IF NOT EXISTS valor_id UUID REFERENCES valores_variante(id) ON DELETE SET NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_valores_tipo ON valores_variante(tipo_id);
CREATE INDEX IF NOT EXISTS idx_ptv_producto ON producto_tipos_variante(producto_id);
