'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, UserPlus, LogIn, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Card from '@/components/Card';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');        
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const router = useRouter();

  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createBrowserClient(publicUrl!, publicAnonKey!);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ text: '', type: '' });

    try {
      if (isRegister) {
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);

      } else {
        const { error } = await supabase.auth.signInWithPassword({
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
      setMensaje({ text: error.message || 'Ocurrió un error inesperado', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Botón volver */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          Volver a la tienda
        </Link>

        <Card className="p-8">
          {/* Encabezado */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              {isRegister ? (
                <UserPlus size={32} className="text-white" />
              ) : (
                <LogIn size={32} className="text-white" />
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              {isRegister ? 'Crear Cuenta' : 'Bienvenido'}
            </h1>
            <p className="text-slate-600">
              {isRegister 
                ? 'Regístrate para gestionar tus pedidos' 
                : 'Ingresa a tu cuenta para continuar'}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre completo</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Tu teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Dirección</label>
                  <input
                    type="text"
                    placeholder="Tu dirección"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {/* Mensaje */}
            {mensaje.text && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                mensaje.type === 'error' 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}>
                {mensaje.text}
              </div>
            )}

            {/* Botón submit */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded-xl font-extrabold text-lg transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }`}
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              {loading ? 'Procesando...' : (isRegister ? 'Crear cuenta' : 'Iniciar Sesión')}
            </button>
          </form>

          {/* Botón toggle */}
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setMensaje({ text: '', type: '' });
            }}
            className="w-full mt-6 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
          >
            {isRegister 
              ? '¿Ya tienes cuenta? Inicia sesión' 
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </Card>
      </div>
    </div>
  );
}
