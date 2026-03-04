/**
 * Componente de carga global para Next.js App Router.
 * Diseñado con Skeleton Screen y animaciones de Tailwind (animate-pulse).
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Skeleton del Hero */}
        <div className="bg-white rounded-xl p-8 mb-4 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-6 animate-pulse">
          <div className="flex-1 w-full">
            <div className="h-10 bg-gray-200 rounded-lg w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
          </div>
          <div className="hidden md:block">
            <div className="w-40 h-40 bg-gray-100 rounded-full"></div>
          </div>
        </div>

        {/* Skeleton del Buscador */}
        <div className="mb-8 flex gap-0 items-center overflow-hidden rounded-xl border border-gray-200 shadow-sm animate-pulse">
          <div className="flex-1 p-4 h-14 bg-white"></div>
          <div className="px-8 py-4 bg-gray-200 w-32 h-14"></div>
        </div>

        {/* Grid de Skeletons de Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="bg-white p-0 rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden animate-pulse"
            >
              {/* Imagen Skeleton */}
              <div className="w-full h-48 bg-gray-200"></div>

              {/* Contenido Skeleton */}
              <div className="p-5 flex flex-col flex-1">
                <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded-lg w-full mb-2"></div>
                <div className="h-4 bg-gray-100 rounded-lg w-1/2 mb-6"></div>
                
                <div className="mt-auto flex items-end justify-between">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-8"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-32 h-10 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
