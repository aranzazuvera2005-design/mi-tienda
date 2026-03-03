-- 1. Asegurar que la columna email existe en perfiles
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Sincronizar emails de usuarios existentes de auth.users a perfiles
UPDATE perfiles
SET email = auth.users.email
FROM auth.users
WHERE perfiles.id = auth.users.id
AND perfiles.email IS NULL;

-- 3. Crear función para sincronizar email automáticamente en nuevos registros
CREATE OR REPLACE FUNCTION public.handle_new_user_email()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, created_at, updated_at, rol)
  VALUES (NEW.id, NEW.email, NOW(), NOW(), 'usuario')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear el Trigger que se activa al insertar en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_sync_email ON auth.users;
CREATE TRIGGER on_auth_user_created_sync_email
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_email();
