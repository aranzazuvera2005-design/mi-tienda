'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">¡Página no encontrada!</h2>
      <p className="text-gray-600 mb-8">Lo sentimos, no pudimos encontrar la página que buscas.</p>
      <Link 
        href="/" 
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Volver a la tienda
      </Link>
    </div>
  );
}
