'use client';

import React, { createContext, useContext } from 'react';

/**
 * Este contexto simula las funciones de notificación (Toast)
 * para que el build de Next.js no falle por falta de proveedor.
 */

// 1. Definimos la forma del objeto para que TypeScript no se queje
interface ToastContextType {
  toast: (props: any) => void;
  addToast: (props: any) => void;
  dismiss: (id?: string) => void;
}

// 2. Creamos el contexto con valores por defecto (evita errores de undefined)
const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  addToast: () => {},
  dismiss: () => {},
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  // 3. Estas funciones no harán nada visualmente, pero permiten que el código se ejecute
  const value = {
    toast: (props: any) => console.log("Simulando toast:", props),
    addToast: (props: any) => console.log("Simulando addToast:", props),
    dismiss: (id?: string) => {},
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

// 4. El Hook que usarán tus componentes
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    // Si por algún motivo se usa fuera del Provider, devolvemos los mocks en lugar de lanzar error
    return {
      toast: () => {},
      addToast: () => {},
      dismiss: () => {},
    };
  }
  
  return context;
};
