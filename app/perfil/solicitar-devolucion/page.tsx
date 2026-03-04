'use client';

import { useState, useEffect, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/Card';

// 1. Componente que contiene la lógica (usa useSearchParams)
function FormularioDevolucion() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedidoId');
  const { user } = useCart();
  const { addToast } = useToast();

  const [pedido, setPedido] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const [formData, setFormData] = useState({
    productoIdx: 0,
    cantidad: 1,
    motivo: ''
  });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabase = (SUPABASE_URL && SUPABASE_ANON) ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON) : null;

  useEffect(() => {
    if (!user || !supabase || !pedidoId) {
      if (!pedidoId) setCargando(false);
      return;
    }
    fetchPedido();
  }, [user, supabase, pedidoId]);

  const fetchPedido = async () => {
    if (!supabase || !pedidoId) return;
    setCargando(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .eq('cliente_id', user?.id)
        .single();

      if (err) throw err;
      if (!data) throw new Error('Pedido no encontrado');

      const fecha = new Date(data.creado_at);
      const ahora = new Date();
      const diasTranscurridos = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasTranscurridos > 30) {
        throw new Error('El plazo de 30 días para solicitar devoluciones ha expirado');
      }

      setPedido(data);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar el pedido');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !pedido || !user) return;

    setEnviando(true);
    setError(null);

    try {
      const producto = pedido.articulos[formData.productoIdx];
      if (!producto) throw new Error('Producto no válido');

      const fechaLimite = new Date(pedido.creado_at);
      fechaLimite.setDate(fechaLimite.getDate() + 30);

      const { error: err } = await supabase.from('devoluciones').insert({
        pedido_id: pedido.id,
        producto_id: producto.id,
        cantidad: formData.cantidad,
        motivo: formData.motivo || 'No especificado',
        estado: 'Pendiente',
        fecha_limite: fechaLimite.toISOString()
      });

      if (err) throw err;

      setExito(true);
      addToast({ message: 'Solicitud de devolución enviada correctamente', type: 'success' });
      
      setTimeout(() => {
        window.location.href = '/perfil/mis-devoluciones';
      }, 2000);
    } catch (e: any) {
      setError(e?.message || 'Error al enviar la solicitud');
      addToast({ message: `Error: ${e?.message}`, type: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  if (!user) {
    return (
      <div className="py-12">
        <Card className="p-8 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-extrabold text-yellow-900 text-lg">Debes iniciar sesión</h3>
              <p className="text-yellow-800 text-sm mt-1">Para solicitar una devolución, inicia sesión primero.</p>
              <Link href="/login" className="inline-block mt-4 text-yellow-700 font-bold hover:underline">
                Ir a login →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="py-12">
        <Card className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 font-medium">Cargando información del pedido...</p>
        </Card>
      </div>
    );
  }

  if (error && !exito) {
    return (
      <div className="py-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/perfil/mis-pedidos" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-bold">
            <ArrowLeft size={20} /> Volver a mis pedidos
          </Link>
          <Card className="p-8 bg-red-50 border-red-200">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-extrabold text-red-900 text-lg">Error</h3>
                <p className="text-red-800 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="py-12 flex items-center justify-center min-h-screen">
        <Card className="p-12 text-center max-w-md bg-green-50 border-green-200">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h3 className="font-extrabold text-green-900 text-xl mb-2">¡Solicitud enviada!</h3>
          <p className="text-green-800">Redirigiendo a tus devoluciones...</p>
        </Card>
      </div>
    );
  }

  const productosDisponibles = pedido?.articulos || [];

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/perfil/mis-pedidos" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 font-bold">
          <ArrowLeft size={20} /> Volver a mis pedidos
        </Link>

        <Card className="p-8">
          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 p-3 rounded-xl">
              <RotateCcw className="text-orange-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Solicitar Devolución</h1>
              <p className="text-slate-600 text-sm mt-1">Pedido #{pedido?.id?.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Producto a devolver */}
            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-3">Producto a devolver *</label>
              <select
                value={formData.productoIdx}
                onChange={(e) => setFormData({ ...formData, productoIdx: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                {productosDisponibles.map((producto: any, idx: number) => (
                  <option key={idx} value={idx}>{producto.nombre} ({producto.precio}€)</option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-3">Cantidad a devolver *</label>
              <input
                type="number"
                min="1"
                max={productosDisponibles[formData.productoIdx]?.cantidad || 1}
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-3">Motivo de la devolución</label>
              <textarea
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Describe el motivo de tu devolución..."
              />
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={enviando}
              className={`w-full py-3 rounded-xl font-extrabold text-lg transition-all ${
                enviando
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
              }`}
            >
              {enviando ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// 2. Exportación principal con el Suspense Boundary obligatorio
export default function SolicitarDevolucionPage() {
  return (
    <Suspense fallback={
      <div className="py-12">
        <Card className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 font-medium">Cargando...</p>
        </Card>
      </div>
    }>
      <FormularioDevolucion />
    </Suspense>
  );
}
