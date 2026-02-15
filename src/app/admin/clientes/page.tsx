'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { User as UserIcon, Phone, MapPin, Search, ArrowLeft, Mail } from 'lucide-react';
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
  const [creating, setCreating] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const { addToast } = useToast();

  // Note: create the Supabase client lazily inside functions to avoid runtime errors during build
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      console.warn('Supabase no configurado; no se cargarán clientes.');
      setClientes([]);
      setCargando(false);
      return;
    }

    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const { data, error } = await supabase
      .from('perfiles')
      .select('*, direcciones(*)')
      .order('nombre', { ascending: true });

    if (!error) {
      setClientes(data || []);
    }
    setCargando(false);
  };

  const crearCliente = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      addToast({ message: 'Supabase no está configurado.', type: 'error' });
      return;
    }
    if (!nuevoNombre.trim()) {
      addToast({ message: 'El nombre es obligatorio.', type: 'error' });
      return;
    }
    setCreating(true);
    try {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);

      // If email+password provided, prefer server-side admin endpoint to create user+profile securely
      const payload: any = { nombre: nuevoNombre.trim() };
      if (nuevoTelefono.trim()) payload.telefono = nuevoTelefono.trim();
      if (nuevaDireccion.trim()) payload.direccion = nuevaDireccion.trim();
      if (nuevoEmail.trim()) payload.email = nuevoEmail.trim();

      if (nuevoEmail.trim() && nuevoPassword) {
        // basic client-side validation
        const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailRe.test(nuevoEmail.trim())) {
          addToast({ message: 'Email inválido.', type: 'error' });
          setCreating(false);
          return;
        }
        if (nuevoPassword.length < 6) {
          addToast({ message: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' });
          setCreating(false);
          return;
        }

        // call server-side endpoint which uses service_role key
        const res = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nuevoNombre.trim(), email: nuevoEmail.trim(), password: nuevoPassword, telefono: nuevoTelefono.trim(), direccion: nuevaDireccion.trim() })
        });
        const json = await res.json();
        if (!res.ok) throw json?.error || json;
        addToast({ message: 'Cliente creado correctamente', type: 'success' });
      } else {
        // no auth creation requested — insert profile directly
        const insertRes = await supabase.from('perfiles').insert(payload).select().single();
        if ((insertRes as any).error) throw (insertRes as any).error;
      }
      // refresh list
      setNuevoNombre(''); setNuevoTelefono(''); setNuevaDireccion(''); setNuevoEmail(''); setNuevoPassword('');
      await fetchClientes();
    } catch (err: any) {
      // Improve logging for objects that are empty
      try { console.error('Error creando cliente:', err, JSON.stringify(err)); } catch (_) { console.error('Error creando cliente:', err); }
      const msg = typeof err === 'string' ? err : err?.message || JSON.stringify(err) || 'Error desconocido';
      addToast({ message: `Error creando cliente: ${msg}`, type: 'error' });
    } finally {
      setCreating(false);
    }
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

        {/* Formulario para crear cliente */}
        <form onSubmit={crearCliente} style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} style={{ flex: '1 1 240px', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }} />
          <input placeholder="Email (opcional)" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} style={{ flex: '1 1 240px', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }} />
          <input placeholder="Password (si crea login)" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} style={{ flex: '1 1 200px', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }} />
          <input placeholder="Teléfono" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} style={{ flex: '1 1 180px', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }} />
          <input placeholder="Dirección" value={nuevaDireccion} onChange={(e) => setNuevaDireccion(e.target.value)} style={{ flex: '2 1 320px', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }} />
          <button type="submit" disabled={creating} style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{creating ? 'Creando...' : 'Crear'}</button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.id} style={cardS}>
	              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
	                <div style={iconBoxS}><UserIcon size={24} color="#2563eb" /></div>
	                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{cliente.nombre || 'Invitado'}</h2>
	              </div>
	              <div style={{ fontSize: '14px', color: '#4b5563' }}>
		                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}><Mail size={16} /> {cliente.email || 'Sin email'}</div>
		                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}><Phone size={16} /> {cliente.telefono || 'Sin teléfono'}</div>
		                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px', marginTop: '5px' }}>
		                  <div style={{ display: 'flex', gap: '8px', fontWeight: 'bold', marginBottom: '5px', fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>
		                    <MapPin size={14} /> Direcciones ({cliente.direcciones?.length || 0})
		                  </div>
		                  <div style={{ maxHeight: '80px', overflowY: 'auto', paddingRight: '5px' }}>
		                    {cliente.direcciones && cliente.direcciones.length > 0 ? (
		                      cliente.direcciones.map((d: any, idx: number) => (
		                        <div key={d.id || idx} style={{ fontSize: '13px', marginBottom: '4px', padding: '4px 8px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
		                          {d.calle} {d.es_principal && <span style={{ color: '#2563eb', fontSize: '10px', fontWeight: 'bold' }}>(Principal)</span>}
		                        </div>
		                      ))
		                    ) : (
		                      <div style={{ fontSize: '13px', color: '#9ca3af italic' }}>Sin direcciones registradas</div>
		                    )}
		                  </div>
		                </div>
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