This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# mi-tienda" 

## Despliegue en Vercel / GitHub

Pasos mínimos para desplegar en Vercel:

- Añade el repositorio a GitHub y conéctalo desde Vercel (Import Project).
- En Vercel, configura las siguientes variables de entorno (Project Settings → Environment Variables):
	- `NEXT_PUBLIC_SUPABASE_URL` → la URL de tu proyecto Supabase (empieza por https://)
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → la clave ANON pública
	- `SUPABASE_SERVICE_ROLE_KEY` → (opcional) clave de servidor para rutas privadas

Si no configuras Supabase, la aplicación seguirá desplegando correctamente pero ciertas funcionalidades (login, envío de pedidos, panel admin) quedarán deshabilitadas y mostrarán mensajes de error amigables.

Usa `.env.example` como referencia para las variables necesarias.

### Recomendaciones y variables adicionales

- Asegúrate de añadir también:
	- `SUPABASE_URL` = https://<tu-proyecto>.supabase.co
	- `DATABASE_URL` = <tu DATABASE_URL> (sólo si vas a usar Prisma en Vercel)

- Importante:
	- `NEXT_PUBLIC_*` se expone al cliente y debe usarse sólo para claves públicas (ANON).
	- `SUPABASE_SERVICE_ROLE_KEY` debe permanecer privada y no empezar por `NEXT_PUBLIC_`.

### Flujo recomendado para creación de usuarios en producción

- Para crear usuarios desde el panel admin de forma segura, usa la ruta server-side que añadimos: `POST /api/admin/create-user`. Esta ruta requiere `SUPABASE_SERVICE_ROLE_KEY` definida en Vercel y crea tanto el usuario de Auth como el registro en `perfiles`.

Si quieres, puedo automatizar la creación de las variables en Vercel vía su API (necesitaré un token de Vercel) o añadir un pequeño script para comprobar las variables en tiempo de despliegue.



