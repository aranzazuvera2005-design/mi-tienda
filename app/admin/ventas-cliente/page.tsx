'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Search, TrendingUp, ShoppingBag,
  Package, RotateCcw, Star, Bell, ChevronDown, ChevronUp,
  Clock, ArrowUp, ArrowDown, ArrowUpDown, Gift
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

type SortField = 'nombre' | 'totalPedidos' | 'totalArticulos' | 'totalVentas' | 'totalDevoluciones' | 'ticketMedio' | 'ultimaCompra';
type SortDir = 'asc' | 'desc';
const UMBRAL_FRECUENTE = 3;

export default function VentasPorCliente() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalVentas');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});
  const [obsequiosMarcados, setObsequiosMarcados] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/ventas-cliente');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClientes(Array.isArray(data) ? data : []);
      // Notificar clientes frecuentes
      const frecuentes = (Array.isArray(data) ? data : []).filter((c: any) => c.esFrecuente);
      if (frecuentes.length > 0) {
        addToast({ message: `🔔 ${frecuentes.length} cliente${frecuentes.length > 1 ? 's' : ''} frecuente${frecuentes.length > 1 ? 's' : ''} detectado${frecuentes.length > 1 ? 's' : ''}`, type: 'info', duration: 4000 });
      }
    } catch (e: any) {
      addToast({ message: 'Error al cargar datos: ' + e.message, type: 'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
        sortField === field ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
      {sortField === field
        ? sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />
        : <ArrowUpDown size={11} className="opacity-40" />}
    </button>
  );

  const formatFecha = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const clientesFiltrados = clientes
    .filter(c => {
      const t = busqueda.toLowerCase();
      return !t || c.nombre.toLowerCase().includes(t) || c.email.toLowerCase().includes(t) || c.telefono.includes(t);
    })
    .sort((a, b) => {
      const va = a[sortField] ?? (sortField === 'nombre' ? '' : 0);
      const vb = b[sortField] ?? (sortField === 'nombre' ? '' : 0);
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  // Tops globales
  const topPedidos = [...clientes].sort((a, b) => b.totalPedidos - a.totalPedidos).slice(0, 3);
  const topVentas = [...clientes].sort((a, b) => b.totalVentas - a.totalVentas).slice(0, 3);
  const topArticulos = [...clientes].sort((a, b) => b.totalArticulos - a.totalArticulos).slice(0, 3);
  const topDevoluciones = [...clientes].sort((a, b) => b.totalDevoluciones - a.totalDevoluciones).slice(0, 3);
  const frecuentes = clientes.filter(c => c.esFrecuente);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 font-bold transition-colors">
          <ArrowLeft size={16} /> Volver al Panel
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Ventas por Cliente</h1>
            <p className="text-gray-500 text-sm mt-1">{clientes.length} clientes · {frecuentes.length} frecuentes</p>
          </div>
          <button onClick={cargar} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors self-start">
            <RefreshCw size={18} className={cargando ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
          </button>
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw size={36} className="animate-spin text-indigo-600" />
            <p className="text-gray-500 font-medium">Calculando métricas...</p>
          </div>
        ) : (
          <>
            {/* ── TOPS GLOBALES ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Top Pedidos', icon: <ShoppingBag size={16} className="text-indigo-600" />, bg: 'bg-indigo-50', data: topPedidos, val: (c: any) => `${c.totalPedidos} ped.` },
                { label: 'Top Ventas €', icon: <TrendingUp size={16} className="text-emerald-600" />, bg: 'bg-emerald-50', data: topVentas, val: (c: any) => `${c.totalVentas.toFixed(0)}€` },
                { label: 'Top Artículos', icon: <Package size={16} className="text-blue-600" />, bg: 'bg-blue-50', data: topArticulos, val: (c: any) => `${c.totalArticulos} art.` },
                { label: 'Top Devoluciones', icon: <RotateCcw size={16} className="text-red-500" />, bg: 'bg-red-50', data: topDevoluciones, val: (c: any) => `${c.totalDevoluciones} dev.` },
              ].map(({ label, icon, bg, data, val }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className={`inline-flex items-center gap-1.5 ${bg} px-2.5 py-1 rounded-lg mb-3`}>
                    {icon}
                    <span className="text-xs font-black text-gray-700 uppercase tracking-wide">{label}</span>
                  </div>
                  <div className="space-y-2">
                    {data.map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-black text-gray-300 w-4">#{i + 1}</span>
                          <span className="text-sm font-bold text-gray-800 truncate">{c.nombre}</span>
                        </div>
                        <span className="text-xs font-black text-gray-500 flex-shrink-0">{val(c)}</span>
                      </div>
                    ))}
                    {data.length === 0 && <p className="text-xs text-gray-400 italic">Sin datos</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* ── CLIENTES FRECUENTES ── */}
            {frecuentes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={16} className="text-amber-600" />
                  <h2 className="font-black text-amber-900 text-sm uppercase tracking-widest">
                    Clientes Frecuentes · {frecuentes.length} detectados
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {frecuentes.map(c => (
                    <div key={c.id} className="bg-white rounded-xl border border-amber-100 p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Star size={13} className="text-amber-500 flex-shrink-0" />
                          <p className="font-black text-gray-900 text-sm truncate">{c.nombre}</p>
                        </div>
                        <p className="text-xs text-gray-500">{c.totalPedidos} pedidos · {c.totalVentas.toFixed(2)}€</p>
                        <p className="text-xs text-gray-400 mt-0.5">Última compra: {formatFecha(c.ultimaCompra)}</p>
                      </div>
                      <button
                        onClick={() => {
                          setObsequiosMarcados(prev => ({ ...prev, [c.id]: !prev[c.id] }));
                          if (!obsequiosMarcados[c.id]) {
                            addToast({ message: `🎁 Obsequio marcado para ${c.nombre}`, type: 'success', duration: 3000 });
                          }
                        }}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-xs font-black ${
                          obsequiosMarcados[c.id]
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200'
                        }`}
                        title="Marcar obsequio"
                      >
                        <Gift size={16} />
                        {obsequiosMarcados[c.id] ? '✓ Obsequio' : 'Obsequio'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── BUSCADOR + ORDENACIÓN ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordenar:</span>
                <SortBtn field="nombre" label="Nombre" />
                <SortBtn field="totalPedidos" label="Pedidos" />
                <SortBtn field="totalArticulos" label="Artículos" />
                <SortBtn field="totalVentas" label="Ventas €" />
                <SortBtn field="totalDevoluciones" label="Devoluciones" />
                <SortBtn field="ticketMedio" label="Ticket Medio" />
                <SortBtn field="ultimaCompra" label="Última Compra" />
              </div>
            </div>

            {/* ── TABLA DE CLIENTES ── */}
            <div className="space-y-3">
              {clientesFiltrados.length === 0 && (
                <div className="text-center py-12 text-gray-400 font-medium">Sin resultados</div>
              )}
              {clientesFiltrados.map((c, idx) => (
                <div key={c.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${c.esFrecuente ? 'border-amber-200' : 'border-gray-100'}`}>

                  {/* Fila principal */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      {/* Posición */}
                      <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">
                        {idx + 1}
                      </div>

                      {/* Info + métricas */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-black text-gray-900">{c.nombre}</h3>
                          {c.esFrecuente && (
                            <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                              <Star size={9} /> Frecuente
                            </span>
                          )}
                          {obsequiosMarcados[c.id] && (
                            <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                              <Gift size={9} /> Obsequio
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-3">{c.email}{c.telefono ? ` · ${c.telefono}` : ''}</p>

                        {/* Métricas en grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                          {[
                            { label: 'Pedidos', val: c.totalPedidos, icon: <ShoppingBag size={11} />, color: 'text-indigo-600' },
                            { label: 'Artículos', val: c.totalArticulos, icon: <Package size={11} />, color: 'text-blue-600' },
                            { label: 'Ventas', val: `${c.totalVentas.toFixed(2)}€`, icon: <TrendingUp size={11} />, color: 'text-emerald-600' },
                            { label: 'Ticket Medio', val: `${c.ticketMedio.toFixed(2)}€`, icon: <TrendingUp size={11} />, color: 'text-teal-600' },
                            { label: 'Devoluciones', val: c.totalDevoluciones, icon: <RotateCcw size={11} />, color: 'text-red-500' },
                            { label: 'Última Compra', val: formatFecha(c.ultimaCompra), icon: <Clock size={11} />, color: 'text-gray-500' },
                          ].map(({ label, val, icon, color }) => (
                            <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
                              <div className={`flex items-center gap-1 ${color} mb-0.5`}>
                                {icon}
                                <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
                              </div>
                              <p className="font-black text-gray-900 text-sm">{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Botones derecha */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {c.esFrecuente && (
                          <button
                            onClick={() => {
                              setObsequiosMarcados(prev => ({ ...prev, [c.id]: !prev[c.id] }));
                              if (!obsequiosMarcados[c.id]) addToast({ message: `🎁 Obsequio marcado para ${c.nombre}`, type: 'success' });
                            }}
                            className={`p-2 rounded-xl transition-all ${obsequiosMarcados[c.id] ? 'bg-green-100 text-green-600' : 'bg-amber-50 text-amber-500 hover:bg-amber-100'}`}
                            title="Marcar obsequio"
                          >
                            <Gift size={16} />
                          </button>
                        )}
                        {c.pedidos?.length > 0 && (
                          <button
                            onClick={() => setExpandido(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
                            title="Ver pedidos"
                          >
                            {expandido[c.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top productos */}
                  {c.topProductos?.length > 0 && (
                    <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-2">
                      {c.topProductos.map((p: any) => (
                        <span key={p.nombre} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                          <Package size={10} /> {p.nombre} ×{p.cantidad}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pedidos expandidos */}
                  {expandido[c.id] && c.pedidos?.length > 0 && (
                    <div className="border-t border-gray-50 bg-gray-50 p-4 sm:p-5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Historial de Pedidos</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {c.pedidos.map((p: any) => (
                          <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-3 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-black text-gray-900">#{p.id.slice(-6)}</span>
                              <span className="font-black text-indigo-600">{Number(p.total || 0).toFixed(2)}€</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 flex items-center gap-1">
                                <Clock size={10} /> {formatFecha(p.creado_at)}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                p.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                                p.estado === 'Enviado' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>{p.estado}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
