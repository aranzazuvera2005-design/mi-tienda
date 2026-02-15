"use client";
import { useCart } from "../context/CartContext"; // Salimos de components para entrar en context

export default function AgregarAlCarritoBtn({ producto }: { producto: any }) {
  const { addToCart } = useCart();

  return (
    <button 
      onClick={() => {
        try {
          if (!producto || !producto.id) {
            alert('Producto inválido. No se pudo añadir.');
            return;
          }
          addToCart(producto);
          alert(`¡${producto.nombre || 'Producto'} añadido!`);
        } catch (e) {
          console.error('Error añadiendo al carrito', e);
          alert('Error añadiendo al carrito');
        }
      }}
      className="w-full bg-[#2563eb] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
    >
      Añadir al Carrito
    </button>
  );
}