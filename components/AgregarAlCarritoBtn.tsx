"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useCartDrawer } from "@/context/CartDrawerContext";
import { ShoppingCart, Check, Loader2 } from "lucide-react";

export default function AgregarAlCarritoBtn({ producto }: { producto: any }) {
  const { addToCart } = useCart();
  const { openDrawer } = useCartDrawer();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    try {
      if (!producto || !producto.id) return;
      setIsAdding(true);
      await new Promise(resolve => setTimeout(resolve, 400));
      addToCart(producto);
      setIsAdded(true);
      setTimeout(() => {
        openDrawer();
        setIsAdded(false);
      }, 600);
    } catch (e) {
      console.error('Error adding to cart', e);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button 
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`rounded-full w-full py-3 font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${
        isAdded
          ? 'bg-green-500 text-white shadow-lg shadow-green-100'
          : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 disabled:opacity-70'
      }`}
    >
      {isAdding ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isAdded ? (
        <Check size={18} />
      ) : (
        <ShoppingCart size={18} />
      )}
      <span>{isAdding ? 'Añadiendo...' : isAdded ? '¡Añadido!' : 'Añadir'}</span>
    </button>
  );
}
