'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowLeft, Loader2, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const router = useRouter();
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;
  const [authAvailable, setAuthAvailable] = useState<boolean | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');

    try {
      if (!supabase) {
        throw new Error('La configuración de Supabase no es válida. Verifica las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }

      if (isRegister) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        });
        if (error) throw error;
        setMensaje('¡Cuenta creada! Revisa tu email para confirmar y volver al carrito.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      setMensaje(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Comprobar configuración de Supabase en montaje
  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      setAuthAvailable(false);
      setMensaje('Las variables de entorno de Supabase no están configuradas. La autenticación no funcionará.');
    } else {
      setAuthAvailable(true);
    }
  }, [SUPABASE_URL, SUPABASE_ANON]);

  return (
    <div style={containerS}>
      <div style={cardS}>
        <Link href="/" style={backLinkS}><ArrowLeft size={18} /> Volver a la tienda</Link>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={logoCircleS}>{isRegister ? <UserPlus size={30}/> : <LogIn size={30}/>}</div>
          <h1 style={titleS}>{isRegister ? 'Nueva Cuenta' : 'Bienvenido'}</h1>
          <p style={subtitleS}>{isRegister ? 'Regístrate para finalizar tu pedido.' : 'Entra para continuar con tu compra.'}</p>
        </div>
        <form onSubmit={handleAuth} style={formS}>
          <div style={inputGroupS}><Mail size={18} style={iconS}/><input type="email" placeholder="Email" style={inputS} value={email} onChange={(e)=>setEmail(e.target.value)} required /></div>
          <div style={inputGroupS}><Lock size={18} style={iconS}/><input type="password" placeholder="Contraseña" style={inputS} value={password} onChange={(e)=>setPassword(e.target.value)} required /></div>
          {mensaje && <div style={{...msgBoxS, backgroundColor: mensaje.includes('creada') ? '#f0fdf4' : '#fef2f2', color: mensaje.includes('creada') ? 'green' : 'red'}}>{mensaje}</div>}
          <button type="submit" disabled={loading} style={buttonS}>
            {loading ? <Loader2 style={{animation:'spin 1s linear infinite'}}/> : (isRegister ? 'Crear cuenta y comprar' : 'Entrar y comprar')}
          </button>
        </form>
        <button onClick={()=>setIsRegister(!isRegister)} style={toggleBtnS}>
          {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
        </button>
      </div>
    </div>
  );
}

// Estilos de Login (Iguales a los anteriores)
const containerS = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '20px' };
const cardS = { backgroundColor: 'white', padding: '40px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', border: '1px solid #f3f4f6' };
const backLinkS = { display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', textDecoration: 'none', fontSize: '14px', marginBottom: '20px' };
const logoCircleS = { width: '70px', height: '70px', backgroundColor: '#f3f4f6', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' };
const titleS = { fontSize: '28px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-1px' };
const subtitleS = { color: '#6b7280', fontSize: '14px', margin: 0 };
const formS = { display: 'flex', flexDirection: 'column' as const, gap: '15px' };
const inputGroupS = { position: 'relative' as const, display: 'flex', alignItems: 'center' };
const iconS = { position: 'absolute' as const, left: '16px', color: '#9ca3af' };
const inputS = { width: '100%', padding: '15px 15px 15px 48px', borderRadius: '14px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px' };
const buttonS = { width: '100%', padding: '16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold' as const, fontSize: '16px', cursor: 'pointer' };
const msgBoxS = { padding: '12px', borderRadius: '10px', fontSize: '13px', textAlign: 'center' as const };
const toggleBtnS = { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '14px', marginTop: '20px', width: '100%' };