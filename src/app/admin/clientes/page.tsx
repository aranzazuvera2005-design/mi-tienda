'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { User as UserIcon, Phone, MapPin, Search, ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';

// --- ESTILOS ---
const cardS = { 
  backgroundColor: 'white', 
  padding: '25px', 
  borderRadius: '24px', 
  border: '1px solid #e5e7eb', 
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '15px'
};

const iconBoxS = { 
  backgroundColor: '#eff6ff', 
  padding: '12px', 
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default function GestionClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Inicialización del cliente de Supabase directamente
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error) {
      setClientes(data || []);
    }
    setCargando(false);
  };

  const clientesFiltrados = clientes.filter(c => 
    (c.nombre?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
    (c.telefono || '').includes(busqueda)
  );

  if (cargando) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando clientes...</div>;

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', textDecoration: 'none', marginBottom: '20px', fontWeight: 'bold' }}>
          <ArrowLeft size={18} /> Volver al Menú Admin
        </Link>

        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '30px' }}>Gestión de Clientes</h1>

        <div style={{ position: 'relative', marginBottom: '30px' }}>
          <Search style={{ position: 'absolute', left: '15px', top: '12px', color: '#9ca3af' }} size={20} />
          <input 
            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '15px', border: '1px solid #e5e7eb' }} 
            placeholder="Buscar por nombre o teléfono..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.id} style={cardS}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={iconBoxS}><UserIcon size={24} color="#2563eb" /></div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{cliente.nombre || 'Invitado'}</h2>
              </div>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}><Phone size={16} /> {cliente.telefono}</div>
                <div style={{ display: 'flex', gap: '8px' }}><MapPin size={16} /> {cliente.direccion}</div>
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/${cliente.telefono?.replace(/\s+/g, '')}`, '_blank')}
                style={{ width: '100%', padding: '10px', backgroundColor: '#25d366', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                WhatsApp
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}