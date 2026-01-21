'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MapPin, Plus } from 'lucide-react';

export default function MisDirecciones() {
  const [nuevaDir, setNuevaDir] = useState({ calle: '', ciudad: '', cp: '' });
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const guardarDireccion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Debes iniciar sesión");

    const { error } = await supabase.from('direcciones').insert([
      { ...nuevaDir, cliente_id: user.id }
    ]);

    if (!error) {
      alert("Dirección guardada");
      setNuevaDir({ calle: '', ciudad: '', cp: '' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-3xl font-black mb-8 flex items-center gap-2">
        <MapPin /> Mis Direcciones
      </h2>
      
      <div className="bg-gray-50 p-6 rounded-3xl border space-y-4">
        <input 
          placeholder="Calle y Número" 
          className="w-full p-4 rounded-xl border"
          value={nuevaDir.calle}
          onChange={e => setNuevaDir({...nuevaDir, calle: e.target.value})}
        />
        <div className="grid grid-cols-2 gap-4">
          <input 
            placeholder="Ciudad" 
            className="p-4 rounded-xl border"
            value={nuevaDir.ciudad}
            onChange={e => setNuevaDir({...nuevaDir, ciudad: e.target.value})}
          />
          <input 
            placeholder="Código Postal" 
            className="p-4 rounded-xl border"
            value={nuevaDir.cp}
            onChange={e => setNuevaDir({...nuevaDir, cp: e.target.value})}
          />
        </div>
        <button 
          onClick={guardarDireccion}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Añadir Nueva Dirección
        </button>
      </div>
    </div>
  );
}