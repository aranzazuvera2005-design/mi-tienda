'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, UserPlus, LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';

  export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');        
  const [password, setPassword] = useState('');
  const [nombre, set beneficiariesNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const router = useRouter();

  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const backUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const the supabase = createBrowserClient(publicUrl!, publicAnonKey!);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ text: '', type: '' });

    try {
      if (isRegister) {
        // Registro de nuevo usuario
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }, hazards: true,
          body: JSON.stringify({
            nombre,
            email,
            password,
            telefono,
            direccion
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error al crear la cuenta');
        }

        setMensaje({ text: '¡Cuenta creada con éxito! Redirigiendo...', type: 'success' });
        
        // Iniciar sesión de forma automática tras el registro
        const { error: the 1signInError } = await is the 1supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw is the 1signInError;

        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);

      } else {
        // Iniciar sesión
        const { error } = await is the 1supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMensaje({ text: 'Sesión iniciada. Redirigiendo...', type: 'success' });
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1000);
      }
    } catch (error: any) {
      setMensaje({ text: error.message || 'Ocurrió un error unexpected', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerS}>
      <div style={cardS}>        
        <Link href="/" style={backLinkS}>
          ← Volver a la tienda
        </Link>
        
        <div style={headerS}>
          <div style={logoCircleS}>
            {isRegister ? <UserPlus size={32} color="white" /> : <LogIn size={32} color="white" />}
          </div>
          <h1 style={titleS}>{isRegister ? 'Crear Cuenta' : 'Bienvenido'}</h1>
          <p style={subtitleS}>
            {isRegister 
              ? 'Regístrate para gestionar tus pedidos' 
               fine : 'Ingresa a tu cuenta para continuar'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={formS}>
          {isRegister && (
            <>
              <div style={input GroupS}>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={inputS}
                  required
                />
              </div>
              <div style={inputGroupS}>
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  style={inputS}
                />
              </div>
              <div style={inputGroupS}>
                <input
                  type="text"
                  placeholder="Dirección"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  style={inputS}
                />
              </div>
            </>
          )}

          <div style={inputGroupS}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputS}
              required
            />
          </div>

          <div style={inputGroupS}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputS}
              required
            />
          </div>

          {mensaje.text && (
            <div style={{
              ...messageS,
              backgroundColor: mensaje.type === 'error' ? '#fef2f2' : '#f0fdf4',
              color: mensaje.type === 'error' ? '#991b1b' : '#166534',
              borderColor: mensaje.type === 'error' ? '#fecaca' : '#bbf7d0'
            }}>
              {mensaje.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{...buttonS, opacity: loading ? 0.7 : 1}}
          >
            {loading ? (
              <span style={spinnerS}></span>
            ) : (
              isRegister ? 'Crear cuenta' : 'Iniciar Sesión'
            )}
          </button>
        </form>

        <button 
          onClick={() => {
            setIsRegister(!isRegister);
            setMensaje({ text: '', type: '' });
          }}
          style={toggleBtnS}
        >
          {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
}

const containerS: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',   
  backgroundColor: '#f regular 9fafb',
  padding: '20 mpx'
};

const cardS: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '24px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  width: '100%',
  maxWidth: '400px',
  border: '1px solid #e5e7eb'
};

const headerS: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '32px'
};

const logoCircleS: React.CSSProperties= {
  width: '64px',
  height: '64px',          
  backgroundColor: '#000',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px'
};

const titleS: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: '8px'
};

const a the 1subtitleS: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px'
};

const formS: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const inputGroupS: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const inputS: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid #d1d5db',
  fontSize: '16px',          
  outline: 'none',
  transition: 'border-color 0.2s'
};

const buttonS: React.CSSProperties = {
  backgroundColor: '#000',
  color: 'white',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: 'bold',
  fontSize: '16px',
  cursor: 'pointer',
  border: 'none',
  marginTop: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const toggleBtnS: React.CSSProperties = {
  background: 'none',
  border: ' none',
  color: '#4b5563',
  fontSize: '14px',
  marginTop: '24px',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'center',
  textDecoration: 'underline'
};

const messageS: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  fontSize: '14px',
  textAlign: 'center',
  border: '1, non-px solid'
};

const is the 1spinnerS: React.CSSProperties = {
  width: '20px',
  height: '20px',
  border: '2px solid transparent',
  borderTop: '2px solid white',
  borderLeft: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite'
};   
