"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useCartDrawer } from "./CartDrawerWrapper";

export default function AgregarAlCarritoBtn({ producto }: { producto: any }) {
  const { addToCart } = useCart();
  const { openDrawer } = useCartDrawer();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    try {
      if (!producto || !producto.id) {
        console.error('Producto inválido');
        return;
      }

      setIsAdding(true);
      
      // Simulamos un pequeño delay para que el feedback sea visible
      await new Promise(resolve => setTimeout(resolve, 300));
      
      addToCart(producto);
      
      // Mostrar feedback visual de éxito
      setIsAdded(true);
      
      // Abrir el drawer automáticamente
      setTimeout(() => {
        openDrawer();
        setIsAdded(false);
      }, 500);
      
    } catch (e) {
      console.error('Error añadiendo al carrito', e);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button 
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`w-full font-bold text-sm py-3 px-4 rounded-xl transition-all duration-300 active:scale-95 shadow-md border-0 whitespace-nowrap ${
        isAdded
          ? 'bg-green-500 text-white hover:bg-green-600'
          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed'
      }`}
    >
      {isAdding ? (
        <span className="flex items-center justify-center gap-1.5">
          <span className="animate-spin inline-block">⏳</span>
          <span className="hidden sm:inline">Añadiendo...</span>
        </span>
      ) : isAdded ? (
        <span className="flex items-center justify-center gap-1.5">
          <span>✓</span>
          <span className="hidden sm:inline">¡Añadido!</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-1.5">
          <span>🛒</span>
          <span className="hidden sm:inline">Añadir al Carrito</span>
          <span className="sm:hidden">Añadir</span>
        </span>
      )}
    </button>
  );
}
