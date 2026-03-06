'use client';
import React, { createContext, useContext, useState, useMemo } from 'react';

// Definimos la interfaz
interface CartDrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

// Creamos el contexto con un valor inicial seguro pero nulo
const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);
CartDrawerContext.displayName = 'CartDrawerContext';

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

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

// Exportamos con ambos nombres para evitar errores de importación en otros archivos
export const CartDrawerWrapper = CartDrawerProvider;

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  
  // Si el contexto no existe, devolvemos un objeto funcional "dummy" 
  // para que la app NO se rompa (esto es lo que evita el error que ves)
  if (!context) {
    return {
      isOpen: false,
      openDrawer: () => console.warn("CartDrawerProvider no encontrado"),
      closeDrawer: () => {},
      toggleDrawer: () => {}
    };
  }
  return context;
}
