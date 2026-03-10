'use client';

import { ReactNode } from 'react';
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { CartDrawerProvider } from "@/context/CartDrawerContext";

export function Providers({ children }: { children: ReactNode }) {
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
