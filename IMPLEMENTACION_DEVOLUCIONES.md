# Implementación de Gestión de Pedidos y Devoluciones

## Resumen de Cambios

Se ha agregado un sistema completo de gestión de pedidos y devoluciones a tu tienda online. Los usuarios pueden:

1. **Consultar sus pedidos** en `/perfil/mis-pedidos`
2. **Solicitar devoluciones** dentro de 30 días desde la compra
3. **Seguimiento de devoluciones** en `/perfil/mis-devoluciones`

El equipo de administración puede:

1. **Gestionar devoluciones** en `/admin/devoluciones`
2. **Aprobar o rechazar** solicitudes de devolución
3. **Marcar como completadas** las devoluciones aprobadas

---

## Archivos Creados

### Componentes de Usuario
- **`src/app/perfil/mis-pedidos/page.tsx`** - Página para listar pedidos del usuario
- **`src/app/perfil/solicitar-devolucion/page.tsx`** - Formulario para solicitar devoluciones
- **`src/app/perfil/mis-devoluciones/page.tsx`** - Página para ver estado de devoluciones

### Componentes Admin
- **`src/app/admin/devoluciones/page.tsx`** - Panel de gestión de devoluciones

### APIs
- **`src/app/api/devoluciones/route.ts`** - API para crear y obtener devoluciones (usuario)
- **`src/app/api/admin/devoluciones/route.ts`** - API para gestionar devoluciones (admin)

### Base de Datos
- **`sql/migrations/2026-02-27-add-devoluciones.sql`** - Migración SQL para crear tabla

### Esquema
- **`prisma/schema.prisma`** - Actualizado con modelo `Devolucion` y relaciones

### Componentes Actualizados
- **`src/components/Header.tsx`** - Agregado enlace a "Mis Pedidos"

---

## Pasos de Implementación

### 1. Ejecutar Migración SQL en Supabase

Ve a tu proyecto en Supabase → SQL Editor y ejecuta el contenido de:
```
sql/migrations/2026-02-27-add-devoluciones.sql
```

O usa el SQL directamente:

```sql
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

CREATE INDEX IF NOT EXISTS idx_devoluciones_pedido_id ON devoluciones(pedido_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_producto_id ON devoluciones(producto_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_estado ON devoluciones(estado);
CREATE INDEX IF NOT EXISTS idx_devoluciones_fecha_solicitud ON devoluciones(fecha_solicitud);
```

### 2. Actualizar Prisma (Opcional)

Si usas Prisma en tu flujo de desarrollo:

```bash
npx prisma generate
```

### 3. Desplegar en Vercel

1. Haz push de los cambios a GitHub:
```bash
git add .
git commit -m "feat: agregar gestión de pedidos y devoluciones"
git push
```

2. Vercel detectará automáticamente los cambios y desplegará

### 4. Configurar Políticas de RLS (Recomendado)

En Supabase, ve a Authentication → Policies y agrega:

**Para tabla `devoluciones` - SELECT (usuarios):**
```sql
(SELECT auth.uid()) = (
  SELECT cliente_id FROM pedidos WHERE id = pedido_id
)
```

**Para tabla `devoluciones` - INSERT (usuarios):**
```sql
(SELECT auth.uid()) = (
  SELECT cliente_id FROM pedidos WHERE id = pedido_id
)
```

---

## Flujo de Uso

### Para Usuarios

1. **Ver Pedidos**: Click en "Mis Pedidos" en el header
2. **Expandir Pedido**: Click en el pedido para ver detalles
3. **Solicitar Devolución**: Click en "Solicitar Devolución" (solo si hace <30 días)
4. **Completar Formulario**: Seleccionar producto, cantidad y motivo
5. **Ver Devoluciones**: Click en "Ver mis devoluciones" para seguimiento

### Para Administradores

1. **Acceder Panel**: Ir a `/admin/devoluciones`
2. **Filtrar**: Por estado, cliente o producto
3. **Revisar**: Ver detalles de cada solicitud
4. **Actuar**: 
   - **Aprobar**: Agrega observación opcional
   - **Rechazar**: Debe agregar motivo del rechazo
   - **Completar**: Una vez aprobada, marcar como completada

---

## Estados de Devolución

| Estado | Descripción | Acciones |
|--------|-------------|----------|
| **Pendiente** | Solicitud recibida, en revisión | Aprobar / Rechazar |
| **Aprobada** | Devolución autorizada | Marcar como Completada |
| **Rechazada** | Devolución no autorizada | Ninguna |
| **Completada** | Devolución procesada | Ninguna |

---

## Límite de Tiempo

- Los usuarios pueden solicitar devoluciones **hasta 30 días después** de la compra
- El sistema verifica automáticamente la fecha `creado_at` del pedido
- Después de 30 días, el botón "Solicitar Devolución" no aparece

---

## Validaciones

### En el Cliente
- ✅ Usuario debe estar autenticado
- ✅ Pedido debe pertenecer al usuario
- ✅ No pueden haber pasado 30 días
- ✅ Cantidad debe ser válida

### En el Servidor
- ✅ Verificación de propiedad del pedido
- ✅ Validación de plazo de 30 días
- ✅ Prevención de duplicados (no permite 2 devoluciones pendientes del mismo producto)
- ✅ Validación de cantidad

---

## Características Incluidas

✅ **Interfaz Responsiva** - Funciona en mobile y desktop
✅ **Búsqueda y Filtros** - Panel admin con búsqueda avanzada
✅ **Tiempo Real** - Actualizaciones en vivo con Supabase Realtime
✅ **Notificaciones** - Toast messages para feedback del usuario
✅ **Validaciones** - Tanto cliente como servidor
✅ **Índices de BD** - Optimizados para rendimiento
✅ **Iconos** - Usando lucide-react para mejor UX

---

## Próximas Mejoras (Opcionales)

- [ ] Envío automático de email al usuario cuando se aprueba/rechaza
- [ ] Generación de etiqueta de envío para devoluciones aprobadas
- [ ] Reembolso automático en la pasarela de pago
- [ ] Historial de cambios de estado
- [ ] Exportar devoluciones a CSV
- [ ] Dashboard con estadísticas de devoluciones

---

## Soporte

Si encuentras problemas:

1. Verifica que la tabla `devoluciones` existe en Supabase
2. Confirma que las variables de entorno están configuradas
3. Revisa la consola del navegador para errores
4. Verifica los logs de Vercel

---

## Notas Técnicas

- El sistema usa **Supabase Realtime** para actualizaciones en vivo
- Las APIs están protegidas con **validación de propiedad** (server-side)
- Los índices de BD mejoran el rendimiento de búsquedas
- El esquema Prisma está actualizado pero es opcional usar
- Las políticas de RLS son recomendadas pero no obligatorias

