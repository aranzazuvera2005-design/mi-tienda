-- Añadir columna rol a la tabla perfiles
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'usuario';

-- Asegurar que los roles válidos sean solo 'usuario' o 'admin'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_rol_valido') THEN
        ALTER TABLE perfiles ADD CONSTRAINT check_rol_valido CHECK (rol IN ('usuario', 'admin'));
    END IF;
END
$$;

-- Nota: Para convertir a un usuario en admin, ejecuta:
-- UPDATE perfiles SET rol = 'admin' WHERE email = 'tu-email@ejemplo.com';
