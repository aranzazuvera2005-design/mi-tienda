'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Página 404 personalizada con redirección automática y manual.
 */
export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Redirección automática después de 5 segundos
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-lg w-full transform hover:scale-[1.01] transition-all">
        <h1 className="text-9xl font-black text-blue-600 mb-4 opacity-10 leading-none">404</h1>
        
        <div className="relative -mt-20 mb-8">
          <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-12 h-12"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          ¡Página no encontrada!
        </h2>
        
        <p className="text-gray-600 mb-10 text-lg">
          Parece que lo que buscas se ha movido o ya no existe. No te preocupes, te llevaremos de vuelta a la tienda en unos segundos.
        </p>
        
        <div className="flex flex-col gap-4">
          <Link 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            Volver a la tienda ahora
          </Link>
          
          <div className="text-sm text-gray-400 font-medium">
            Redirección automática en <span className="text-blue-500 font-bold">{countdown}</span> segundos...
          </div>
        </div>
      </div>
    </div>
  );
}
