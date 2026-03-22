-- Migración: añadir columnas oculto y oculto_desde a productos
-- Permite ocultar productos de la tienda sin borrarlos (necesario cuando tienen pedidos asociados)

ALTER TABLE productos ADD COLUMN IF NOT EXISTS oculto BOOLEAN DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS oculto_desde TIMESTAMPTZ;
