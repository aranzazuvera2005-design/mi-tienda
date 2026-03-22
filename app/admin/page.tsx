'use client';

import Link from 'next/link';
import { Package, ClipboardList, Users, Bell, ArrowLeft, RotateCcw, TrendingUp, ScrollText, Sliders, Star } from 'lucide-react';

export default function AdminPanel() {
  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-8 md:mb-12">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 mb-4 transition-colors">
            <ArrowLeft size={16} /> Volver a la Tienda
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Panel de Control</h1>
          <p className="text-gray-600">Gestiona tu negocio en tiempo real</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* 1. MONITOR EN TIEMPO REAL */}
          <Link href="/admin/monitor" className="flex flex-col items-start gap-4 bg-white p-6 rounded-xl border-2 border-blue-500 text-gray-900 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-blue-50"><Bell size={32} className="text-blue-600" /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Monitor de Ventas</h2>
              <p className="text-gray-600 text-sm">Pantalla de control con alertas sonoras para nuevos pedidos.</p>
            </div>
          </Link>

          {/* 2. GESTIÓN DE INVENTARIO */}
          <Link href="/admin/inventario" className="flex flex-col items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 text-gray-900 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-green-50"><Package size={32} className="text-green-600" /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Inventario de Productos</h2>
              <p className="text-gray-600 text-sm">Añadir nuevos productos, editar precios y stock.</p>
            </div>
          </Link>

          {/* 3. HISTORIAL DE PEDIDOS */}
          <Link href="/admin/pedidos" className="flex flex-col items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 text-gray-900 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-orange-50"><ClipboardList size={32} className="text-orange-600" /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Gestión de Pedidos</h2>
              <p className="text-gray-600 text-sm">Ver historial completo y marcar envíos como completados.</p>
            </div>
          </Link>

          {/* 4. GESTIÓN DE CLIENTES */}
          <Link href="/admin/clientes" className="flex flex-col items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 text-gray-900 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-purple-50"><Users size={32} className="text-purple-600" /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Base de Datos de Clientes</h2>
              <p className="text-gray-600 text-sm">Ver perfiles, teléfonos y direcciones de tus compradores.</p>
            </div>
          </Link>

          {/* 5. GESTIÓN DE DEVOLUCIONES */}
          <Link href="/admin/devoluciones" className="flex flex-col items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 text-gray-900 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-red-50"><RotateCcw size={32} className="text-red-600" /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Gestión de Devoluciones</h2>
              <p className="text-gray-600 text-sm">Aprobar, rechazar y gestionar solicitudes de devolución.</p>
            </div>
          </Link>

          {/* 6. VENTAS POR CLIENTE */}
          <Link href="/admin/ventas-cliente" className="flex flex-col items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 text-gray-900 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-indigo-50"><TrendingUp size={32} className="text-indigo-600" /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Ventas por Cliente</h2>
              <p className="text-gray-600 text-sm">Top clientes, métricas individuales, frecuentes y obsequios.</p>
            </div>
          </Link>

          {/* 7. POLÍTICA DE TIENDA */}
          <Link href="/admin/politica" className="flex flex-col items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 text-gray-900 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-violet-50"><ScrollText size={32} className="text-violet-600" /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Política de la Tienda</h2>
              <p className="text-gray-600 text-sm">Envíos, devoluciones, medios de pago y aviso legal.</p>
            </div>
          </Link>

          {/* 8. TIPOS DE VARIANTE */}
          <Link href="/admin/variantes" className="flex flex-col items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 text-gray-900 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-teal-50"><Sliders size={32} className="text-teal-600" /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Tipos de Variante</h2>
              <p className="text-gray-600 text-sm">Crea y gestiona los tipos de variante de tu tienda (Talla, Color, Tela, Acabado…) y sus valores.</p>
            </div>
          </Link>

          {/* 9. RESEÑAS */}
          <Link href="/admin/resenas" className="flex flex-col items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 text-gray-900 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-amber-50"><Star size={32} className="text-amber-500" /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Reseñas de Productos</h2>
              <p className="text-gray-600 text-sm">Analiza las valoraciones de tus clientes y modera las reseñas publicadas.</p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}