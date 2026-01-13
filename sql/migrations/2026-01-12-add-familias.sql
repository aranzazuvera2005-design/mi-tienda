-- Migration: Add familias table and familia_id to productos
BEGIN;

-- 1) Crear tabla familias
CREATE TABLE IF NOT EXISTS familias (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Añadir columna familia_id a productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS familia_id INTEGER;

-- 3) Backfill: crear filas en familias basadas en valores existentes de productos.familia (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'familia'
  ) THEN
    INSERT INTO familias (nombre)
    SELECT DISTINCT COALESCE(NULLIF(TRIM(familia), ''), 'General') as nombre
    FROM productos
    WHERE COALESCE(NULLIF(TRIM(familia), ''), 'General') IS NOT NULL
    ON CONFLICT (nombre) DO NOTHING;

    -- Asignar familia_id en productos usando la columna legacy 'familia'
    UPDATE productos
    SET familia_id = f.id
    FROM familias f
    WHERE COALESCE(NULLIF(TRIM(productos.familia), ''), 'General') = f.nombre
      AND productos.familia_id IS NULL;
  ELSE
    -- Si no existe la columna 'familia', crear una familia 'General' y asignarla a todos los productos sin familia_id
    INSERT INTO familias (nombre) VALUES ('General') ON CONFLICT (nombre) DO NOTHING;

    UPDATE productos
    SET familia_id = (SELECT id FROM familias WHERE nombre = 'General')
    WHERE productos.familia_id IS NULL;
  END IF;
END
$$;

-- 5) Añadir FK (Postgres no soporta ADD CONSTRAINT IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'productos_familia_fk'
  ) THEN
    ALTER TABLE productos
      ADD CONSTRAINT productos_familia_fk FOREIGN KEY (familia_id) REFERENCES familias(id);
  END IF;
END
$$;

-- 6) Índice para búsquedas por familia
CREATE INDEX IF NOT EXISTS idx_productos_familia_id ON productos(familia_id);

COMMIT;
