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
          // Si hay detalles técnicos, los mostramos para depuración
          const technicalError = result.details ? `\nDetalles: ${JSON.stringify(result.details)}` : '';
          const hint = result.hint ? `\nSugerencia: ${result.hint}` : '';
          throw new Error(`${result.error}${technicalError}${hint}` || 'Error al crear la cuenta');
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Botón volver */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black text-xs uppercase tracking-widest mb-8 transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Volver a la tienda
        </Link>

        <Card className="p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border-none">
          {/* Encabezado */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200 rotate-3 hover:rotate-0 transition-transform duration-500">
              {isRegister ? (
                <UserPlus size={36} className="text-white" />
              ) : (
                <LogIn size={36} className="text-white" />
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
              {isRegister ? 'Crear Cuenta' : 'Bienvenido'}
            </h1>
            <p className="text-slate-500 font-medium">
              {isRegister 
                ? 'Regístrate para gestionar tus pedidos' 
                : 'Ingresa a tu cuenta para continuar'}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleAuth} className="space-y-5">
            {isRegister && (
              <>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre completo</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Tu teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Dirección</label>
                  <input
                    type="text"
                    placeholder="Tu dirección"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                required
              />
            </div>

            {/* Mensaje */}
            {mensaje.text && (
              <div className={`p-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                mensaje.type === 'error' 
                  ? 'bg-red-50 text-red-600 border border-red-100' 
                  : 'bg-green-50 text-green-600 border border-green-100'
              }`}>
                {mensaje.text}
              </div>
            )}

            {/* Botón submit */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl ${
                loading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 active:scale-95'
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
            className="w-full mt-8 text-slate-400 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-colors"
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
