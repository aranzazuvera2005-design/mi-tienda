'use client';

/**
 * VariantesSelector — tienda pública
 * Carga los tipos asignados al producto desde producto_variantes + sus valores.
 * Renderiza cada tipo según su tipo_input: selector, texto_libre o foto.
 */

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface TipoVar {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_input: 'selector' | 'texto_libre' | 'foto';
  es_requerido: boolean;
  activo?: boolean;
}

interface ValorVar {
  id: string;
  tipo_id: string;
  valor: string;
  etiqueta: string | null;
  imagen_url: string | null;
  precio_extra: number;
  stock?: number;
}

export default function VariantesSelector({
  productoId, precio, onSeleccion
}: {
  productoId: string;
  precio: number;
  onSeleccion: (sel: Record<string, any>, precioFinal: number, textoPersonalizacion: string) => void;
}) {
  const [tipos,  setTipos]   = useState<TipoVar[]>([]);
  const [valores, setValores] = useState<ValorVar[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, any>>({});
  const [textos,    setTextos]    = useState<Record<string, string>>({});
  const [montado, setMontado] = useState(false);

  const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  useEffect(() => { setMontado(true); }, []);

  useEffect(() => {
    if (!montado || !SB_URL || !SB_ANON) return;
    const client = createBrowserClient(SB_URL, SB_ANON);

    (async () => {
      // 1. Tipos asignados al producto
      const { data: asig } = await client
        .from('producto_variantes')
        .select('tipo_id, tipos_variante(*)')
        .eq('producto_id', productoId)
        .order('orden');

      const ts: TipoVar[] = (asig || [])
        .map((r: any) => r.tipos_variante)
        .filter(Boolean)
        .filter((t: TipoVar) => t.activo !== false); // compatibilidad si no hay campo activo

      if (ts.length === 0) { setTipos([]); return; }

      const tipoIds = ts.map(t => t.id);
      const { data: vals } = await client
        .from('valores_variante')
        .select('*')
        .in('tipo_id', tipoIds)
        .eq('activo', true)
        .order('orden')
        .order('created_at');

      setTipos(ts);
      setValores(vals || []);
    })();
  }, [productoId, montado, SB_URL, SB_ANON]);

  const valoresTotales = (tipoId: string) => valores.filter(v => v.tipo_id === tipoId);

  const precioExtra = Object.values(seleccion).reduce((acc: number, v: any) => acc + (v?.precio_extra || 0), 0);
  const precioFinal = precio + precioExtra;

  // Notificar al padre
  useEffect(() => {
    const textoGlobal = Object.values(textos).filter(Boolean).join(' | ');
    onSeleccion(seleccion, precioFinal, textoGlobal);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccion, textos, precioFinal]);

  if (!montado || tipos.length === 0) return null;

  return (
    <div className="space-y-5 my-4">
      {tipos.map(tipo => {
        const vals = valoresTotales(tipo.id);
        const sel  = seleccion[tipo.id];

        return (
          <div key={tipo.id}>
            {/* Cabecera del tipo */}
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2 flex-wrap">
              {tipo.nombre}
              {tipo.es_requerido && (
                <span className="text-[9px] bg-red-50 text-red-500 border border-red-200 px-1.5 py-0.5 rounded font-black normal-case tracking-normal">Obligatorio</span>
              )}
              {sel && tipo.tipo_input !== 'texto_libre' && (
                <span className="ml-1 text-slate-900 normal-case tracking-normal font-bold">
                  — {sel.etiqueta ? `[${sel.etiqueta}] ` : ''}{sel.valor}
                </span>
              )}
            </p>
            {tipo.descripcion && (
              <p className="text-[11px] text-slate-400 mb-2">{tipo.descripcion}</p>
            )}

            {/* Selector de opciones */}
            {tipo.tipo_input === 'selector' && (
              <div className="flex flex-wrap gap-2">
                {vals.map(v => {
                  const esSel    = sel?.id === v.id;
                  const sinStock = v.stock === 0;
                  return (
                    <button key={v.id}
                      onClick={() => !sinStock && setSeleccion(s => ({ ...s, [tipo.id]: esSel ? undefined : v }))}
                      disabled={sinStock}
                      className={`relative px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all duration-200
                        ${sinStock ? 'opacity-40 cursor-not-allowed line-through border-slate-200 text-slate-400' :
                        esSel ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-105' :
                        'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:scale-105'}`}
                    >
                      {v.valor}
                      {v.precio_extra > 0 && <span className="text-[10px] ml-1 opacity-70">+{v.precio_extra}€</span>}
                      {sinStock && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">Agotado</span>
                      )}
                    </button>
                  );
                })}
                {vals.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Sin opciones disponibles</p>
                )}
              </div>
            )}

            {/* Con foto */}
            {tipo.tipo_input === 'foto' && (
              <div className="flex flex-wrap gap-2">
                {vals.map(v => {
                  const esSel    = sel?.id === v.id;
                  const sinStock = v.stock === 0;
                  return (
                    <button key={v.id}
                      onClick={() => !sinStock && setSeleccion(s => ({ ...s, [tipo.id]: esSel ? undefined : v }))}
                      disabled={sinStock}
                      className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 text-xs font-bold transition-all duration-200 min-w-[70px]
                        ${sinStock ? 'opacity-40 cursor-not-allowed border-slate-200' :
                        esSel ? 'border-slate-900 bg-slate-50 shadow-md scale-105' :
                        'border-slate-200 bg-white hover:border-slate-400 hover:scale-105'}`}
                    >
                      {v.imagen_url && (
                        <img src={v.imagen_url} alt={v.valor}
                          className={`w-14 h-14 rounded-lg object-cover ${esSel ? 'ring-2 ring-slate-900' : ''}`} />
                      )}
                      {v.etiqueta && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${esSel ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          {v.etiqueta}
                        </span>
                      )}
                      <span className="text-center leading-tight">{v.valor}</span>
                      {v.precio_extra > 0 && <span className="text-[9px] text-green-600 font-black">+{v.precio_extra}€</span>}
                      {sinStock && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded-full font-black">Agotado</span>
                      )}
                    </button>
                  );
                })}
                {vals.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Sin diseños disponibles</p>
                )}
              </div>
            )}

            {/* Texto libre */}
            {tipo.tipo_input === 'texto_libre' && (
              <div>
                <input
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-slate-900 outline-none transition-colors"
                  placeholder={vals[0]?.valor || `Escribe ${tipo.nombre.toLowerCase()}…`}
                  value={textos[tipo.id] || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setTextos(t => ({ ...t, [tipo.id]: val }));
                    if (val.trim()) {
                      setSeleccion(s => ({ ...s, [tipo.id]: { tipo_id: tipo.id, tipo_nombre: tipo.nombre, valor_usuario: val, precio_extra: vals[0]?.precio_extra || 0 } }));
                    } else {
                      setSeleccion(s => { const ns = { ...s }; delete ns[tipo.id]; return ns; });
                    }
                  }}
                  maxLength={200}
                />
                <p className="text-[10px] text-slate-400 mt-1">{(textos[tipo.id] || '').length}/200</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Precio extra si hay variantes con coste */}
      {precioExtra > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 line-through">{precio.toFixed(2)}€</span>
          <span className="text-xl font-black text-slate-900">{precioFinal.toFixed(2)}€</span>
          <span className="text-xs text-green-600 font-bold">+{precioExtra.toFixed(2)}€ opciones</span>
        </div>
      )}
    </div>
  );
}
