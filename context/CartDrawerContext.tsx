'use client';
import React, { createContext, useContext, useState } from 'react';

const CartDrawerContext = createContext<any>(null);

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <CartDrawerContext.Provider value={{ 
      isOpen, 
      openDrawer: () => setIsOpen(true), 
      closeDrawer: () => setIsOpen(false), 
      toggleDrawer: () => setIsOpen(!isOpen) 
    }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  // RETORNO SEGURO: Si el context es null, devolvemos un objeto dummy
  if (!context) {
    return { isOpen: false, openDrawer: () => {}, closeDrawer: () => {}, toggleDrawer: () => {} };
  }
  return context;
}
