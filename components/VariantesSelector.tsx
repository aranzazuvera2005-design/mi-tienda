'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface TipoVariante {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_input: 'selector' | 'texto_libre' | 'foto';
  es_requerido: boolean;
}

interface VarianteProducto {
  id: string;
  tipo: string;
  valor: string;
  etiqueta?: string;
  imagen_url?: string;
  precio_extra: number;
  stock: number;
  valor_id?: string;
}

export default function VariantesSelector({ productoId, precio, onSeleccion }: {
  productoId: string;
  precio: number;
  onSeleccion: (variantes: Record<string, any>, precioFinal: number, personalizacion: string) => void;
}) {
  const [variantes, setVariantes]   = useState<VarianteProducto[]>([]);
  const [tipos, setTipos]           = useState<TipoVariante[]>([]);
  const [seleccion, setSeleccion]   = useState<Record<string, any>>({});
  const [textos, setTextos]         = useState<Record<string, string>>({});
  const [montado, setMontado]       = useState(false);

  const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  useEffect(() => { setMontado(true); }, []);

  useEffect(() => {
    if (!montado || !SUPABASE_URL || !SUPABASE_ANON) return;
    const client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);

    Promise.all([
      client.from('variantes').select('*').eq('producto_id', productoId),
      client.from('tipos_variante').select('*').eq('activo', true).order('orden'),
    ]).then(([{ data: vars }, { data: ts }]) => {
      const varList = vars || [];
      const tipoIds = [...new Set(varList.map(v => v.tipo))];
      // Solo mostrar tipos que este producto tiene asignados
      const tiposProducto = (ts || []).filter(t => tipoIds.includes(t.id));
      setVariantes(varList);
      setTipos(tiposProducto);
    });
  }, [productoId, montado]);

  const precioExtra = Object.values(seleccion).reduce((acc: number, v: any) => acc + (v?.precio_extra || 0), 0)
    + Object.entries(textos).reduce((acc, [tid, txt]) => {
      const v = variantes.find(v => v.tipo === tid);
      return acc + (txt ? (v?.precio_extra || 0) : 0);
    }, 0);
  const precioFinal = precio + precioExtra;

  // Notificar cambios
  useEffect(() => {
    const personalizacion = Object.values(textos).filter(Boolean).join(' | ');
    onSeleccion({ ...seleccion, ...Object.fromEntries(Object.entries(textos).map(([k, v]) => [k, v ? { tipo: k, valor: v } : undefined]).filter(([, v]) => v)) }, precioFinal, personalizacion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccion, textos, precioFinal]);

  if (!montado || variantes.length === 0) return null;

  return (
    <div className="space-y-4 my-4">
      {tipos.map(tipo => {
        const varsDelTipo = variantes.filter(v => v.tipo === tipo.id);

        return (
          <div key={tipo.id}>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">
              {tipo.nombre}
              {tipo.es_requerido && <span className="ml-1.5 text-red-400 normal-case tracking-normal">*</span>}
              {seleccion[tipo.id] && (
                <span className="ml-2 text-slate-900 normal-case tracking-normal font-bold">
                  — {seleccion[tipo.id].etiqueta ? `[${seleccion[tipo.id].etiqueta}] ` : ''}{seleccion[tipo.id].valor}
                </span>
              )}
            </p>
            {tipo.descripcion && (
              <p className="text-[11px] text-slate-400 mb-2">{tipo.descripcion}</p>
            )}

            {/* Texto libre */}
            {tipo.tipo_input === 'texto_libre' ? (
              <div>
                <input
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-slate-900 outline-none transition-colors"
                  placeholder={varsDelTipo[0]?.valor || 'Escribe aquí…'}
                  value={textos[tipo.id] || ''}
                  onChange={e => setTextos(t => ({ ...t, [tipo.id]: e.target.value }))}
                  maxLength={200}
                />
                <p className="text-[10px] text-slate-400 mt-1">{(textos[tipo.id] || '').length}/200 caracteres</p>
              </div>
            ) : (
              /* Selector / Foto */
              <div className="flex flex-wrap gap-2">
                {varsDelTipo.map(v => {
                  const sel      = seleccion[tipo.id]?.id === v.id;
                  const sinStock = v.stock === 0;
                  return (
                    <button key={v.id}
                      onClick={() => !sinStock && setSeleccion(s => ({ ...s, [tipo.id]: sel ? undefined : v }))}
                      disabled={sinStock}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all duration-200
                        ${sinStock
                          ? 'opacity-40 cursor-not-allowed line-through border-slate-200 text-slate-400'
                          : sel
                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-105'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:scale-105'}`}
                    >
                      {/* Foto */}
                      {v.imagen_url && (
                        <img src={v.imagen_url} alt={v.valor}
                          className={`w-8 h-8 rounded-md object-cover border ${sel ? 'border-white/30' : 'border-slate-200'}`}
                        />
                      )}
                      {/* Etiqueta letra */}
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
            )}
          </div>
        );
      })}

      {/* Precio extra total */}
      {precioExtra > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 line-through">{precio.toFixed(2)}€</span>
          <span className="text-lg font-black text-slate-900">{precioFinal.toFixed(2)}€</span>
          <span className="text-xs text-green-600 font-bold">+{precioExtra.toFixed(2)}€ por variantes</span>
        </div>
      )}
    </div>
  );
}
