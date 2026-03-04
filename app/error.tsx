'use client';

import { useEffect } from 'react';

/**
 * Error Boundary de Next.js (App Router)
 * Captura errores en segmentos de la ruta y permite recuperarse sin recargar toda la página.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registrar el error en consola para depuración
    console.error('Error capturado por el Boundary:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-red-50 p-8 rounded-3xl border border-red-100 max-w-md w-full shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="currentColor" 
            className="w-8 h-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          ¡Vaya! Algo salió mal
        </h2>
        
        <p className="text-gray-600 mb-8">
          Hubo un problema al cargar la información. No te preocupes, puedes intentar cargarla de nuevo sin perder tu progreso.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            Reintentar carga
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white hover:bg-gray-50 text-gray-500 font-semibold py-3 px-6 rounded-xl border border-gray-200 transition-all"
          >
            Refrescar página completa
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 text-left p-3 bg-gray-900 rounded-lg overflow-auto max-h-32">
            <code className="text-xs text-green-400 font-mono">
              {error.message || 'Error desconocido'}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
