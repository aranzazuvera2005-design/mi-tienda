-- ============================================================
-- Migración: Precio tachado, descuento y variantes ampliadas
-- ============================================================

-- 1. Añadir campos de precio y descuento a productos
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_tachado NUMERIC,
  ADD COLUMN IF NOT EXISTS descuento_pct  NUMERIC,
  ADD COLUMN IF NOT EXISTS descripcion_larga TEXT;

-- 2. Ampliar variantes: ahora soporta hasta 5 tipos parametrizables
-- Tipos: talla, color, personalizacion, diseno_tela, accesorio (y cualquier custom)
ALTER TABLE variantes
  ADD COLUMN IF NOT EXISTS imagen_url TEXT,       -- para diseños de tela con foto
  ADD COLUMN IF NOT EXISTS etiqueta  VARCHAR(10), -- letra/código que identifica el diseño (A, B, C...)
  ADD COLUMN IF NOT EXISTS meta      JSONB;       -- datos extra por tipo

-- 3. Índice para consultas por producto
CREATE INDEX IF NOT EXISTS idx_variantes_producto_tipo ON variantes(producto_id, tipo);

-- NOTA: El límite de 5 variantes distintas por producto se controla desde la aplicación.
-- La tabla variantes ya existe con: id, producto_id, tipo, valor, precio_extra, stock
