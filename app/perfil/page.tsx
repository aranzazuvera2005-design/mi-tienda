'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MapPin, Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft, Home, User as UserIcon, Mail, Phone, Save, Edit, Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export default function MiPerfil() {
  const { user, perfil: perfilCtx } = useCart();
  const { addToast } = useToast();

  // Datos personales
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Direcciones
  const [nuevaDir, setNuevaDir] = useState({ calle: '', ciudad: '', cp: '' });
  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoDir, setGuardandoDir] = useState(false);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  useEffect(() => {
    if (!user || !supabase) { setCargando(false); return; }
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    if (!supabase || !user) return;
    setCargando(true);
    try {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre, telefono')
        .eq('id', user.id)
        .single();
      if (perfil) {
        setNombre(perfil.nombre || '');
        setTelefono(perfil.telefono || '');
      }
      const { data: dirs } = await supabase
        .from('direcciones')
        .select('*')
        .eq('cliente_id', user.id)
        .order('es_principal', { ascending: false });
      setDirecciones(dirs || []);
    } catch (e) {
      console.error('Error cargando datos:', e);
    } finally {
      setCargando(false);
    }
  };

  const guardarPerfil = async () => {
    if (!supabase || !user) return;
    setGuardandoPerfil(true);
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ nombre, telefono, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      addToast({ message: 'Perfil actualizado correctamente', type: 'success' });
      setEditando(false);
    } catch (e: any) {
      addToast({ message: e.message || 'Error al guardar', type: 'error' });
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const guardarDireccion = async () => {
    if (!user) return;
    if (!nuevaDir.calle || !nuevaDir.ciudad || !nuevaDir.cp) {
      return addToast({ message: 'Completa todos los campos de la dirección', type: 'error' });
    }
    setGuardandoDir(true);
    try {
      const res = await fetch('/api/perfil/direcciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          nombre,
          calle: nuevaDir.calle,
          ciudad: nuevaDir.ciudad,
          cp: nuevaDir.cp,
          esPrincipal: direcciones.length === 0
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setNuevaDir({ calle: '', ciudad: '', cp: '' });
        await cargarDatos();
        addToast({ message: 'Dirección añadida', type: 'success' });
      } else {
        addToast({ message: result.error || 'Error al guardar', type: 'error' });
      }
    } catch (e: any) {
      addToast({ message: 'Error de conexión', type: 'error' });
    } finally {
      setGuardandoDir(false);
    }
  };

  const eliminarDireccion = async (id: string) => {
    if (!supabase || !confirm('¿Eliminar esta dirección?')) return;
    try {
      const { error } = await supabase.from('direcciones').delete().eq('id', id);
      if (!error) { await cargarDatos(); addToast({ message: 'Dirección eliminada', type: 'success' }); }
      else addToast({ message: 'Error al eliminar', type: 'error' });
    } catch { addToast({ message: 'Error al eliminar', type: 'error' }); }
  };

  const establecerPrincipal = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('direcciones').update({ es_principal: false }).eq('cliente_id', user?.id);
      await supabase.from('direcciones').update({ es_principal: true }).eq('id', id);
      await cargarDatos();
      addToast({ message: 'Dirección principal actualizada', type: 'success' });
    } catch { addToast({ message: 'Error al actualizar', type: 'error' }); }
  };

  if (!user) {
    return (
      <div className="py-12 sm:py-20">
        <Card className="max-w-2xl mx-auto p-12 text-center rounded-[3rem] shadow-2xl shadow-slate-200/50 border-none animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-yellow-600" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Debes iniciar sesión</h1>
          <p className="text-slate-500 text-lg mb-10 font-medium">Para ver tu perfil, primero debes identificarte.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            Iniciar Sesión
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-xs uppercase tracking-widest mb-8 transition-colors">
          <ArrowLeft size={16} /> Volver a la tienda
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 text-white font-black text-2xl">
            {(nombre || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Mi Perfil</h1>
            <p className="text-slate-400 font-medium text-sm">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── DATOS PERSONALES ── */}
          <Card className="p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-none">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <UserIcon size={20} className="text-blue-600" /> Datos Personales
              </h2>
              {!editando ? (
                <button onClick={() => setEditando(true)} className="flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-colors">
                  <Edit size={14} /> Editar
                </button>
              ) : (
                <button onClick={() => setEditando(false)} className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
                  Cancelar
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Email (solo lectura) */}
              <div>
                <label className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Mail size={11} /> Email
                </label>
                <div className="px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-500 text-sm">
                  {user.email}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <UserIcon size={11} /> Nombre
                </label>
                {editando ? (
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                  />
                ) : (
                  <div className="px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800">
                    {nombre || <span className="text-slate-400 font-medium italic">Sin nombre</span>}
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Phone size={11} /> Teléfono
                </label>
                {editando ? (
                  <input
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    placeholder="Tu teléfono"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                  />
                ) : (
                  <div className="px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800">
                    {telefono || <span className="text-slate-400 font-medium italic">Sin teléfono</span>}
                  </div>
                )}
              </div>

              {editando && (
                <button
                  onClick={guardarPerfil}
                  disabled={guardandoPerfil}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50"
                >
                  {guardandoPerfil ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {guardandoPerfil ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              )}
            </div>

            {/* Links a secciones */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3">
              <Link href="/perfil/mis-pedidos" className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-slate-600">
                Mis Pedidos
              </Link>
              <Link href="/perfil/mis-devoluciones" className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-slate-600">
                Devoluciones
              </Link>
            </div>
          </Card>

          {/* ── DIRECCIONES ── */}
          <div className="space-y-6">
            {/* Formulario nueva dirección */}
            <Card className="p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-none">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Plus size={20} className="text-blue-600" /> Nueva Dirección
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Calle y Número</label>
                  <input
                    placeholder="Ej: Calle Principal 123"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                    value={nuevaDir.calle}
                    onChange={e => setNuevaDir({ ...nuevaDir, calle: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ciudad</label>
                    <input
                      placeholder="Madrid"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                      value={nuevaDir.ciudad}
                      onChange={e => setNuevaDir({ ...nuevaDir, ciudad: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Código Postal</label>
                    <input
                      placeholder="28001"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800"
                      value={nuevaDir.cp}
                      onChange={e => setNuevaDir({ ...nuevaDir, cp: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  onClick={guardarDireccion}
                  disabled={guardandoDir}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50"
                >
                  {guardandoDir ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {guardandoDir ? 'Añadiendo...' : 'Añadir Dirección'}
                </button>
              </div>
            </Card>

            {/* Lista de direcciones */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                Direcciones Guardadas ({direcciones.length})
              </h3>
              {cargando ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : direcciones.length === 0 ? (
                <Card className="p-8 text-center rounded-[2rem] shadow-xl shadow-slate-200/40 border-none">
                  <MapPin className="text-slate-200 mx-auto mb-3" size={40} />
                  <p className="text-slate-400 font-bold text-sm">Sin direcciones guardadas</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {direcciones.map(dir => (
                    <Card key={dir.id} className="p-5 rounded-[2rem] shadow-lg shadow-slate-200/40 border-none hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-black text-slate-900">{dir.calle}</p>
                            {dir.es_principal && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                <CheckCircle size={10} /> Principal
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 font-bold text-sm flex items-center gap-1">
                            <Home size={12} className="text-blue-600" /> {dir.ciudad}, {dir.cp}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!dir.es_principal && (
                            <button
                              onClick={() => establecerPrincipal(dir.id)}
                              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-blue-100"
                            >
                              Principal
                            </button>
                          )}
                          <button
                            onClick={() => eliminarDireccion(dir.id)}
                            className="p-2 hover:bg-red-50 rounded-xl transition-all text-slate-300 hover:text-red-500"
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
          </div>
        </div>
      </div>
    </div>
  );
}
