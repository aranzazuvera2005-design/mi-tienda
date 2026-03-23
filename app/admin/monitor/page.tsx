'use client';

import { adminFetch } from '@/lib/adminFetch';
import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Bell, TrendingUp, ShoppingBag, Euro, Package, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// --- ESTILOS ---
const cardS = { 
  backgroundColor: 'white', 
  padding: '20px', 
  borderRadius: '20px', 
  border: '1px solid #e5e7eb', 
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '10px'
};

export default function MonitorVentas() {
  const [stats, setStats] = useState<any>(null);
  const [pedidosRecientes, setPedidosRecientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  
  // Inicialización segura de Supabase
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  const fetchStats = async () => {
    try {
      const res = await adminFetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchPedidos = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, cliente:perfiles(nombre)')
      .order('creado_at', { ascending: false })
      .limit(5);
    
    if (!error) setPedidosRecientes(data || []);
  };

  useEffect(() => {
    const init = async () => {
      setCargando(true);
      await Promise.all([fetchStats(), fetchPedidos()]);
      setCargando(false);
    };
    init();

    if (supabase) {
      const channel = supabase
        .channel('pedidos-reales')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
          console.log('¡Nuevo pedido!', payload);
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Error audio:', e));
          }
          fetchStats();
          fetchPedidos();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [supabase]);

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <RefreshCw className="animate-spin" size={48} color="#2563eb" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />
      
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 mb-3 transition-colors">
              <ArrowLeft size={16} /> Volver al Panel
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900">Monitor de Ventas</h1>
            <p className="text-gray-600 mt-1">Métricas en tiempo real y alertas de pedidos</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-pulse-slow"></div>
            <span className="text-green-700 font-bold text-sm">SISTEMA ACTIVO</span>
          </div>
        </header>

        {/* DASHBOARD DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
            <div className="p-2.5 rounded-lg bg-blue-50 w-fit mb-3"><Euro size={20} className="text-blue-600" /></div>
            <span className="text-xs text-gray-600 font-bold uppercase">Ventas Totales</span>
            <span className="text-2xl font-black block">
              {stats?.totalVentasEuros?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || '0,00 €'}
            </span>
          </div>
          
          <div className="bg-white p-6 rounded-xl border-l-4 border-green-500 shadow-sm">
            <div className="p-2.5 rounded-lg bg-green-50 w-fit mb-3"><ShoppingBag size={20} className="text-green-600" /></div>
            <span className="text-xs text-gray-600 font-bold uppercase">Pedidos Hoy</span>
            <span className="text-2xl font-black block">{stats?.pedidosHoy || 0}</span>
            <span className="text-xs text-green-600 font-bold">
              +{stats?.ventasHoy?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || '0,00 €'} hoy
            </span>
          </div>

          <div className="bg-white p-6 rounded-xl border-l-4 border-amber-500 shadow-sm">
            <div className="p-2.5 rounded-lg bg-amber-50 w-fit mb-3"><TrendingUp size={20} className="text-amber-600" /></div>
            <span className="text-xs text-gray-600 font-bold uppercase">Ticket Medio</span>
            <span className="text-2xl font-black block">
              {stats?.ticketMedio?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || '0,00 €'}
            </span>
          </div>

          <div className="bg-white p-6 rounded-xl border-l-4 border-purple-500 shadow-sm">
            <div className="p-2.5 rounded-lg bg-purple-50 w-fit mb-3"><Package size={20} className="text-purple-600" /></div>
            <span className="text-xs text-gray-600 font-bold uppercase">Total Pedidos</span>
            <span className="text-2xl font-black block">{stats?.totalPedidos || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* ÚLTIMOS PEDIDOS */}
          <div style={cardS}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Bell size={20} color="#2563eb" />
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Últimos Pedidos</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pedidosRecientes.map((p) => (
                <div key={p.id} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.cliente?.nombre || 'Cliente Invitado'}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(p.creado_at).toLocaleTimeString()}</div>
                  </div>
                  <div style={{ fontWeight: 900, color: '#111827' }}>
                    {Number(p.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              ))}
              {pedidosRecientes.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No hay pedidos recientes</p>}
            </div>
            <Link href="/admin/pedidos" style={{ textAlign: 'center', fontSize: '14px', color: '#2563eb', textDecoration: 'none', fontWeight: 'bold', marginTop: '15px' }}>
              Ver todos los pedidos →
            </Link>
          </div>

          {/* TOP PRODUCTOS */}
          <div style={cardS}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Package size={20} color="#10b981" />
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Top 5 Productos</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.topProductos && stats.topProductos.length > 0 ? (
                stats.topProductos.map((prod: any, idx: number) => {
                  const colors = ['#fbbf24', '#d1d5db', '#f97316'];
                  const bgColor = idx < 3 ? colors[idx] : '#f3f4f6';
                  const textColor = idx < 3 ? 'white' : '#6b7280';
                  return (
                    <div key={idx} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', backgroundColor: bgColor, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: textColor }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>{prod.nombre}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{prod.cantidad} unidades vendidas</div>
                      </div>
                      <div style={{ backgroundColor: '#f0fdf4', color: '#10b981', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                        {prod.cantidad} uds
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', padding: '20px' }}>Sin datos de ventas</p>
              )}
            </div>
            <Link href="/admin/inventario" style={{ textAlign: 'center', fontSize: '14px', color: '#10b981', textDecoration: 'none', fontWeight: 'bold', marginTop: '15px' }}>
              Ver inventario completo →
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-pulse-slow {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}
