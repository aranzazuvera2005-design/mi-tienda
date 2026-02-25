# Guía de Transferencia para Manus (Handover Guide)

Este documento ha sido creado para asegurar la continuidad del proyecto **mi-tienda** y evitar regresiones técnicas, especialmente en el despliegue de Vercel.

## 🚀 Estado Actual del Proyecto
- **Framework**: Next.js 15.5.9 (App Router).
- **Base de Datos**: Supabase (PostgreSQL).
- **ORM**: Prisma v7.2.0 (Configurado con adaptador para Vercel).
- **Autenticación**: Supabase Auth.
- **Despliegue**: Vercel (https://mi-tienda-mauve.vercel.app/).

## 🛠️ Decisiones Técnicas Críticas (¡NO CAMBIAR SIN REVISAR!)

### 1. Configuración de Prisma (Crítico para Vercel)
El error `PrismaClientConstructorValidationError` fue resuelto mediante:
- **Singleton Pattern**: El cliente de Prisma DEBE importarse siempre desde `@/lib/prisma`. Nunca instanciar `new PrismaClient()` directamente en las rutas.
- **Adaptador de Driver**: Se utiliza `@prisma/adapter-pg` para que Prisma funcione correctamente en el entorno serverless de Vercel.
- **Archivo `prisma.config.ts`**: Este archivo es necesario para Prisma 7. No lo elimines, ya que ayuda a la CLI de Prisma a localizar el esquema y la URL de la base de datos.

### 2. Dualidad Supabase SDK / Prisma
- El proyecto utiliza **Supabase SDK** para la mayoría de las operaciones de API (especialmente Auth y consultas rápidas).
- **Prisma** se mantiene para la gestión del esquema y migraciones.
- Si añades una nueva tabla, hazlo en `prisma/schema.prisma`, ejecuta `npx prisma generate` y asegúrate de que las políticas RLS en Supabase permitan el acceso si usas el SDK.

### 3. Estructura de Datos de Clientes
- **Tabla `perfiles`**: Almacena los datos maestros del cliente (nombre, teléfono). El `id` es el UUID de Supabase Auth.
- **Tabla `direcciones`**: Soporta múltiples direcciones por cliente. La dirección principal se marca con `es_principal: true`.
- **Restricción**: El campo `email` en la tabla `perfiles` es opcional o se maneja vía Auth para evitar conflictos de duplicidad.

## ⚠️ Precauciones para el Próximo Manus
1. **Antes de Pusear**: Ejecuta siempre `npm run build` localmente. Si falla la generación de Prisma, el despliegue en Vercel fallará.
2. **Variables de Entorno**: Asegúrate de que `DATABASE_URL`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas en Vercel.
3. **Git**: Siempre haz un `git pull --rebase` antes de pushear para evitar conflictos con cambios realizados directamente en el repo.

## 📋 Tareas Pendientes / Próximos Pasos
- Implementar edición/borrado de clientes en el panel admin (actualmente solo lectura y creación).
- Mejorar la gestión de estados de pedidos (actualmente solo "pagado" y "enviado").
- Integración real con pasarela de pagos (Stripe está mencionado pero requiere configuración de llaves).

---
*Documento generado por Manus AI el 18 de febrero de 2026.*
