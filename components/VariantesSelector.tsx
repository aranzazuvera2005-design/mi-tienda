'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const TIPO_LABELS: Record<string, string> = {
  talla: 'Talla',
  color: 'Color',
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

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    sb.from('variantes').select('*').eq('producto_id', productoId).then(({ data }) => {
      setVariantes(data || []);
    });
  }, [productoId]);

  const tipos = [...new Set(variantes.map(v => v.tipo))];

  const variantesPorTipo = (tipo: string) => variantes.filter(v => v.tipo === tipo);

  const precioExtra = Object.values(seleccion).reduce((acc: number, v: any) => acc + (v?.precio_extra || 0), 0);
  const precioFinal = precio + precioExtra;

  useEffect(() => {
    onSeleccion(seleccion, precioFinal, personalizacion);
  }, [seleccion, personalizacion, precioFinal]);

  if (variantes.length === 0) return null;

  return (
    <div className="space-y-4 my-4">
      {tipos.filter(t => t !== 'personalizacion').map(tipo => (
        <div key={tipo}>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
            {TIPO_LABELS[tipo] || tipo}
            {seleccion[tipo] && <span className="ml-2 text-slate-900 normal-case tracking-normal font-bold">— {seleccion[tipo].valor}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {variantesPorTipo(tipo).map(v => {
              const seleccionado = seleccion[tipo]?.id === v.id;
              const sinStock = v.stock === 0;
              return (
                <button
                  key={v.id}
                  onClick={() => !sinStock && setSeleccion(s => ({ ...s, [tipo]: seleccionado ? undefined : v }))}
                  disabled={sinStock}
                  className={`relative px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all duration-200
                    ${sinStock ? 'opacity-40 cursor-not-allowed line-through border-slate-200 text-slate-400' :
                    seleccionado ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-105' :
                    'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:scale-105'}`}
                >
                  {tipo === 'color' && (
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: v.valor.toLowerCase(), border: '1px solid rgba(0,0,0,0.2)', marginRight: 6, verticalAlign: 'middle' }} />
                  )}
                  {v.valor}
                  {v.precio_extra > 0 && <span className="text-[10px] ml-1 opacity-70">+{v.precio_extra}€</span>}
                  {sinStock && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">Agotado</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Personalización como texto libre */}
      {tipos.includes('personalizacion') && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
            {TIPO_LABELS['personalizacion']}
            {variantesPorTipo('personalizacion')[0]?.precio_extra > 0 &&
              <span className="ml-2 normal-case tracking-normal font-bold text-green-600">+{variantesPorTipo('personalizacion')[0].precio_extra}€</span>
            }
          </p>
          <input
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-slate-900 outline-none transition-colors"
            placeholder={variantesPorTipo('personalizacion')[0]?.valor || 'Escribe tu personalización...'}
            value={personalizacion}
            onChange={e => {
              setPersonalizacion(e.target.value);
              if (e.target.value) {
                setSeleccion(s => ({ ...s, personalizacion: { ...variantesPorTipo('personalizacion')[0], valor_usuario: e.target.value } }));
              } else {
                setSeleccion(s => { const ns = {...s}; delete ns.personalizacion; return ns; });
              }
            }}
            maxLength={100}
          />
          <p className="text-[10px] text-slate-400 mt-1">{personalizacion.length}/100 caracteres</p>
        </div>
      )}

      {/* Precio final si hay extra */}
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
