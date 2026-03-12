"use client";
import { useState, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { ShoppingCart, Check, Loader2, AlertCircle } from "lucide-react";
import VariantesSelector from "./VariantesSelector";

export default function AgregarAlCarritoBtn({ producto, onClose }: { producto: any; onClose?: () => void }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [isAdding, setIsAdding]   = useState(false);
  const [isAdded,  setIsAdded]    = useState(false);
  const [variantesSeleccionadas, setVariantesSeleccionadas] = useState<Record<string, any>>({});
  const [precioFinal,  setPrecioFinal]  = useState<number>(Number(producto?.precio || 0));
  const [personalizacion, setPersonalizacion] = useState('');
  const [grupos, setGrupos] = useState<any[]>([]);
  const [mostrarError, setMostrarError] = useState(false);

  const handleSeleccion = useCallback((variantes: Record<string, any>, precio: number, texto: string) => {
    setVariantesSeleccionadas(variantes);
    setPrecioFinal(precio);
    setPersonalizacion(texto);
    setMostrarError(false); // limpiar error al seleccionar
  }, []);

  // Grupos que faltan por seleccionar
  const gruposFaltantes = grupos.filter(g => {
    const sel = variantesSeleccionadas[g.tipo_id];
    if (g.tipo_input === 'texto_libre') {
      return !sel?.valor_usuario?.trim();
    }
    return !sel;
  });

  const handleAddToCart = async () => {
    if (!producto?.id) return;

    // Bloquear si faltan variantes
    if (gruposFaltantes.length > 0) {
      setMostrarError(true);
      return;
    }

    try {
      setIsAdding(true);
      await new Promise(resolve => setTimeout(resolve, 400));
      addToCart({
        ...producto,
        precio: precioFinal,
        variantesSeleccionadas,
        personalizacion: personalizacion || undefined,
      });
      setIsAdded(true);
      addToast({ message: `"${producto.nombre}" añadido al carrito`, type: 'success' });
      setTimeout(() => { setIsAdded(false); onClose?.(); }, 900);
    } catch (e) {
      console.error('Error adding to cart', e);
    } finally {
      setIsAdding(false);
    }
  };

  const bloqueado = gruposFaltantes.length > 0;

  return (
    <div className="w-full">
      <VariantesSelector
        productoId={producto.id}
        precio={Number(producto?.precio || 0)}
        onSeleccion={handleSeleccion}
        onGruposChange={setGrupos}
      />

      {/* Aviso de variantes pendientes */}
      {mostrarError && gruposFaltantes.length > 0 && (
        <div className="flex items-start gap-2 mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span>
            Elige <strong>{gruposFaltantes.map(g => g.label).join(', ')}</strong> antes de continuar
          </span>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`rounded-2xl w-full py-4 font-black transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] ${
          isAdded
            ? 'bg-green-500 text-white shadow-2xl shadow-green-200'
            : bloqueado && mostrarError
              ? 'bg-red-500 text-white shadow-lg shadow-red-100 animate-[shake_0.3s_ease-in-out]'
              : 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-blue-600 hover:shadow-blue-200 hover:-translate-y-1 disabled:opacity-70'
        }`}
      >
        {isAdding ? <Loader2 size={16} className="animate-spin" />
          : isAdded ? <Check size={16} />
          : <ShoppingCart size={16} />}
        <span>
          {isAdding ? 'Procesando'
            : isAdded ? '¡Añadido!'
            : `Adquirir${precioFinal !== Number(producto?.precio || 0) ? ` — ${precioFinal.toFixed(2)}€` : ''}`}
        </span>
      </button>
    </div>
  );
}
