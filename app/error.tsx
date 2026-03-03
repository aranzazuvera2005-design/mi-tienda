'use client'; // Los archivos de error siempre deben ser Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí podrías conectar Sentry para que te llegue un aviso del error
    console.error('Error detectado:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        ¡Ups! Algo no ha salido como esperábamos
      </h2>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Ha ocurrido un error inesperado en la tienda. No te preocupes, tus datos están a salvo.
      </p>
      <button
        onClick={() => reset()}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
