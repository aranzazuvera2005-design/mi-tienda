'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CartDrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType | null>(null);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value: CartDrawerContextType = {
    isOpen,
    openDrawer: () => setIsOpen(true),
    closeDrawer: () => setIsOpen(false),
    toggleDrawer: () => setIsOpen(prev => !prev),
  };

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextType {
  const context = useContext(CartDrawerContext);
  
  if (!context) {
    // Retornar un objeto seguro para evitar errores
    return {
      isOpen: false,
      openDrawer: () => {},
      closeDrawer: () => {},
      toggleDrawer: () => {},
    };
  }
  
  return context;
}
