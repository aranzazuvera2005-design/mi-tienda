'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, UserPlus, LogIn, Loader2, ArrowLeft, KeyRound, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Card from '@/components/Card';

type Step = 'login' | 'register' | 'recovery-choice' | 'recovery-sent';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('login');
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

  const isPasswordError = (msg: string) =>
    msg.toLowerCase().includes('invalid') ||
    msg.toLowerCase().includes('password') ||
    msg.toLowerCase().includes('credentials') ||
    msg.toLowerCase().includes('contraseña') ||
    msg.toLowerCase().includes('incorrect');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Si es error de contraseña incorrecta, mostrar opciones de recuperación
        if (isPasswordError(error.message)) {
          setStep('recovery-choice');
          return;
        }
        throw error;
      }

      setMensaje({ text: 'Sesión iniciada. Redirigiendo...', type: 'success' });
      setTimeout(() => { router.push('/'); router.refresh(); }, 1000);
    } catch (error: any) {
      setMensaje({ text: error.message || 'Ocurrió un error inesperado', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ text: '', type: '' });

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, telefono, direccion }),
      });

      const result = await response.json();
      if (!response.ok) {
        const technicalError = result.details ? `\nDetalles: ${JSON.stringify(result.details)}` : '';
        const hint = result.hint ? `\nSugerencia: ${result.hint}` : '';
        throw new Error(`${result.error}${technicalError}${hint}` || 'Error al crear la cuenta');
      }

      setMensaje({ text: '¡Cuenta creada con éxito! Redirigiendo...', type: 'success' });
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setTimeout(() => { router.push('/'); router.refresh(); }, 1500);
    } catch (error: any) {
      setMensaje({ text: error.message || 'Ocurrió un error inesperado', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    setLoading(true);
    setMensaje({ text: '', type: '' });
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar el correo');
      setStep('recovery-sent');
    } catch (err: any) {
      setMensaje({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black text-xs uppercase tracking-widest mb-8 transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Volver a la tienda
        </Link>

        <Card className="p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border-none">

          {/* ── PASO: ELEGIR RECUPERACIÓN ── */}
          {step === 'recovery-choice' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-200">
                <KeyRound size={36} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">Contraseña incorrecta</h1>
              <p className="text-slate-500 font-medium mb-8">
                No hemos podido identificarte con esa contraseña. ¿Qué quieres hacer?
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={handleSendResetEmail}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-black text-base bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  Enviar enlace de cambio a mi correo
                </button>

                <button
                  onClick={() => {
                    setStep('login');
                    setPassword('');
                    setMensaje({ text: '', type: '' });
                  }}
                  className="w-full py-4 rounded-2xl font-black text-base bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                >
                  Intentar de nuevo
                </button>
              </div>

              {mensaje.text && (
                <div className={`mt-4 p-4 rounded-2xl text-sm font-bold ${
                  mensaje.type === 'error'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-green-50 text-green-600 border border-green-100'
                }`}>
                  {mensaje.text}
                </div>
              )}

              <p className="mt-6 text-xs text-slate-400">
                Correo donde recibirás el enlace:{' '}
                <span className="font-bold text-slate-600">{email}</span>
              </p>
            </div>
          )}

          {/* ── PASO: EMAIL ENVIADO ── */}
          {step === 'recovery-sent' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200">
                <CheckCircle2 size={36} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">¡Correo enviado!</h1>
              <p className="text-slate-500 font-medium mb-2">
                Hemos enviado un enlace a:
              </p>
              <p className="font-black text-slate-800 text-lg mb-6">{email}</p>
              <p className="text-slate-400 text-sm mb-8">
                Revisa tu bandeja de entrada (y la carpeta de spam). El enlace te permitirá crear una nueva contraseña.
              </p>
              <button
                onClick={() => { setStep('login'); setPassword(''); setMensaje({ text: '', type: '' }); }}
                className="w-full py-4 rounded-2xl font-black text-base bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* ── PASO: LOGIN / REGISTRO ── */}
          {(step === 'login' || step === 'register') && (
            <>
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200 rotate-3 hover:rotate-0 transition-transform duration-500">
                  {step === 'register' ? (
                    <UserPlus size={36} className="text-white" />
                  ) : (
                    <LogIn size={36} className="text-white" />
                  )}
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                  {step === 'register' ? 'Crear Cuenta' : 'Bienvenido'}
                </h1>
                <p className="text-slate-500 font-medium">
                  {step === 'register'
                    ? 'Regístrate para gestionar tus pedidos'
                    : 'Ingresa a tu cuenta para continuar'}
                </p>
              </div>

              <form onSubmit={step === 'register' ? handleRegister : handleLogin} className="space-y-5">
                {step === 'register' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre completo</label>
                      <input type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Teléfono</label>
                      <input type="tel" placeholder="Tu teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Dirección</label>
                      <input type="text" placeholder="Tu dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                  <input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800" required />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800" required />
                </div>

                {mensaje.text && (
                  <div className={`p-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                    mensaje.type === 'error'
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-green-50 text-green-600 border border-green-100'
                  }`}>
                    {mensaje.text}
                  </div>
                )}

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
                  {loading ? 'Procesando...' : (step === 'register' ? 'Crear cuenta' : 'Iniciar Sesión')}
                </button>
              </form>

              <button
                onClick={() => {
                  setStep(step === 'register' ? 'login' : 'register');
                  setMensaje({ text: '', type: '' });
                }}
                className="w-full mt-8 text-slate-400 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-colors"
              >
                {step === 'register'
                  ? '¿Ya tienes cuenta? Inicia sesión'
                  : '¿No tienes cuenta? Regístrate'}
              </button>
            </>
          )}

        </Card>
      </div>
    </div>
  );
}
