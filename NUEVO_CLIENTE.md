# 🛒 Cómo desplegar la tienda para un nuevo cliente

## Pasos (10 minutos por cliente)

### 1. Duplicar el repositorio
- Ir a GitHub → este repo → **Use this template** (o hacer fork)
- Nombrar el nuevo repo con el nombre del cliente: `tienda-nombrecliente`

### 2. Crear proyecto en Supabase
- Crear nuevo proyecto en [supabase.com](https://supabase.com)
- Ejecutar las migraciones SQL que hay en `/sql/migrations/`
- Anotar: URL, ANON KEY, SERVICE ROLE KEY, DATABASE URL

### 3. Crear proyecto en Vercel
- Importar el nuevo repo desde [vercel.com](https://vercel.com)
- **No configurar variables de entorno en Vercel** — las gestiona GitHub Actions
- Anotar: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
  (los dos últimos están en `.vercel/project.json` tras hacer `vercel link`)

### 4. Configurar GitHub Secrets
Ir al nuevo repo → **Settings → Secrets and variables → Actions → New secret**

| Secret | Dónde encontrarlo |
|--------|-------------------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SITE_URL` | URL de Vercel del cliente (ej: `https://tienda-cliente.vercel.app`) |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (Transaction) |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection string (Direct) |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API Key — **opcional**, free tier |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) — **opcional**, free tier |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) — **opcional**, free tier |

> ℹ️ Las 3 keys de IA son opcionales. Con añadir **una sola** ya funciona el generador de descripciones por imagen. El admin puede elegir qué IA usar desde el desplegable.

### 5. Hacer push para desplegar
```bash
git push origin main
```
GitHub Actions construirá el `.env` con los secrets y desplegará a Vercel automáticamente.

---

## Desarrollo local
```bash
cp .env.example .env.local
# Rellenar .env.local con los valores del cliente
npm install
npm run dev
```
