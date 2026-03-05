'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  // Usamos una variable interna para no chocar con el servidor
  const supabase = createClientComponentClient(); 

  useEffect(() => {
    // Solo pedimos el usuario cuando el navegador ya está listo
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
      } catch (e) {
        console.error("Error de conexión con Supabase");
      }
    };
    checkUser();
  }, []);

  return (
    <header className="bg-white border-b h-20 flex items-center px-8 justify-between">
      <div className="text-2xl font-bold text-blue-600">MI TIENDA</div>
      {user ? (
        <span className="bg-slate-100 px-4 py-2 rounded-full text-sm">{user.email}</span>
      ) : (
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold">Entrar</button>
      )}
    </header>
  );
}
