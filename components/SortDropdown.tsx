'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';

interface SortOption {
  value: string;
  label: string;
  icon: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'name_asc', label: 'Alfabético (A-Z)', icon: '🔤' },
  { value: 'name_desc', label: 'Alfabético (Z-A)', icon: '🔤' },
  { value: 'price_asc', label: 'Precio (Menor a Mayor)', icon: '💰' },
  { value: 'price_desc', label: 'Precio (Mayor a Menor)', icon: '💰' },
  { value: 'newest', label: 'Novedades', icon: '✨' },
];

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('newest');

  // Sincronizar el estado con los parámetros de URL
  useEffect(() => {
    const sortParam = searchParams.get('sort') || 'newest';
    setSelectedSort(sortParam);
  }, [searchParams]);

  const handleSort = (sortValue: string) => {
    setSelectedSort(sortValue);
    setIsOpen(false);

    // Usar useTransition para evitar recargas completas
    startTransition(() => {
      // Construir nueva URL con el parámetro de ordenación
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', sortValue);
      
      // Resetear la página a 1 cuando se cambia el ordenamiento
      params.delete('page');
      
      // Usar router.push sin scroll
      (router.push as any)(`?${params.toString()}`, { scroll: false });
    });
  };

  const selectedOption = SORT_OPTIONS.find(opt => opt.value === selectedSort);

  return (
    <div className="relative inline-block w-full sm:w-auto">
      {/* Botón del Dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between gap-3 font-medium text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className="flex items-center gap-2">
          <span>{selectedOption?.icon}</span>
          <span className="hidden sm:inline">{selectedOption?.label}</span>
          <span className="sm:hidden text-sm">Ordenar</span>
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSort(option.value)}
              disabled={isPending}
              className={`w-full px-6 py-3 text-left flex items-center gap-3 transition-all disabled:opacity-60 ${
                selectedSort === option.value
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{option.icon}</span>
              <span>{option.label}</span>
              {selectedSort === option.value && (
                <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay para cerrar el dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
