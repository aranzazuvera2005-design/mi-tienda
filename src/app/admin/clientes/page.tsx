'use client';

import { useEffect, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { User as UserIcon, Phone, MapPin, Search, ArrowLeft, Mail, Trash2, Edit, Save, X, Eye, EyeOff, Lock, RefreshCw } from 'lucide-react';
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
  gap: '15px',
  position: 'relative' as const
};

const iconBoxS = { 
  backgroundColor: '#eff6ff', 
  padding: '12px', 
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const inputS = { padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', width: '100%' };
const inputSmallS = { padding: '5px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%' };
const infoRowS = { display: 'flex', alignItems: 'center', gap: '10px' };
const btnPrimaryS = { padding: '12px', borderRadius: '12px', backgroundColor: '#000', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' };
const btnIconS = { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const btnWhatsappS = { width: '100%', padding: '12px', backgroundColor: '#25d366', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto' };

export default function GestionClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Estados para nuevo cliente
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');

  // Estados para edición
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState('usuario');

  const { addToast } = useToast();

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setCargando(true);
    try {
      const response = await fetch('/api/admin/clientes');
      const data = await response.json();
      if (response.ok) {
        setClientes(data || []);
      } else {
        addToast({ message: data.error || 'Error al cargar clientes', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Error de conexión al cargar clientes', type: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const crearCliente = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!nuevoNombre.trim() || !nuevoEmail.trim() || !nuevoPassword.trim()) {
      addToast({ message: 'Nombre, Email y Password son obligatorios.', type: 'error' });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          email: nuevoEmail.trim(),
          password: nuevoPassword.trim(),
          telefono: nuevoTelefono.trim(),
          direccion: nuevaDireccion.trim()
        })
      });

      const result = await response.json();
      if (response.ok) {
        addToast({ message: 'Cliente creado correctamente', type: 'success' });
        setNuevoNombre('');
        setNuevoEmail('');
        setNuevoPassword('');
        setNuevoTelefono('');
        setNuevaDireccion('');
        fetchClientes();
      } else {
        addToast({ message: result.error || 'Error al crear cliente', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Error al conectar con el servidor', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const eliminarCliente = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente? Se borrará su cuenta de acceso y perfil.')) return;

    try {
      const response = await fetch(`/api/admin/clientes?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        addToast({ message: 'Cliente eliminado', type: 'success' });
        fetchClientes();
      } else {
        const data = await response.json();
        addToast({ message: data.error || 'Error al eliminar', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Error al eliminar cliente', type: 'error' });
    }
  };

  const iniciarEdicion = (cliente: any) => {
    setEditingId(cliente.id);
    setEditNombre(cliente.nombre || '');
    setEditEmail(cliente.email || '');
    setEditTelefono(cliente.telefono || '');
    setEditRol(cliente.rol || 'usuario');
  };

  const guardarEdicion = async (id: string) => {
    try {
      const response = await fetch('/api/admin/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          nombre: editNombre.trim(),
          email: editEmail.trim(),
          telefono: editTelefono.trim(),
          rol: editRol
        })
      });

      if (response.ok) {
        addToast({ message: 'Cliente actualizado correctamente', type: 'success' });
        setEditingId(null);
        fetchClientes();
      } else {
        const data = await response.json();
        addToast({ message: data.error || 'Error al actualizar', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Error al conectar con el servidor', type: 'error' });
    }
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // BÚSQUEDA MEJORADA: Normalizamos para evitar problemas con mayúsculas/minúsculas
  const clientesFiltrados = clientes.filter(c => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return true;
    
    const nombre = (c.nombre || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const telefono = (c.telefono || '').toLowerCase();
    
    return nombre.includes(term) || email.includes(term) || telefono.includes(term);
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', textDecoration: 'none', marginBottom: '20px', fontWeight: 'bold' }}>
          <ArrowLeft size={18} /> Volver al Menú Admin
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0 }}>Panel de Clientes v2.0</h1>
            <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>Gestión completa de usuarios y perfiles</p>
          </div>
          <button onClick={fetchClientes} style={{ ...btnIconS, backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '10px' }}>
            <RefreshCw size={20} className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: '30px' }}>
          <Search style={{ position: 'absolute', left: '15px', top: '12px', color: '#9ca3af' }} size={20} />
          <input 
            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '15px', border: '2px solid #000', fontSize: '16px', outline: 'none' }} 
            placeholder="Buscar por nombre, email o teléfono..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={{ ...cardS, marginBottom: '40px', border: '2px dashed #2563eb', backgroundColor: '#f0f7ff' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>Registrar Nuevo Cliente</h3>
          <form onSubmit={crearCliente} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <input placeholder="Nombre Completo *" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} style={inputS} required />
            <input placeholder="Email *" type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} style={inputS} required />
            <input placeholder="Password *" type="text" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} style={inputS} required />
            <input placeholder="Teléfono" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} style={inputS} />
            <input placeholder="Dirección Inicial" value={nuevaDireccion} onChange={(e) => setNuevaDireccion(e.target.value)} style={{ ...inputS, gridColumn: 'span 2' }} />
            <button type="submit" disabled={creating} style={{ ...btnPrimaryS, gridColumn: 'span 2', backgroundColor: '#2563eb' }}>
              {creating ? 'Registrando...' : 'Crear Cliente'}
            </button>
          </form>
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <RefreshCw size={40} className="animate-spin" style={{ margin: '0 auto', color: '#2563eb' }} />
            <p>Cargando base de datos...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#4b5563' }}>
              {clientesFiltrados.length === 0 ? 'No se encontraron clientes' : `Mostrando ${clientesFiltrados.length} clientes`}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.id} style={cardS}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={iconBoxS}><UserIcon size={24} color="#2563eb" /></div>
                      <div>
                        {editingId === cliente.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} style={inputSmallS} placeholder="Nombre" />
                            <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={inputSmallS} placeholder="Email" />
                            <select value={editRol} onChange={(e) => setEditRol(e.target.value)} style={inputSmallS}>
                              <option value="usuario">Usuario</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{cliente.nombre || 'Invitado'}</h2>
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '2px 6px', 
                              borderRadius: '10px', 
                              backgroundColor: cliente.rol === 'admin' ? '#fee2e2' : '#f3f4f6',
                              color: cliente.rol === 'admin' ? '#dc2626' : '#4b5563',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {cliente.rol || 'usuario'}
                            </span>
                          </div>
                        )}
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>ID: {cliente.id.substring(0,8)}...</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {editingId === cliente.id ? (
                        <>
                          <button onClick={() => guardarEdicion(cliente.id)} style={btnIconS} title="Guardar"><Save size={18} color="green" /></button>
                          <button onClick={() => setEditingId(null)} style={btnIconS} title="Cancelar"><X size={18} color="red" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => iniciarEdicion(cliente)} style={btnIconS} title="Editar"><Edit size={18} color="#6b7280" /></button>
                          <button onClick={() => eliminarCliente(cliente.id)} style={btnIconS} title="Eliminar"><Trash2 size={18} color="#ef4444" /></button>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={infoRowS}>
                      <Mail size={16} color="#9ca3af" /> 
                      {editingId === cliente.id ? (
                        <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={inputSmallS} />
                      ) : (
                        <span>{cliente.email || 'Sin email'}</span>
                      )}
                    </div>
                    
                    <div style={infoRowS}>
                      <Phone size={16} color="#9ca3af" /> 
                      {editingId === cliente.id ? (
                        <input value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} style={inputSmallS} />
                      ) : (
                        <span>{cliente.telefono || 'Sin teléfono'}</span>
                      )}
                    </div>

                    <div style={{ ...infoRowS, backgroundColor: '#fefce8', padding: '8px', borderRadius: '8px', border: '1px solid #fef08a' }}>
                      <Lock size={16} color="#ca8a04" />
                      <span style={{ fontWeight: 'bold', color: '#854d0e' }}>Password:</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {showPasswords[cliente.id] ? (cliente.password_placeholder === '********' ? 'Ver en Auth' : cliente.password_placeholder) : '••••••••'}
                      </span>
                      <button onClick={() => togglePassword(cliente.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
                        {showPasswords[cliente.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '15px', marginTop: '5px' }}>
                      <div style={{ display: 'flex', gap: '8px', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>
                        <MapPin size={14} /> Direcciones ({cliente.direcciones?.length || 0})
                      </div>
                      <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {cliente.direcciones && cliente.direcciones.length > 0 ? (
                          cliente.direcciones.map((d: any, idx: number) => (
                            <div key={d.id || idx} style={{ fontSize: '13px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                              {d.calle} {d.es_principal && <span style={{ color: '#2563eb', fontSize: '10px', fontWeight: 'bold' }}>(Principal)</span>}
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>Sin direcciones registradas</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => window.open(`https://wa.me/${cliente.telefono?.replace(/\s+/g, '')}`, '_blank')}
                    style={btnWhatsappS}
                  >
                    Contactar por WhatsApp
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
