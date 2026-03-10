'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MapPin, Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft, Home } from 'lucide-react';
import Card from '@/components/Card';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function MisDirecciones() {
  const [nuevaDir, setNuevaDir] = useState({ calle: '', ciudad: '', cp: '' });
  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { user } = useCart();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (user) cargarDirecciones();
    else setCargando(false);
  }, [user]);

  const cargarDirecciones = async () => {
    try {
      const { data, error } = await supabase
        .from('direcciones')
        .select('*')
        .eq('cliente_id', user?.id)
        .order('es_principal', { ascending: false });
      
      if (error) throw error;
      setDirecciones(data || []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setCargando(false);
    }
  };

  const guardarDireccion = async () => {
    if (!user) return alert('Sesión expirada');
    if (!nuevaDir.calle || !nuevaDir.ciudad || !nuevaDir.cp) return alert('Completa los campos');

    setGuardando(true);
    try {
      const response = await fetch('/api/perfil/direcciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          nombre: user.user_metadata?.full_name,
          ...nuevaDir,
          esPrincipal: direcciones.length === 0
        }),
      });

      if (response.ok) {
        setNuevaDir({ calle: '', ciudad: '', cp: '' });
        await cargarDirecciones();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al guardar');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarDireccion = async (id: string) => {
    if (!confirm('¿Eliminar dirección?')) return;
    const { error } = await supabase.from('direcciones').delete().eq('id', id);
    if (!error) cargarDirecciones();
  };

  const establecerPrincipal = async (id: string) => {
    await supabase.from('direcciones').update({ es_principal: false }).eq('cliente_id', user?.id);
    await supabase.from('direcciones').update({ es_principal: true }).eq('id', id);
    cargarDirecciones();
  };

  // ... (Manten tu JSX de retorno igual, ya es correcto estructuralmente)
}
