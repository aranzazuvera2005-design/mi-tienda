-- ============================================================
-- SISTEMA DE RESEÑAS DE PRODUCTOS
-- ============================================================
-- Tabla: resenas
-- - Un usuario solo puede reseñar un producto que haya comprado
-- - Una reseña por usuario por producto (unique constraint)
-- - Valoración 1-5 estrellas, comentario y foto opcional
-- ============================================================

CREATE TABLE IF NOT EXISTS resenas (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id  UUID        NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cliente_id   UUID        NOT NULL,
  valoracion   SMALLINT    NOT NULL CHECK (valoracion >= 1 AND valoracion <= 5),
  comentario   TEXT,
  foto_url     TEXT,
  creado_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Solo una reseña por cliente por producto
  UNIQUE (producto_id, cliente_id)
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_resenas_producto ON resenas (producto_id);
CREATE INDEX IF NOT EXISTS idx_resenas_cliente  ON resenas (cliente_id);

-- ============================================================
-- BUCKET DE SUPABASE STORAGE PARA FOTOS DE RESEÑAS
-- ============================================================
-- Ejecutar esto en el SQL Editor de Supabase:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('resenas-fotos', 'resenas-fotos', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "Fotos reseñas públicas" ON storage.objects
--   FOR SELECT USING (bucket_id = 'resenas-fotos');
--
-- CREATE POLICY "Subir foto reseña" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'resenas-fotos' AND auth.role() = 'authenticated');
-- ============================================================
