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
      className={`w-full font-bold text-sm py-3 px-4 rounded-full transition-all duration-300 active:scale-95 shadow-md border-0 whitespace-nowrap flex items-center justify-center gap-2 ${
        isAdded
          ? 'bg-green-500 text-white hover:bg-green-600 hover:-translate-y-1'
          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-lg'
      }`}
    >
      {isAdding ? (
        <>
          <span className="animate-spin inline-block">⏳</span>
          <span className="hidden sm:inline">Añadiendo...</span>
        </>
      ) : isAdded ? (
        <>
          <span>✓</span>
          <span className="hidden sm:inline">¡Añadido!</span>
        </>
      ) : (
        <>
          <span>🛒</span>
          <span className="hidden sm:inline">Añadir</span>
        </>
      )}
    </button>
  );
}
