import { createBrowserClient } from '@supabase/ssr';

/**
 * Fetch wrapper para llamadas a /api/admin/* desde páginas del cliente.
 * Añade automáticamente el header Authorization con el token de sesión.
 */
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

  let token: string | undefined;

  if (supabaseUrl && supabaseAnon) {
    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnon);
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch {
      // Si falla obtener el token, la petición fallará con 401 en el servidor
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}
