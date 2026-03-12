'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const TIPO_LABELS: Record<string, string> = {
  talla:           'Talla',
  color:           'Color',
  diseno_tela:     'Diseño de tela',
  accesorio:       'Accesorio',
  personalizacion: 'Personalización',
};

export default function VariantesSelector({ productoId, precio, onSeleccion }: {
  productoId: string;
  precio: number;
  onSeleccion: (variantes: Record<string, any>, precioFinal: number, personalizacion: string) => void;
}) {
  const [variantes, setVariantes] = useState<any[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, any>>({});
  const [personalizacion, setPersonalizacion] = useState('');
  const [montado, setMontado] = useState(false);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  useEffect(() => { setMontado(true); }, []);

  useEffect(() => {
    if (!montado || !SUPABASE_URL || !SUPABASE_ANON) return;
    createBrowserClient(SUPABASE_URL, SUPABASE_ANON)
      .from('variantes').select('*').eq('producto_id', productoId)
      .then(({ data }) => setVariantes(data || []));
  }, [productoId, montado]);

  const tipos = [...new Set(variantes.map(v => v.tipo))];
  const porTipo = (t: string) => variantes.filter(v => v.tipo === t);
  const precioExtra = Object.values(seleccion).reduce((acc: number, v: any) => acc + (v?.precio_extra || 0), 0);
  const precioFinal = precio + precioExtra;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onSeleccion(seleccion, precioFinal, personalizacion); }, [seleccion, personalizacion, precioFinal]);

  if (!montado || variantes.length === 0) return null;

  return (
    <div className="space-y-4 my-4">
      {tipos.filter(t => t !== 'personalizacion').map(tipo => (
        <div key={tipo}>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
            {TIPO_LABELS[tipo] || tipo}
            {seleccion[tipo] && (
              <span className="ml-2 text-slate-900 normal-case tracking-normal font-bold">
                — {seleccion[tipo].etiqueta ? `[${seleccion[tipo].etiqueta}] ` : ''}{seleccion[tipo].valor}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {porTipo(tipo).map(v => {
              const sel = seleccion[tipo]?.id === v.id;
              const sinStock = v.stock === 0;
              return (
                <button key={v.id}
                  onClick={() => !sinStock && setSeleccion(s => ({ ...s, [tipo]: sel ? undefined : v }))}
                  disabled={sinStock}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all duration-200
                    ${sinStock ? 'opacity-40 cursor-not-allowed line-through border-slate-200 text-slate-400' :
                    sel ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-105' :
                    'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:scale-105'}`}
                >
                  {/* Color */}
                  {tipo === 'color' && (
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: v.valor.toLowerCase(), border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
                  )}
                  {/* Diseño de tela: foto miniatura + etiqueta */}
                  {tipo === 'diseno_tela' && v.imagen_url && (
                    <img src={v.imagen_url} alt={v.valor}
                      className={`w-8 h-8 rounded-md object-cover border ${sel ? 'border-white/30' : 'border-slate-200'}`}
                    />
                  )}
                  {v.etiqueta && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${sel ? 'bg-white/20' : 'bg-slate-900 text-white'}`}>
                      {v.etiqueta}
                    </span>
                  )}
                  <span>{v.valor}</span>
                  {v.precio_extra > 0 && <span className="text-[10px] opacity-70">+{v.precio_extra}€</span>}
                  {sinStock && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">Agotado</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {tipos.includes('personalizacion') && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
            {TIPO_LABELS['personalizacion']}
            {porTipo('personalizacion')[0]?.precio_extra > 0 &&
              <span className="ml-2 normal-case tracking-normal font-bold text-green-600">+{porTipo('personalizacion')[0].precio_extra}€</span>
            }
          </p>
          <input
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-slate-900 outline-none transition-colors"
            placeholder={porTipo('personalizacion')[0]?.valor || 'Escribe tu personalización…'}
            value={personalizacion}
            onChange={e => {
              setPersonalizacion(e.target.value);
              if (e.target.value) {
                setSeleccion(s => ({ ...s, personalizacion: { ...porTipo('personalizacion')[0], valor_usuario: e.target.value } }));
              } else {
                setSeleccion(s => { const ns = { ...s }; delete ns.personalizacion; return ns; });
              }
            }}
            maxLength={100}
          />
          <p className="text-[10px] text-slate-400 mt-1">{personalizacion.length}/100 caracteres</p>
        </div>
      )}

      {precioExtra > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-slate-400 line-through">{precio.toFixed(2)}€</span>
          <span className="text-lg font-black text-slate-900">{precioFinal.toFixed(2)}€</span>
          <span className="text-xs text-green-600 font-bold">+{precioExtra.toFixed(2)}€ por variantes</span>
        </div>
      )}
    </div>
  );
}
