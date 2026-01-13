"use client";
import { useCart } from "../context/CartContext"; // Salimos de components para entrar en context

export default function AgregarAlCarritoBtn({ producto }: { producto: any }) {
  const { addToCart } = useCart();

  return (
    <button 
      onClick={() => {
        addToCart(producto);
        alert(`¡${producto.nombre} añadido!`);
      }}
      className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-black transition-colors active:scale-95 shadow-md"
    >
      Añadir al Carrito
    </button>
  );
}