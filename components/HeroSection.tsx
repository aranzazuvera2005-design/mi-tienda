'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Star } from 'lucide-react';

const FRASES = [
  'Hecho con amor.',
  'Único para ti.',
  'Calidad artesanal.',
];

export default function HeroSection() {
  const [fraseIdx, setFraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setFraseIdx(i => (i + 1) % FRASES.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] min-h-[380px] flex items-center" style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #fde8d8 40%, #fce4ec 100%)' }}>

      {/* Formas decorativas de fondo */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 -translate-y-1/3 translate-x-1/4" style={{ background: 'radial-gradient(circle, #f9a8d4, #fbbf24)' }} />
      <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-15 translate-y-1/2" style={{ background: 'radial-gradient(circle, #86efac, #34d399)' }} />
      <div className="absolute top-1/2 left-0 w-32 h-32 rounded-full opacity-10 -translate-x-1/2 -translate-y-1/2" style={{ background: '#fbbf24' }} />

      {/* Puntos decorativos */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-30"
          style={{
            width: 6 + (i % 3) * 4,
            height: 6 + (i % 3) * 4,
            background: ['#f9a8d4','#fbbf24','#86efac','#c4b5fd','#fdba74','#6ee7b7'][i],
            top: `${15 + i * 13}%`,
            right: `${8 + (i % 4) * 7}%`,
          }}
        />
      ))}

      <div className="relative z-10 w-full px-8 sm:px-16 py-12 flex flex-col sm:flex-row items-center gap-10">

        {/* Texto izquierda */}
        <div className="flex-1 space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ background: 'rgba(249,168,212,0.3)', color: '#be185d', border: '1px solid rgba(249,168,212,0.5)' }}>
            <Sparkles size={12} />
            Colección artesanal 2026
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.15]" style={{ color: '#1c1917' }}>
            Regalos que{' '}
            <span className="relative inline-block">
              <span style={{ color: '#ec4899' }}>enamoran</span>
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" preserveAspectRatio="none">
                <path d="M0,5 Q25,0 50,5 Q75,0 100,5" stroke="#f9a8d4" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
            {' '}desde el primer día.
          </h1>

          {/* Frase animada */}
          <p className="text-base font-bold transition-all duration-400 h-6" style={{ color: '#78716c', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)', transition: 'opacity 0.4s, transform 0.4s' }}>
            ✦ {FRASES[fraseIdx]}
          </p>

          {/* Estrellas */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#fbbf24" stroke="none" />)}
            </div>
            <span className="text-xs font-bold" style={{ color: '#78716c' }}>+200 clientes felices</span>
          </div>

          <div className="flex gap-3 pt-2 flex-wrap">
            <button
              onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-lg hover:-translate-y-0.5"
              style={{ background: '#1c1917', color: 'white', boxShadow: '0 4px 20px rgba(28,25,23,0.25)' }}
            >
              Ver colección <ArrowRight size={14}/>
            </button>
            <button
              onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 hover:-translate-y-0.5"
              style={{ background: 'rgba(236,72,153,0.1)', color: '#be185d', border: '1px solid rgba(236,72,153,0.25)' }}
            >
              <Sparkles size={13}/> Novedades
            </button>
          </div>
        </div>

        {/* Lado derecho — tarjetas flotantes */}
        <div className="relative flex-shrink-0 w-64 h-56 hidden sm:block">
          {/* Tarjeta grande */}
          <div className="absolute top-0 right-0 w-44 h-44 rounded-[1.5rem] shadow-2xl overflow-hidden border-4 border-white"
            style={{ background: 'linear-gradient(135deg, #fce7f3, #fef3c7)', transform: 'rotate(3deg)' }}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span style={{ fontSize: 52 }}>🧸</span>
              <span className="text-xs font-black" style={{ color: '#92400e' }}>Artesanal</span>
            </div>
          </div>
          {/* Tarjeta pequeña */}
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-[1.2rem] shadow-xl overflow-hidden border-4 border-white"
            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', transform: 'rotate(-4deg)' }}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <span style={{ fontSize: 36 }}>🎁</span>
              <span className="text-xs font-black" style={{ color: '#065f46' }}>Regalo</span>
            </div>
          </div>
          {/* Badge flotante */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full shadow-lg font-black text-[11px] uppercase tracking-wider border-2 border-white z-10"
            style={{ background: '#ec4899', color: 'white', transform: 'translate(-50%, -50%) rotate(-8deg)' }}>
            ✨ Best seller
          </div>
        </div>
      </div>
    </section>
  );
}
