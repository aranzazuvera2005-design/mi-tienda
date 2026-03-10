'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MapPin, Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft, Home, Phone, User as UserIcon } from 'lucide-react';
import Card from '@/components/Card';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function MisDirecciones() {
  const [nuevaDir, setNuevaDir] = useState({ calle: '', ciudad: '', cp: '' });
  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { user } = useCart();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  useEffect(() => {
    if (!user || !supabase) {
      setCargando(false);
      return;
    }
    cargarDirecciones();
  }, [user, supabase]);

  const cargarDirecciones = async () => {
    if (!supabase || !user) return;
    try {
      const { data } = await supabase
        .from('direcciones')
        .select('*')
        .eq('cliente_id', user.id)
        .order('es_principal', { ascending: false });
      setDirecciones(data || []);
    } catch (e) {
      console.error('Error cargando direcciones:', e);
    } finally {
      setCargando(false);
    }
  };

  const guardarDireccion = async () => {
    if (!user) return alert('Debes iniciar sesión');
    if (!nuevaDir.calle || !nuevaDir.ciudad || !nuevaDir.cp) {
      return alert('Por favor completa todos los campos');
    }

    setGuardando(true);
    try {
      // Usamos la nueva API route para evitar el error 23503 (FK constraint)
      // Esta API se encarga de crear el perfil si no existe (Upsert)
      const response = await fetch('/api/perfil/direcciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          nombre: user.user_metadata?.full_name || user.user_metadata?.nombre,
          calle: nuevaDir.calle,
          ciudad: nuevaDir.ciudad,
          cp: nuevaDir.cp,
          esPrincipal: direcciones.length === 0
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setNuevaDir({ calle: '', ciudad: '', cp: '' });
        await cargarDirecciones();
      } else {
        console.error('Error API direcciones:', result);
        alert(result.error || 'Error al guardar la dirección');
      }
    } catch (e: any) {
      console.error('Error:', e);
      alert('Error al conectar con el servidor para guardar la dirección');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarDireccion = async (id: string) => {
    if (!supabase) return;
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) return;

    try {
      const { error } = await supabase.from('direcciones').delete().eq('id', id);
      if (!error) {
        await cargarDirecciones();
      } else {
        alert('Error al eliminar la dirección');
      }
    } catch (e) {
      console.error('Error:', e);
      alert('Error al eliminar la dirección');
    }
  };

  const establecerPrincipal = async (id: string) => {
    if (!supabase) return;

    try {
      // Desmarcar todas como principales
      await supabase.from('direcciones').update({ es_principal: false }).eq('cliente_id', user?.id);
      // Marcar la seleccionada como principal
      await supabase.from('direcciones').update({ es_principal: true }).eq('id', id);
      await cargarDirecciones();
    } catch (e) {
      console.error('Error:', e);
      alert('Error al actualizar la dirección principal');
    }
  };

  if (!user) {
    return (
      <div className="py-12 sm:py-20">
        <Card className="max-w-2xl mx-auto p-12 text-center rounded-[3rem] shadow-2xl shadow-slate-200/50 border-none animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle className="text-yellow-600" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Debes iniciar sesión</h1>
          <p className="text-slate-500 text-lg mb-10 font-medium">Para gestionar tus direcciones, primero debes identificarte.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            Iniciar Sesión
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <MapPin className="text-white" size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Mis Direcciones</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Formulario para nueva dirección */}
          <div className="lg:col-span-2">
            <Card className="p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-none sticky top-24">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Plus className="text-blue-600" size={20} />
                Nueva Dirección
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Calle y Número</label>
                  <input 
                    placeholder="Ej: Calle Principal 123" 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                    value={nuevaDir.calle}
                    onChange={e => setNuevaDir({...nuevaDir, calle: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ciudad</label>
                    <input 
                      placeholder="Ej: Madrid" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                      value={nuevaDir.ciudad}
                      onChange={e => setNuevaDir({...nuevaDir, ciudad: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Código Postal</label>
                    <input 
                      placeholder="Ej: 28001" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                      value={nuevaDir.cp}
                      onChange={e => setNuevaDir({...nuevaDir, cp: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  onClick={guardarDireccion}
                  disabled={guardando}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  {guardando ? 'Guardando...' : 'Añadir Dirección'}
                </button>
              </div>
            </Card>
          </div>

          {/* Lista de direcciones */}
          <div className="lg:col-span-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 ml-1">Tus Direcciones Guardadas</h2>
            {cargando ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : direcciones.length === 0 ? (
              <Card className="p-12 text-center rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-none">
                <MapPin className="text-slate-200 mx-auto mb-4" size={48} />
                <p className="text-slate-500 font-bold">No tienes direcciones guardadas aún.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {direcciones.map((dir) => (
                  <Card key={dir.id} className="p-6 rounded-[2rem] shadow-xl shadow-slate-200/40 border-none hover:shadow-2xl transition-all duration-500 group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <p className="font-black text-slate-900 text-lg">{dir.calle}</p>
                          {dir.es_principal && (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                              <CheckCircle size={12} />
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 font-bold flex items-center gap-2">
                          <Home size={14} className="text-blue-600" />
                          {dir.ciudad}, {dir.cp}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        {!dir.es_principal && (
                          <button
                            onClick={() => establecerPrincipal(dir.id)}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-full transition-all border border-blue-100"
                          >
                            Principal
                          </button>
                        )}
                        <button
                          onClick={() => eliminarDireccion(dir.id)}
                          className="p-3 hover:bg-red-50 rounded-full transition-all text-slate-300 hover:text-red-500"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Volver */}
        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-sm uppercase tracking-widest transition-colors">
            <ArrowLeft size={18} />
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
