'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Verificar sesión activa en el cliente
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
        const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

        if (!SUPABASE_URL || !SUPABASE_ANON) {
          setErrorMsg('Variables de entorno de Supabase no configuradas');
          setIsAdmin(false);
          return;
        }

        const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push('/login');
          return;
        }

        // Usar API del servidor (con service role) para evitar problemas de RLS
        // Pasamos el token en el header para que el servidor pueda verificar la sesión
        const res = await fetch('/api/admin/check-rol', {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await res.json();

        if (!res.ok || !data.isAdmin) {
          console.warn('[AdminGuard] Acceso denegado:', data);
          setErrorMsg(`Acceso denegado. Rol actual: "${data.rol || 'desconocido'}"`);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);
      } catch (e: any) {
        console.error('[AdminGuard] Error:', e);
        setErrorMsg('Error al verificar permisos: ' + e.message);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p style={{ marginTop: '20px', color: '#6b7280' }}>Verificando permisos...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '50px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
          <AlertCircle style={{ color: '#dc2626', flexShrink: 0 }} size={24} />
          <div>
            <h3 style={{ margin: 0, fontWeight: 'bold', color: '#991b1b', marginBottom: '5px' }}>Acceso Denegado</h3>
            <p style={{ margin: 0, color: '#7f1d1d' }}>
              {errorMsg || 'No tienes permisos para acceder al panel de administración.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
