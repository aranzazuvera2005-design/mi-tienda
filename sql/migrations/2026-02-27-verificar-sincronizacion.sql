-- 1. Resumen de estado de sincronización
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_usuarios_auth,
    (SELECT COUNT(*) FROM perfiles) as total_perfiles,
    (SELECT COUNT(*) FROM perfiles p JOIN auth.users u ON p.id = u.id WHERE p.email = u.email) as sincronizados_ok,
    (SELECT COUNT(*) FROM perfiles p JOIN auth.users u ON p.id = u.id WHERE p.email != u.email OR p.email IS NULL) as desincronizados;

-- 2. Detalle de usuarios con problemas de sincronización
SELECT 
    u.id,
    u.email as email_en_auth,
    p.email as email_en_perfiles,
    CASE 
        WHEN p.id IS NULL THEN 'Perfil no existe'
        WHEN p.email IS NULL THEN 'Email vacío en perfil'
        WHEN p.email != u.email THEN 'Emails no coinciden'
        ELSE 'OK'
    END as estado_detalle
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
WHERE p.email != u.email OR p.email IS NULL OR p.id IS NULL;

-- 3. (OPCIONAL) Ejecutar esta línea solo si quieres forzar la sincronización ahora mismo:
-- UPDATE perfiles p SET email = u.email FROM auth.users u WHERE p.id = u.id AND (p.email != u.email OR p.email IS NULL);
