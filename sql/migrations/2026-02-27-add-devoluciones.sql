-- Crear tabla devoluciones
CREATE TABLE IF NOT EXISTS devoluciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INT NOT NULL,
  motivo TEXT,
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_limite TIMESTAMPTZ NOT NULL,
  observaciones_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_devoluciones_pedido_id ON devoluciones(pedido_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_producto_id ON devoluciones(producto_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_estado ON devoluciones(estado);
CREATE INDEX IF NOT EXISTS idx_devoluciones_fecha_solicitud ON devoluciones(fecha_solicitud);
