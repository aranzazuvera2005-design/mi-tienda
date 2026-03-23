'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import { useToast } from '@/context/ToastContext';
import {
  User as UserIcon, Phone, MapPin, Search, ArrowLeft, Mail,
  Trash2, Edit, Save, X, Eye, EyeOff, Lock, RefreshCw,
  CheckCircle2, ShoppingBag, Clock, Bell, ChevronDown, ChevronUp,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import Link from 'next/link';

type SortField = 'nombre' | 'email' | 'pedidos' | 'articulos' | 'devoluciones';
type SortDir = 'asc' | 'desc';

// Umbral para marcar cliente frecuente
const UMBRAL_FRECUENTE = 3;

export default function GestionClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [passwordsInput, setPasswordsInput] = useState<Record<string, string>>({});
  const [pedidosCliente, setPedidosCliente] = useState<Record<string, any[]>>({});
  const [loadingPedidos, setLoadingPedidos] = useState<Record<string, boolean>>({});
  const [expandedPedidos, setExpandedPedidos] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [alertasFrecuente, setAlertasFrecuente] = useState<Record<string, boolean>>({});

  // Nuevo cliente
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');

  // Edición
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState('usuario');

  const { addToast } = useToast();

  const fetchClientes = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/clientes');
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Error al cargar clientes'); setClientes([]); return; }
      if (!Array.isArray(data)) { setError('Respuesta inesperada del servidor'); setClientes([]); return; }
      setClientes(data);
      // Detectar clientes frecuentes al cargar
      const nuevasAlertas: Record<string, boolean> = {};
      data.forEach((c: any) => {
        if ((c.total_pedidos || 0) >= UMBRAL_FRECUENTE) {
          nuevasAlertas[c.id] = true;
        }
      });
      setAlertasFrecuente(nuevasAlertas);
    } catch (e: any) {
      setError('Error de conexión al cargar clientes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { fetchClientes(); }, []);

  const crearCliente = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!nuevoNombre.trim() || !nuevoEmail.trim() || !nuevoPassword.trim()) {
      addToast({ message: 'Nombre, Email y Password son obligatorios.', type: 'error' }); return;
    }
    setCreating(true);
    try {
      const res = await adminFetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim(), email: nuevoEmail.trim(), password: nuevoPassword.trim(), telefono: nuevoTelefono.trim(), direccion: nuevaDireccion.trim() })
      });
      const result = await res.json();
      if (res.ok) {
        addToast({ message: 'Cliente creado correctamente', type: 'success' });
        setNuevoNombre(''); setNuevoEmail(''); setNuevoPassword(''); setNuevoTelefono(''); setNuevaDireccion('');
        fetchClientes();
      } else {
        addToast({ message: result.error || 'Error al crear cliente', type: 'error' });
      }
    } catch { addToast({ message: 'Error al conectar con el servidor', type: 'error' }); }
    finally { setCreating(false); }
  };

  const eliminarCliente = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente? Se borrará su cuenta y perfil.')) return;
    try {
      const res = await adminFetch(`/api/admin/clientes?id=${id}`, { method: 'DELETE' });
      if (res.ok) { addToast({ message: 'Cliente eliminado', type: 'success' }); fetchClientes(); }
      else { const d = await res.json(); addToast({ message: d.error || 'Error al eliminar', type: 'error' }); }
    } catch { addToast({ message: 'Error al eliminar cliente', type: 'error' }); }
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
      const res = await adminFetch('/api/admin/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nombre: editNombre.trim(), email: editEmail.trim(), telefono: editTelefono.trim(), rol: editRol })
      });
      if (res.ok) { addToast({ message: 'Cliente actualizado', type: 'success' }); setEditingId(null); fetchClientes(); }
      else { const d = await res.json(); addToast({ message: d.error || 'Error al actualizar', type: 'error' }); }
    } catch { addToast({ message: 'Error al conectar con el servidor', type: 'error' }); }
  };

  const handleUpdatePassword = async (id: string) => {
    const pwd = passwordsInput[id];
    if (!pwd || pwd.length < 6) return addToast({ message: 'Mínimo 6 caracteres', type: 'error' });
    try {
      const res = await adminFetch('/api/admin/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: pwd })
      });
      if (res.ok) { addToast({ message: 'Contraseña cambiada', type: 'success' }); setPasswordsInput({ ...passwordsInput, [id]: '' }); }
      else { const d = await res.json(); addToast({ message: d.error || 'Error al cambiar contraseña', type: 'error' }); }
    } catch { addToast({ message: 'Error al cambiar contraseña', type: 'error' }); }
  };

  const togglePassword = (id: string) => setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));

  const cargarPedidos = async (clienteId: string) => {
    if (expandedPedidos[clienteId]) {
      setExpandedPedidos(prev => ({ ...prev, [clienteId]: false }));
      return;
    }
    setLoadingPedidos(prev => ({ ...prev, [clienteId]: true }));
    try {
      const res = await adminFetch(`/api/admin/pedidos?cliente_id=${clienteId}&limit=50&page=1`);
      const data = await res.json();
      const pedidos = data.data || [];
      setPedidosCliente(prev => ({ ...prev, [clienteId]: pedidos }));
      setExpandedPedidos(prev => ({ ...prev, [clienteId]: true }));
      // Actualizar alarma si tiene pedidos suficientes
      if (pedidos.length >= UMBRAL_FRECUENTE) {
        setAlertasFrecuente(prev => ({ ...prev, [clienteId]: true }));
        addToast({ message: `🔔 Cliente frecuente: ${pedidos.length} pedidos realizados`, type: 'info' });
      }
    } catch {
      addToast({ message: 'Error al cargar pedidos', type: 'error' });
    } finally {
      setLoadingPedidos(prev => ({ ...prev, [clienteId]: false }));
    }
  };

  const formatFecha = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="text-gray-300" />;
    return sortDir === 'asc' ? <ArrowUp size={13} className="text-blue-600" /> : <ArrowDown size={13} className="text-blue-600" />;
  };

  const clientesFiltradosOrdenados = clientes
    .filter(c => {
      const term = busqueda.toLowerCase().trim();
      if (!term) return true;
      return (c.nombre || '').toLowerCase().includes(term)
        || (c.email || '').toLowerCase().includes(term)
        || (c.telefono || '').toLowerCase().includes(term);
    })
    .sort((a, b) => {
      let va: any, vb: any;
      switch (sortField) {
        case 'nombre': va = (a.nombre || '').toLowerCase(); vb = (b.nombre || '').toLowerCase(); break;
        case 'email': va = (a.email || '').toLowerCase(); vb = (b.email || '').toLowerCase(); break;
        case 'pedidos': va = a.total_pedidos || 0; vb = b.total_pedidos || 0; break;
        case 'articulos': va = a.total_articulos || 0; vb = b.total_articulos || 0; break;
        case 'devoluciones': va = a.total_devoluciones || 0; vb = b.total_devoluciones || 0; break;
        default: va = ''; vb = '';
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 font-bold transition-colors">
          <ArrowLeft size={18} /> Volver al Panel
        </Link>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900">Panel de Clientes</h1>
            <p className="text-gray-500 mt-1 text-sm">Gestión completa · {clientes.length} clientes</p>
          </div>
          <button onClick={fetchClientes} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw size={20} className={cargando ? 'animate-spin text-blue-600' : 'text-gray-500'} />
          </button>
        </div>

        {/* Buscador */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input
            className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-blue-500 text-sm outline-none transition-colors bg-white"
            placeholder="Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Ordenación */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">Ordenar por:</span>
          {([
            { field: 'nombre', label: 'Nombre' },
            { field: 'email', label: 'Email' },
            { field: 'pedidos', label: 'Nº Pedidos' },
            { field: 'articulos', label: 'Nº Artículos' },
            { field: 'devoluciones', label: 'Nº Devoluciones' },
          ] as { field: SortField; label: string }[]).map(({ field, label }) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortField === field
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
              <SortIcon field={field} />
            </button>
          ))}
        </div>

        {/* Formulario nuevo cliente */}
        <div className="bg-blue-50 p-6 rounded-xl border-2 border-dashed border-blue-300 mb-8">
          <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4">Registrar Nuevo Cliente</h3>
          <form onSubmit={crearCliente} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input placeholder="Nombre Completo *" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" required />
            <input placeholder="Email *" type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" required />
            <input placeholder="Password *" type="text" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" required />
            <input placeholder="Teléfono" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            <input placeholder="Dirección Inicial" value={nuevaDireccion} onChange={(e) => setNuevaDireccion(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white sm:col-span-2 lg:col-span-1" />
            <button type="submit" disabled={creating} className="sm:col-span-2 lg:col-span-3 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-black text-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
              {creating ? 'Registrando...' : '+ Crear Cliente'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm font-bold">
            Error: {error}
          </div>
        )}

        {cargando ? (
          <div className="text-center py-16">
            <RefreshCw size={40} className="animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Cargando clientes...</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              {clientesFiltradosOrdenados.length === 0 ? 'Sin resultados' : `${clientesFiltradosOrdenados.length} cliente${clientesFiltradosOrdenados.length !== 1 ? 's' : ''}`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {clientesFiltradosOrdenados.map((cliente) => {
                const esFrecuente = alertasFrecuente[cliente.id] || (cliente.total_pedidos || 0) >= UMBRAL_FRECUENTE;
                const pedidosCount = pedidosCliente[cliente.id]?.length ?? (cliente.total_pedidos || 0);

                return (
                  <div key={cliente.id} className={`bg-white rounded-2xl border shadow-sm flex flex-col gap-0 overflow-hidden transition-all ${esFrecuente ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'}`}>

                    {/* Alerta cliente frecuente */}
                    {esFrecuente && (
                      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
                        <Bell size={13} className="text-amber-500 flex-shrink-0" />
                        <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Cliente Frecuente · {pedidosCount} pedidos</span>
                      </div>
                    )}

                    <div className="p-5 flex flex-col gap-4 flex-1">
                      {/* Cabecera */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <UserIcon size={20} className="text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            {editingId === cliente.id ? (
                              <input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="px-2 py-1 rounded-lg border border-gray-200 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre" />
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="font-black text-gray-900 text-base truncate">{cliente.nombre || 'Invitado'}</h2>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${cliente.rol === 'admin' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                  {cliente.rol || 'usuario'}
                                </span>
                              </div>
                            )}
                            <span className="text-[10px] text-gray-400 font-mono">ID: {cliente.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {editingId === cliente.id ? (
                            <>
                              <button onClick={() => guardarEdicion(cliente.id)} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"><Save size={16} className="text-green-600" /></button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><X size={16} className="text-red-500" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => iniciarEdicion(cliente)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Edit size={16} className="text-gray-400" /></button>
                              <button onClick={() => eliminarCliente(cliente.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} className="text-red-400" /></button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={14} className="text-gray-400 flex-shrink-0" />
                          {editingId === cliente.id ? (
                            <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="px-2 py-1 rounded-lg border border-gray-200 text-sm flex-1 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" />
                          ) : (
                            <span className="truncate">{cliente.email || 'Sin email'}</span>
                          )}
                          {cliente.email && editingId !== cliente.id && (
                            <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              <CheckCircle2 size={10} className="text-emerald-500" />
                              <span className="text-[9px] text-emerald-700 font-black">OK</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          {editingId === cliente.id ? (
                            <input value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} className="px-2 py-1 rounded-lg border border-gray-200 text-sm flex-1 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Teléfono" />
                          ) : (
                            <span>{cliente.telefono || 'Sin teléfono'}</span>
                          )}
                        </div>

                        {editingId === cliente.id && (
                          <div className="flex items-center gap-2">
                            <UserIcon size={14} className="text-gray-400 flex-shrink-0" />
                            <select value={editRol} onChange={(e) => setEditRol(e.target.value)} className="px-2 py-1 rounded-lg border border-gray-200 text-sm flex-1 outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="usuario">Usuario</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Cambiar contraseña */}
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Lock size={12} className="text-amber-600" />
                          <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Nueva Contraseña</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type={showPasswords[cliente.id] ? 'text' : 'password'}
                            placeholder="Mínimo 6 caracteres"
                            value={passwordsInput[cliente.id] || ''}
                            onChange={e => setPasswordsInput({ ...passwordsInput, [cliente.id]: e.target.value })}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-amber-200 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white min-w-0"
                          />
                          <button onClick={() => togglePassword(cliente.id)} className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors">
                            {showPasswords[cliente.id] ? <EyeOff size={15} className="text-amber-600" /> : <Eye size={15} className="text-amber-600" />}
                          </button>
                          <button onClick={() => handleUpdatePassword(cliente.id)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
                            <Save size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Direcciones */}
                      {cliente.direcciones?.length > 0 && (
                        <div className="border-t border-gray-50 pt-3">
                          <p className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            <MapPin size={12} /> Direcciones ({cliente.direcciones.length})
                          </p>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {cliente.direcciones.map((d: any, idx: number) => (
                              <div key={d.id || idx} className="text-xs px-3 py-2 bg-gray-50 rounded-lg text-gray-600 flex items-center justify-between">
                                <span className="truncate">{d.calle}</span>
                                {d.es_principal && <span className="text-[9px] text-blue-600 font-black ml-2 flex-shrink-0">Principal</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pedidos */}
                      <div className="border-t border-gray-50 pt-3">
                        <button
                          onClick={() => cargarPedidos(cliente.id)}
                          className="flex items-center justify-between w-full text-left"
                          disabled={loadingPedidos[cliente.id]}
                        >
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            <ShoppingBag size={12} />
                            {loadingPedidos[cliente.id] ? 'Cargando...' : `Ver pedidos${pedidosCliente[cliente.id] ? ` (${pedidosCliente[cliente.id].length})` : ''}`}
                          </span>
                          {expandedPedidos[cliente.id] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </button>

                        {expandedPedidos[cliente.id] && (
                          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                            {(pedidosCliente[cliente.id] || []).length === 0 ? (
                              <p className="text-xs text-gray-400 italic text-center py-3">Sin pedidos registrados</p>
                            ) : (
                              (pedidosCliente[cliente.id] || []).map((p: any) => (
                                <div key={p.id} className="text-xs bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                                  <div className="flex justify-between font-black text-gray-900 mb-1">
                                    <span>#{p.id.slice(-6)}</span>
                                    <span className="text-indigo-600">{Number(p.total || 0).toFixed(2)}€</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-1 text-gray-400">
                                      <Clock size={10} /> {formatFecha(p.creado_at)}
                                    </span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                                      p.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                                      p.estado === 'Enviado' ? 'bg-blue-100 text-blue-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {p.estado}
                                    </span>
                                  </div>
                                  {p.articulos?.length > 0 && (
                                    <div className="mt-1.5 text-gray-500 space-y-0.5">
                                      {p.articulos.map((a: any, i: number) => (
                                        <div key={i} className="flex justify-between">
                                          <span className="truncate mr-2">{a.nombre} ×{a.cantidad}</span>
                                          <span className="flex-shrink-0">{(a.precio * a.cantidad).toFixed(2)}€</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp */}
                    {cliente.telefono && (
                      <button
                        onClick={() => window.open(`https://wa.me/${cliente.telefono?.replace(/\s+/g, '')}`, '_blank')}
                        className="w-full py-3 bg-[#25d366] hover:bg-[#1ebe5d] text-white font-black text-sm transition-colors"
                      >
                        Contactar por WhatsApp
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
