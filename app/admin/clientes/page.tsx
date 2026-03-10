'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { User as UserIcon, Phone, MapPin, Search, ArrowLeft, Mail, Trash2, Edit, Save, X, Lock, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function GestionClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [passwordsInput, setPasswordsInput] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const fetchClientes = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/clientes');
      const data = await res.json();
      setClientes(data);
    } catch (e) { addToast({ message: 'Error de carga', type: 'error' }); }
    finally { setCargando(false); }
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleUpdatePassword = async (id: string) => {
    const pwd = passwordsInput[id];
    if (!pwd || pwd.length < 6) return addToast({ message: 'Mínimo 6 caracteres', type: 'error' });

    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'PUT',
        body: JSON.stringify({ id, password: pwd })
      });
      if (res.ok) {
        addToast({ message: 'Contraseña cambiada', type: 'success' });
        setPasswordsInput({ ...passwordsInput, [id]: '' });
      }
    } catch (e) { addToast({ message: 'Error al cambiar', type: 'error' }); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black mb-8">Gestión de Clientes</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clientes.map(cliente => (
          <div key={cliente.id} className="bg-white p-6 rounded-3xl border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-full"><UserIcon className="text-blue-600" /></div>
              <h2 className="font-bold">{cliente.nombre}</h2>
            </div>
            
            {/* Listado de Direcciones Dinámico */}
            <div className="mb-4 text-xs text-gray-500">
              <p className="font-bold flex items-center gap-1 mb-2"><MapPin size={12}/> DIRECCIONES ({cliente.direcciones?.length || 0})</p>
              {cliente.direcciones?.map((d: any) => (
                <div key={d.id} className="bg-gray-50 p-2 rounded mb-1 border border-gray-100">{d.calle}</div>
              ))}
            </div>

            {/* CAMBIO DE CONTRASEÑA RÁPIDO */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
              <label className="text-[10px] font-black text-yellow-700 uppercase mb-2 block">Nueva Contraseña</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  className="w-full text-xs p-2 rounded-lg border border-yellow-200 outline-none"
                  placeholder="Escribe aquí..."
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
    </div>
  );
}
