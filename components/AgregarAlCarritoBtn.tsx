"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import VariantesSelector from "./VariantesSelector";

export default function AgregarAlCarritoBtn({ producto }: { producto: any }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [variantesSeleccionadas, setVariantesSeleccionadas] = useState<Record<string, any>>({});
  const [precioFinal, setPrecioFinal] = useState<number>(Number(producto?.precio || 0));
  const [personalizacion, setPersonalizacion] = useState('');

  const handleSeleccion = (variantes: Record<string, any>, precio: number, texto: string) => {
    setVariantesSeleccionadas(variantes);
    setPrecioFinal(precio);
    setPersonalizacion(texto);
  };

  const handleAddToCart = async () => {
    try {
      if (!producto || !producto.id) return;
      setIsAdding(true);
      await new Promise(resolve => setTimeout(resolve, 400));

      const productoConVariantes = {
        ...producto,
        precio: precioFinal,
        variantesSeleccionadas,
        personalizacion: personalizacion || undefined,
      };

      addToCart(productoConVariantes);
      setIsAdded(true);
      addToast({ message: `"${producto.nombre}" añadido al carrito`, type: 'success' });
      setTimeout(() => setIsAdded(false), 1500);
    } catch (e) {
      console.error('Error adding to cart', e);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full">
      <VariantesSelector
        productoId={producto.id}
        precio={Number(producto?.precio || 0)}
        onSeleccion={handleSeleccion}
      />
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`rounded-2xl w-full py-4 font-black transition-all duration-500 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] ${
          isAdded
            ? 'bg-green-500 text-white shadow-2xl shadow-green-200'
            : 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-blue-600 hover:shadow-blue-200 hover:-translate-y-1 disabled:opacity-70'
        }`}
      >
        {isAdding ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isAdded ? (
          <Check size={16} />
        ) : (
          <ShoppingCart size={16} />
        )}
        <span>
          {isAdding ? 'Procesando' : isAdded ? '¡Añadido!' : `Adquirir${precioFinal !== Number(producto?.precio || 0) ? ` — ${precioFinal.toFixed(2)}€` : ''}`}
        </span>
      </button>
    </div>
  );
}
