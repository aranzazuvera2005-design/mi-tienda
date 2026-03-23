-- ============================================================
-- RESEÑAS POR PEDIDO: añadir pedido_id a la tabla resenas
-- Una reseña por cliente por producto POR PEDIDO
-- ============================================================

-- 1. Añadir columna pedido_id (nullable para no romper filas existentes)
ALTER TABLE resenas
  ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE;

-- 2. Eliminar el unique constraint antiguo (producto_id, cliente_id)
ALTER TABLE resenas
  DROP CONSTRAINT IF EXISTS resenas_producto_id_cliente_id_key;

-- 3. Nuevo unique: una reseña por cliente por producto por pedido
ALTER TABLE resenas
  ADD CONSTRAINT resenas_producto_cliente_pedido_unique
  UNIQUE (producto_id, cliente_id, pedido_id);

-- 4. Índice para consultas por pedido
CREATE INDEX IF NOT EXISTS idx_resenas_pedido ON resenas (pedido_id);
