'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPABASE_BASE_URL = 'https://vjkdxevzdtjsgabyxdgs.supabase.co/storage/v1/object/public';

const buildImageUrl = (imagenUrl: string | null | undefined): string => {
  if (!imagenUrl) return '/globe.svg';
  if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
    return imagenUrl;
  }
  return `${SUPABASE_BASE_URL}/${imagenUrl}`;
};

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Consumo seguro del contexto
  const cartContext = useCart();
  
  useEffect(() => {
    if (isOpen && isMounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMounted]);

  // Si no está montado, o por alguna razón el contexto no carga, 
  // devolvemos null para que Next.js no lance el error de "Vaya, algo salió mal"
  if (!isMounted || !cartContext) return null;

  // Ahora extraemos con total seguridad
  const { cart = [], removeFromCart = () => {}, total = 0 } = cartContext;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-black text-blue-600">Mi Carrito</h2>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Boutique v2026</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-600 hover:text-white rounded-full transition-all text-blue-600 border border-blue-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="text-7xl">🛒</div>
              <p className="text-slate-800 font-bold text-xl">Tu carrito está vacío</p>
              <button onClick={onClose} className="text-blue-600 font-bold underline">
                Volver a la tienda
              </button>
            </div>
          ) : (
            cart.map((item: any) => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm group">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                    <Image
                      src={buildImageUrl(item.imagen_url || item.imagenUrl)}
                      alt={item.nombre}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{item.nombre}</h3>
                    <p className="text-blue-600 font-black">{(Number(item.precio) * (item.cantidad || 1)).toFixed(2)}€</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-300 hover:text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-8 bg-white">
            <div className="flex justify-between mb-6">
              <span className="text-slate-400 font-bold uppercase text-xs">Total</span>
              <span className="text-3xl font-black text-slate-900">{total.toFixed(2)}€</span>
            </div>
            <Link
              href="/carrito"
              onClick={onClose}
              className="block w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-center shadow-xl shadow-blue-100"
            >
              Finalizar Compra
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
