'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MapPin, Plus, Trash2, CheckCircle } from 'lucide-react';
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
    if (!supabase || !user) return alert('Debes iniciar sesión');
    if (!nuevaDir.calle || !nuevaDir.ciudad || !nuevaDir.cp) {
      return alert('Por favor completa todos los campos');
    }

    setGuardando(true);
    try {
      const { error } = await supabase.from('direcciones').insert([
        { ...nuevaDir, cliente_id: user.id, es_principal: direcciones.length === 0 }
      ]);

      if (!error) {
        setNuevaDir({ calle: '', ciudad: '', cp: '' });
        await cargarDirecciones();
      } else {
        alert('Error al guardar la dirección');
      }
    } catch (e) {
      console.error('Error:', e);
      alert('Error al guardar la dirección');
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
      <div className="py-12">
        <Card className="p-8 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-4">
            <MapPin className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-extrabold text-yellow-900 text-lg">Debes iniciar sesión</h3>
              <p className="text-yellow-800 text-sm mt-1">Para gestionar tus direcciones, inicia sesión primero.</p>
              <Link href="/login" className="inline-block mt-4 text-yellow-700 font-bold hover:underline">
                Ir a login →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto">
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-xl">
            <MapPin className="text-blue-600" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Mis Direcciones</h1>
        </div>

        {/* Formulario para nueva dirección */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">Añadir Nueva Dirección</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Calle y Número</label>
              <input 
                placeholder="Ej: Calle Principal 123, 4º B" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={nuevaDir.calle}
                onChange={e => setNuevaDir({...nuevaDir, calle: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ciudad</label>
                <input 
                  placeholder="Ej: Madrid" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={nuevaDir.ciudad}
                  onChange={e => setNuevaDir({...nuevaDir, ciudad: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Código Postal</label>
                <input 
                  placeholder="Ej: 28001" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={nuevaDir.cp}
                  onChange={e => setNuevaDir({...nuevaDir, cp: e.target.value})}
                />
              </div>
            </div>
            <button 
              onClick={guardarDireccion}
              disabled={guardando}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-slate-300"
            >
              <Plus size={20} /> {guardando ? 'Guardando...' : 'Añadir Nueva Dirección'}
            </button>
          </div>
        </Card>

        {/* Lista de direcciones */}
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">Tus Direcciones</h2>
          {cargando ? (
            <Card className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-slate-600">Cargando direcciones...</p>
            </Card>
          ) : direcciones.length === 0 ? (
            <Card className="p-8 text-center">
              <MapPin className="text-slate-300 mx-auto mb-3" size={40} />
              <p className="text-slate-600">No tienes direcciones guardadas aún.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {direcciones.map((dir) => (
                <Card key={dir.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-extrabold text-slate-900">{dir.calle}</p>
                        {dir.es_principal && (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                            <CheckCircle size={14} />
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{dir.ciudad}, {dir.cp}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!dir.es_principal && (
                        <button
                          onClick={() => establecerPrincipal(dir.id)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Establecer como principal
                        </button>
                      )}
                      <button
                        onClick={() => eliminarDireccion(dir.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Volver */}
        <div className="mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
