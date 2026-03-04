'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import CartDrawer from './CartDrawer';

interface CartDrawerContextType {
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  if (!context) {
    throw new Error('useCartDrawer debe usarse dentro de CartDrawerWrapper');
  }
  return context;
}

export default function CartDrawerWrapper({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  return (
    <CartDrawerContext.Provider value={{ openDrawer, closeDrawer }}>
      {children}
      <CartDrawer isOpen={isOpen} onClose={closeDrawer} />
    </CartDrawerContext.Provider>
  );
}
