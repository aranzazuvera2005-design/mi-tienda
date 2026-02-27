'use client';

import Link from 'next/link';
import { Package, ClipboardList, Users, Bell, ArrowLeft, RotateCcw } from 'lucide-react';

// --- ESTILOS COMPARTIDOS ---
const cardS = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  backgroundColor: 'white',
  padding: '25px',
  borderRadius: '24px',
  textDecoration: 'none',
  color: '#1f2937',
  border: '1px solid #e5e7eb',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
};

const iconBoxS = {
  padding: '15px',
  borderRadius: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default function AdminPanel() {
  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <header style={{ marginBottom: '40px' }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ArrowLeft size={16} /> Volver a la Tienda
          </Link>
          <h1 style={{ fontSize: '36px', fontWeight: 900, marginTop: '10px', color: '#111827' }}>Panel de Control</h1>
          <p style={{ color: '#6b7280' }}>Gestiona tu negocio en tiempo real</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* 1. MONITOR EN TIEMPO REAL */}
          <Link href="/admin/monitor" style={{...cardS, border: '2px solid #2563eb'}}>
            <div style={{...iconBoxS, backgroundColor: '#eff6ff'}}><Bell size={32} color="#2563eb" /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Monitor de Ventas</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Pantalla de control con alertas sonoras para nuevos pedidos.</p>
            </div>
          </Link>

          {/* 2. GESTIÓN DE INVENTARIO */}
          <Link href="/admin/inventario" style={cardS}>
            <div style={{...iconBoxS, backgroundColor: '#f0fdf4'}}><Package size={32} color="#16a34a" /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Inventario de Productos</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Añadir nuevos productos, editar precios y stock.</p>
            </div>
          </Link>

          {/* 3. HISTORIAL DE PEDIDOS */}
          <Link href="/admin/pedidos" style={cardS}>
            <div style={{...iconBoxS, backgroundColor: '#fff7ed'}}><ClipboardList size={32} color="#ea580c" /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Gestión de Pedidos</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Ver historial completo y marcar envíos como completados.</p>
            </div>
          </Link>

          {/* 4. GESTIÓN DE CLIENTES */}
          <Link href="/admin/clientes" style={cardS}>
            <div style={{...iconBoxS, backgroundColor: '#f5f3ff'}}><Users size={32} color="#7c3aed" /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Base de Datos de Clientes</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Ver perfiles, teléfonos y direcciones de tus compradores.</p>
            </div>
          </Link>

          {/* 5. GESTIÓN DE DEVOLUCIONES */}
          <Link href="/admin/devoluciones" style={cardS}>
            <div style={{...iconBoxS, backgroundColor: '#fff1f2'}}><RotateCcw size={32} color="#e11d48" /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Gestión de Devoluciones</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Aprobar, rechazar y gestionar solicitudes de devolución.</p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}