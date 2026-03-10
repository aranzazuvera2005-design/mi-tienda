'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { User as UserIcon, Phone, MapPin, Search, ArrowLeft, Mail, Trash2, Edit, Save, X, Eye, EyeOff, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// ... (Manten tus constantes de estilos cardS, iconBoxS, etc. que ya tenías)

export default function GestionClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();

  useEffect(() => { fetchClientes(); }, []);

  const fetchClientes = async () => {
    setCargando(true);
    try {
      const response = await fetch('/api/admin/clientes');
      const data = await response.json();
      setClientes(data || []);
    } catch (error) {
      addToast({ message: 'Error al cargar datos', type: 'error' });
    } finally { setCargando(false); }
  };

  // ... (Manten tus funciones crearCliente, eliminarCliente, guardarEdicion)

  const clientesFiltrados = clientes.filter(c => {
    const term = busqueda.toLowerCase().trim();
    return (c.nombre?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term));
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado y Buscador (Mantenlos igual) */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.id} style={cardS}>
              {/* Info Superior (Icono y Nombre) */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div style={iconBoxS}><UserIcon size={24} className="text-blue-600" /></div>
                  <div>
                    <h2 className="font-black text-lg">{cliente.nombre || 'Sin nombre'}</h2>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full uppercase font-bold">{cliente.rol}</span>
                  </div>
                </div>
              </div>

              {/* Secciones de contacto (Email, Teléfono) */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} /> {cliente.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} /> {cliente.telefono || 'Sin teléfono'}
                </div>
              </div>

              {/* SECCIÓN DE DIRECCIONES DEFINITIVA */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  <MapPin size={14} /> Direcciones ({cliente.direcciones?.length || 0})
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {cliente.direcciones && cliente.direcciones.length > 0 ? (
                    cliente.direcciones.map((dir: any) => (
                      <div key={dir.id} className="text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="font-bold text-slate-800">{dir.calle}</p>
                        <p className="text-slate-500">{dir.ciudad}, {dir.cp}</p>
                        {dir.es_principal && <span className="text-[9px] text-blue-600 font-black uppercase">Principal</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No hay direcciones en la base de datos</p>
                  )}
                </div>
              </div>

              {/* Botón WhatsApp */}
              <button 
                onClick={() => window.open(`https://wa.me/${cliente.telefono?.replace(/\D/g, '')}`, '_blank')}
                style={btnWhatsappS}
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
