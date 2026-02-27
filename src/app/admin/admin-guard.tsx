'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  useEffect(() => {
    const checkAdmin = async () => {
      if (!supabase) {
        setIsAdmin(false);
        return;
      }

      try {
        // Usamos getSession() que es más rápido y fiable para el lado del cliente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          console.log('No session found, redirecting to login');
          setIsAdmin(false);
          router.push('/login');
          return;
        }

        const user = session.user;

        const { data: perfil, error } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', user.id)
          .single();

        if (error || !perfil) {
          console.error('Error fetching profile:', error);
          setIsAdmin(false);
          router.push('/');
          return;
        }

        if (perfil.rol === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/');
        }
      } catch (e) {
        console.error('Error checking admin status:', e);
        setIsAdmin(false);
        router.push('/');
      }
    };

    checkAdmin();
  }, [supabase, router]);

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
            <p style={{ margin: 0, color: '#7f1d1d' }}>No tienes permisos para acceder al panel de administración.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
