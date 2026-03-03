import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-extrabold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        ¡Página no encontrada!
      </h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Parece que el producto o la página que buscas no existe o ha sido movida. 
        ¡Pero no te preocupes, el resto de la tienda sigue aquí!
      </p>
      <Link 
        href="/" 
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
      >
        Volver a la tienda
      </Link>
    </div>
  );
}
