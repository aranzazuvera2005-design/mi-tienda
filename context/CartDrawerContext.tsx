'use client';
import React, { createContext, useContext, useState, useMemo } from 'react';

// 1. Definimos una interfaz para tener autocompletado y evitar errores de TS
interface CartDrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  // Usamos useMemo para evitar renders innecesarios
  const value = useMemo(() => ({
    isOpen,
    openDrawer: () => setIsOpen(true),
    closeDrawer: () => setIsOpen(false),
    toggleDrawer: () => setIsOpen(prev => !prev)
  }), [isOpen]);

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
    </CartDrawerContext.Provider>
  );
}

// Exportamos también como CartDrawerWrapper por si algún componente antiguo lo busca con ese nombre
export const CartDrawerWrapper = CartDrawerProvider;

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  
  // Si alguien lo usa fuera del Provider, devolvemos valores seguros 
  // para que la tienda NO se rompa y el build termine OK.
  if (!context) {
    console.warn("useCartDrawer fue llamado fuera de su Provider. Revisa layout.tsx");
    return { 
      isOpen: false, 
      openDrawer: () => {}, 
      closeDrawer: () => {}, 
      toggleDrawer: () => {} 
    };
  }
  return context;
}
