'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { User as UserIcon, MapPin, Save, AlertCircle, RefreshCw } from 'lucide-react';

export default function GestionClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordsInput, setPasswordsInput] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const fetchClientes = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/clientes');
      const data = await res.json();

      if (!res.ok) {
        console.error('[GestionClientes] Error API:', data);
        setError(data?.error || 'Error al cargar clientes');
        setClientes([]);
        return;
      }

      if (!Array.isArray(data)) {
        console.error('[GestionClientes] Respuesta inesperada:', data);
        setError('Respuesta inesperada del servidor');
        setClientes([]);
        return;
      }

      setClientes(data);
    } catch (e: any) {
      console.error('[GestionClientes] Error de red:', e);
      setError('Error de conexión al cargar clientes');
      addToast({ message: 'Error de carga', type: 'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleUpdatePassword = async (id: string) => {
    const pwd = passwordsInput[id];
    if (!pwd || pwd.length < 6) return addToast({ message: 'Mínimo 6 caracteres', type: 'error' });

    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: pwd })
      });
      if (res.ok) {
        addToast({ message: 'Contraseña cambiada', type: 'success' });
        setPasswordsInput({ ...passwordsInput, [id]: '' });
      } else {
        const err = await res.json();
        addToast({ message: err?.error || 'Error al cambiar contraseña', type: 'error' });
      }
    } catch (e) { addToast({ message: 'Error al cambiar', type: 'error' }); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">Gestión de Clientes</h1>
        <button
          onClick={fetchClientes}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors"
        >
          <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Estado de carga */}
      {cargando && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">Cargando clientes...</span>
        </div>
      )}

      {/* Error */}
      {!cargando && error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
          <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="font-bold text-red-700">Error al cargar clientes</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <p className="text-red-500 text-xs mt-2">Revisa que SUPABASE_SERVICE_ROLE_KEY esté configurada en las variables de entorno de Vercel.</p>
          </div>
        </div>
      )}

      {/* Sin clientes */}
      {!cargando && !error && clientes.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <UserIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No hay clientes registrados</p>
          <p className="text-sm mt-1">La tabla perfiles está vacía o sin datos.</p>
        </div>
      )}

      {/* Lista de clientes */}
      {!cargando && !error && clientes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clientes.map(cliente => (
            <div key={cliente.id} className="bg-white p-6 rounded-3xl border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-full"><UserIcon className="text-blue-600" /></div>
                <div>
                  <h2 className="font-bold">{cliente.nombre || '(Sin nombre)'}</h2>
                  {cliente.email && <p className="text-xs text-gray-400">{cliente.email}</p>}
                </div>
              </div>
              
              {/* Listado de Direcciones */}
              <div className="mb-4 text-xs text-gray-500">
                <p className="font-bold flex items-center gap-1 mb-2">
                  <MapPin size={12}/> DIRECCIONES ({cliente.direcciones?.length || 0})
                </p>
                {cliente.direcciones?.map((d: any) => (
                  <div key={d.id} className="bg-gray-50 p-2 rounded mb-1 border border-gray-100">{d.calle}</div>
                ))}
                {(!cliente.direcciones || cliente.direcciones.length === 0) && (
                  <span className="text-gray-300 italic">Sin direcciones</span>
                )}
              </div>

              {/* Cambio de contraseña */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                <label className="text-[10px] font-black text-yellow-700 uppercase mb-2 block">Nueva Contraseña</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="w-full text-xs p-2 rounded-lg border border-yellow-200 outline-none"
                    placeholder="Mínimo 6 caracteres..."
                    value={passwordsInput[cliente.id] || ''}
                    onChange={e => setPasswordsInput({...passwordsInput, [cliente.id]: e.target.value})}
                  />
                  <button 
                    onClick={() => handleUpdatePassword(cliente.id)}
                    className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-black transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
