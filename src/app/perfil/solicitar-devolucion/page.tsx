'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';

export default function SolicitarDevolucion() {
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
      setCargando(false);
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

      // Verificar que no hayan pasado 30 días
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

      // Calcular fecha límite (30 días desde la compra)
      const fechaLimite = new Date(pedido.creado_at);
      fechaLimite.setDate(fechaLimite.getDate() + 30);

      // Insertar devolución
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
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={24} />
          <div>
            <h3 className="font-bold text-yellow-900">Debes iniciar sesión</h3>
            <p className="text-yellow-800 text-sm">Para solicitar una devolución, inicia sesión primero.</p>
          </div>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando información del pedido...</p>
        </div>
      </div>
    );
  }

  if (error && !exito) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Link href="/perfil/mis-pedidos" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft size={20} />
          Volver a mis pedidos
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <h3 className="font-bold text-red-900">Error</h3>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center gap-3 text-center">
          <CheckCircle className="text-green-600" size={32} />
          <div>
            <h3 className="font-bold text-green-900 text-lg">¡Solicitud enviada!</h3>
            <p className="text-green-800">Tu solicitud de devolución ha sido registrada. Redirigiendo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-700">Pedido no encontrado</h3>
        </div>
      </div>
    );
  }

  const productosDisponibles = pedido.articulos || [];

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link href="/perfil/mis-pedidos" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft size={20} />
        Volver a mis pedidos
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h1 className="text-3xl font-black mb-2">Solicitar Devolución</h1>
        <p className="text-gray-600 mb-6">Pedido #{pedido.id.slice(0, 8).toUpperCase()}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleccionar producto */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Producto a devolver *
            </label>
            <select
              value={formData.productoIdx}
              onChange={(e) => setFormData({ ...formData, productoIdx: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {productosDisponibles.map((producto: any, idx: number) => (
                <option key={idx} value={idx}>
                  {producto.nombre} (${producto.precio})
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Cantidad a devolver *
            </label>
            <input
              type="number"
              min="1"
              max={productosDisponibles[formData.productoIdx]?.cantidad || 1}
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo disponible: {productosDisponibles[formData.productoIdx]?.cantidad || 1}
            </p>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Motivo de la devolución
            </label>
            <textarea
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Describe el motivo de tu devolución (defecto, no corresponde, cambio de opinión, etc.)"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Nota importante:</strong> Tu solicitud de devolución será revisada por nuestro equipo. Nos pondremos en contacto contigo en los próximos 2-3 días hábiles.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {enviando ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
            <Link
              href="/perfil/mis-pedidos"
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-bold text-center transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
