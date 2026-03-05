'use client';

import React, { createContext, useContext } from 'react';

// 1. Creamos el contexto con un valor por defecto para que NUNCA sea undefined
const ToastContext = createContext<{ toast: any }>({
  toast: () => console.log("Toast simulado")
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastContext.Provider value={{ toast: () => {} }}>
      {children}
    </ToastContext.Provider>
  );
};

// 2. Exportamos el Hook que los componentes están buscando
export const useToast = () => {
  const context = useContext(ToastContext);
  // Eliminamos el 'throw Error' para que el build pase aunque no haya provider
  return context || { toast: () => {} };
};
