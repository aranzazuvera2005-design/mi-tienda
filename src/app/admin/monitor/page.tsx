'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Bell, TrendingUp, ShoppingBag, Euro, Package, ArrowLeft, RefreshCw, Activity } from 'lucide-react';
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

const statCardS = {
  ...cardS,
  flex: 1,
  minWidth: '200px',
  borderLeft: '4px solid #2563eb'
};

const iconBoxS = { 
  padding: '10px', 
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'fit-content'
};

export default function MonitorVentas() {
  const [stats, setStats] = useState<any>(null);
  const [pedidosRecientes, setPedidosRecientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
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

    // Suscripción en tiempo real para nuevos pedidos
    if (supabase) {
      const channel = supabase
        .channel('pedidos-reales')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
          console.log('¡Nuevo pedido!', payload);
          // Reproducir sonido de alerta
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Error audio:', e));
          }
          // Actualizar datos
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <RefreshCw className="animate-spin" size={48} color="#2563eb" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Link href="/admin" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
              <ArrowLeft size={16} /> Volver al Panel
            </Link>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, color: '#111827' }}>Monitor de Ventas</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Métricas en tiempo real y alertas de pedidos</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#ecfdf5', padding: '8px 15px', borderRadius: '12px', border: '1px solid #d1fae5' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
            <span style={{ color: '#047857', fontWeight: 'bold', fontSize: '14px' }}>SISTEMA ACTIVO</span>
          </div>
        </header>

        {/* DASHBOARD DE MÉTRICAS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
          <div style={{ ...statCardS, borderLeftColor: '#2563eb' }}>
            <div style={{ ...iconBoxS, backgroundColor: '#eff6ff' }}><Euro size={20} color="#2563eb" /></div>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>VENTAS TOTALES</span>
            <span style={{ fontSize: '28px', fontWeight: 900 }}>{stats?.totalVentasEuros?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
          </div>
          
          <div style={{ ...statCardS, borderLeftColor: '#10b981' }}>
            <div style={{ ...iconBoxS, backgroundColor: '#f0fdf4' }}><ShoppingBag size={20} color="#10b981" /></div>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>PEDIDOS HOY</span>
            <span style={{ fontSize: '28px', fontWeight: 900 }}>{stats?.pedidosHoy || 0}</span>
            <span style={{ fontSize: '12px', color: '#10b981' }}>+{stats?.ventasHoy?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} hoy</span>
          </div>

          <div style={{ ...statCardS, borderLeftColor: '#f59e0b' }}>
            <div style={{ ...iconBoxS, backgroundColor: '#fffbeb' }}><TrendingUp size={20} color="#f59e0b" /></div>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>TICKET MEDIO</span>
            <span style={{ fontSize: '28px', fontWeight: 900 }}>{stats?.ticketMedio?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
          </div>

          <div style={{ ...statCardS, borderLeftColor: '#7c3aed' }}>
            <div style={{ ...iconBoxS, backgroundColor: '#f5f3ff' }}><Package size={20} color="#7c3aed" /></div>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>TOTAL PEDIDOS</span>
            <span style={{ fontSize: '28px', fontWeight: 900 }}>{stats?.totalPedidos || 0}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
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
                  <div style={{ fontWeight: 900, color: '#111827' }}>{Number(p.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                </div>
              ))}
              {pedidosRecientes.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No hay pedidos recientes</p>}
            </div>
            <Link href="/admin/pedidos" style={{ textAlign: 'center', fontSize: '14px', color: '#2563eb', textDecoration: 'none', fontWeight: 'bold', marginTop: '15px' }}>Ver todos los pedidos →</Link>
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
                      <div style={{ backgroundColor: '#f0fdf4', color: '#10b981', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>{prod.cantidad} uds</div>
                    </div>
                  );
                })
              ) : (
                <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', padding: '20px' }}>Sin datos de ventas</p>
              )}
            </div>
            <Link href="/admin/inventario" style={{ textAlign: 'center', fontSize: '14px', color: '#10b981', textDecoration: 'none', fontWeight: 'bold', marginTop: '15px' }}>Ver inventario completo →</Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
