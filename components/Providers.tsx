// components/Providers.tsx
'use client';

import React, { createContext } from 'react';
import { CartProvider } from "@/context/CartContext";

// Creamos el contexto aquí donde 'use client' está permitido
export const ToastContext = createContext({ toast: () => {} });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastContext.Provider value={{ toast: () => {} }}>
      <CartProvider>
        {children}
      </CartProvider>
    </ToastContext.Provider>
  );
}
