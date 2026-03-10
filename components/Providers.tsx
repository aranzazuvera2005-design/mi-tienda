'use client';

import React from 'react';
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { CartDrawerProvider } from "@/context/CartDrawerContext";

/**
 * Unificamos todos los proveedores en un solo componente de cliente.
 * Esto asegura que la jerarquía de contextos sea consistente y evita
 * errores de hidratación o contextos "perdidos" entre el servidor y el cliente.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>
        <CartDrawerProvider>
          {children}
        </CartDrawerProvider>
      </CartProvider>
    </ToastProvider>
  );
}
