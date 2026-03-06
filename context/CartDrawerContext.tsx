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
  // Intentamos obtener el contexto de forma segura
  let context;
  try {
    context = useContext(CartDrawerContext);
  } catch (e) {
    console.error("Error accediendo a CartDrawerContext:", e);
  }
  
  // Si el contexto no existe o falla, devolvemos un objeto funcional "dummy" 
  // para que la app NO se rompa bajo ninguna circunstancia.
  if (!context) {
    return {
      isOpen: false,
      openDrawer: () => {
        console.warn("CartDrawerProvider no encontrado o inaccesible.");
      },
      closeDrawer: () => {},
      toggleDrawer: () => {}
    };
  }
  return context;
}
