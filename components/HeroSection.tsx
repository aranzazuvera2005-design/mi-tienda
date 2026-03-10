'use client';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white min-h-[400px] flex items-center p-12 sm:p-20 shadow-2xl">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.2em]">
          Nueva Colección 2026
        </div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1]">
          Estilo que <span className="text-blue-500">Define</span> tu Historia.
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-lg leading-relaxed">
          Descubre una selección curada de piezas exclusivas diseñadas para quienes buscan la excelencia en cada detalle.
        </p>
        <div className="pt-4">
          <button 
            onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95"
          >
            Explorar Ahora
          </button>
        </div>
      </div>
    </section>
  );
}
