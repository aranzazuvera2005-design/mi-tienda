import dynamic from 'next/dynamic';

// Cargamos el Header de cliente de forma dinámica con ssr: false
// Esto asegura que el componente que consume contextos se renderice SOLO en el cliente
const HeaderClient = dynamic(() => import('./HeaderClient'), { 
  ssr: false,
  loading: () => (
    <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 h-24 flex items-center px-6 sm:px-16 justify-between">
      <div className="flex flex-col">
        <span className="text-2xl font-black text-slate-900 tracking-[0.2em]">BOUTIQUE</span>
        <span className="text-[10px] font-bold text-slate-400 tracking-[0.4em] uppercase -mt-1">v2026</span>
      </div>
    </header>
  )
});

export default function Header() {
  return <HeaderClient />;
}
