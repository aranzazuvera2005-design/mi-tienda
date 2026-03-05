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
  // 1. EL SEGURO: Estado de montaje para evitar errores de hidratación y SSR
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Consumo del contexto (solo se usará si isMounted es true)
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

  // Si no está montado, no renderizamos NADA para evitar el error de los logs
  if (!isMounted) return null;

  // Extraemos datos del contexto de forma segura
  const { cart, removeFromCart, total } = cartContext;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header con gradiente Fase 4 */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-black text-blue-600">Mi Carrito</h2>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Fase 4 - Edición Boutique</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-600 hover:text-white rounded-full transition-all duration-300 text-blue-600 border border-blue-100 shadow-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll elegante */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="text-7xl bg-white w-24 h-24 flex items-center justify-center rounded-full shadow-inner">🛒</div>
              <div>
                <p className="text-slate-800 font-bold text-xl">¿Aún nada?</p>
                <p className="text-slate-400 text-sm mt-1">Tus próximos favoritos te están esperando.</p>
              </div>
              <button 
                onClick={onClose}
                className="text-blue-600 font-bold text-sm underline underline-offset-4"
              >
                Volver a la tienda
              </button>
            </div>
          ) : (
            cart.map((item: any) => (
              <div
                key={item.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-50">
                    <Image
                      src={buildImageUrl(item.imagen_url || item.imagenUrl)}
                      alt={item.nombre}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base line-clamp-1">{item.nombre}</h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">Cant: {item.cantidad || 1}</p>
                    </div>
                    <p className="text-blue-600 font-black text-lg">
                      {(Number(item.precio || 0) * (item.cantidad || 1)).toFixed(2)}€
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="self-start p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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

        {/* Footer Premium */}
        {cart.length > 0 && (
          <div className="border-t border-slate-100 p-8 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end mb-6">
              <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Total Estimado</span>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">
                {total.toFixed(2)}€
              </span>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/carrito"
                onClick={onClose}
                className="block w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98]"
              >
                Finalizar Compra
              </Link>
              <button
                onClick={onClose}
                className="w-full text-slate-400 font-bold py-2 text-sm hover:text-slate-600 transition-colors"
              >
                Continuar explorando
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
