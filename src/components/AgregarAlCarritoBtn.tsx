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
      className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-black transition-colors active:scale-95 shadow-md"
    >
      Añadir al Carrito
    </button>
  );
}