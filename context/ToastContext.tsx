'use client';

import React, { createContext, useContext } from 'react';

// Creamos el contexto con todas las variantes de nombres que tu código usa
const ToastContext = createContext<any>({
  toast: () => {},
  addToast: () => {},
  dismiss: () => {}
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const value = {
    toast: () => {},
    addToast: () => {}, // <--- Esto es lo que pedía la página de clientes
    dismiss: () => {}
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return useContext(ToastContext);
};
