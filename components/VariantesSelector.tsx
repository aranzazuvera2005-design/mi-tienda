'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function VariantesSelector({
  productoId, precio, onSeleccion
}: {
  productoId: string;
  precio: number;
  onSeleccion: (sel: Record<string, any>, precioFinal: number, texto: string) => void;
}) {
  const [grupos,    setGrupos]    = useState<any[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, any>>({});
  const [textos,    setTextos]    = useState<Record<string, string>>({});
  const [montado,   setMontado]   = useState(false);

  const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  useEffect(() => { setMontado(true); }, []);

  useEffect(() => {
    if (!montado || !SB_URL || !SB_ANON) return;
    const client = createBrowserClient(SB_URL, SB_ANON);

    (async () => {
      // 1. Cargar variantes del producto (la tabla que siempre existe)
      const { data: vars } = await client
        .from('variantes')
        .select('*')
        .eq('producto_id', productoId)
        .order('created_at');

      if (!vars || vars.length === 0) { setGrupos([]); return; }

      // 2. Intentar cargar tipos_variante para etiquetas/config — opcional
      let tiposMap: Record<string, any> = {};
      try {
        const tipoIds = [...new Set(vars.map((v: any) => v.tipo))].filter(t =>
          // solo si parece un UUID (36 chars con guiones)
          typeof t === 'string' && t.length === 36 && t.includes('-')
        );
        if (tipoIds.length > 0) {
          const { data: ts } = await client
            .from('tipos_variante')
            .select('id, nombre, descripcion, tipo_input, es_requerido')
            .in('id', tipoIds);
          (ts || []).forEach((t: any) => { tiposMap[t.id] = t; });
        }
      } catch { /* tipos_variante puede no existir aún */ }

      // 3. Agrupar por tipo
      const tipoIds = [...new Set(vars.map((v: any) => v.tipo))];
      const grupos = tipoIds.map(tid => {
        const tipo = tiposMap[tid];
        return {
          tipo_id:      String(tid),
          label:        tipo?.nombre || String(tid),
          descripcion:  tipo?.descripcion || null,
          tipo_input:   tipo?.tipo_input || 'selector',
          es_requerido: tipo?.es_requerido || false,
          items:        vars.filter((v: any) => v.tipo === tid),
        };
      });

      setGrupos(grupos);
    })();
  }, [productoId, montado, SB_URL, SB_ANON]);

  const precioExtra = Object.values(seleccion).reduce((acc: number, v: any) => acc + (v?.precio_extra || 0), 0);
  const precioFinal = precio + precioExtra;

  useEffect(() => {
    const texto = Object.values(textos).filter(Boolean).join(' | ');
    onSeleccion(seleccion, precioFinal, texto);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccion, textos, precioFinal]);

  if (!montado || grupos.length === 0) return null;

  return (
    <div className="space-y-5 my-4">
      {grupos.map(grupo => {
        const sel = seleccion[grupo.tipo_id];

        return (
          <div key={grupo.tipo_id}>
            {/* Cabecera */}
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2 flex-wrap">
              {grupo.label}
              {grupo.es_requerido && (
                <span className="text-[9px] bg-red-50 text-red-500 border border-red-200 px-1.5 py-0.5 rounded font-black normal-case tracking-normal">Obligatorio</span>
              )}
              {sel && grupo.tipo_input !== 'texto_libre' && (
                <span className="ml-1 text-slate-900 normal-case tracking-normal font-bold">
                  — {sel.etiqueta ? `[${sel.etiqueta}] ` : ''}{sel.valor}
                </span>
              )}
            </p>
            {grupo.descripcion && (
              <p className="text-[11px] text-slate-400 mb-2">{grupo.descripcion}</p>
            )}

            {/* Texto libre */}
            {grupo.tipo_input === 'texto_libre' ? (
              <div>
                <input
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-slate-900 outline-none transition-colors"
                  placeholder={grupo.items[0]?.valor || `Escribe ${grupo.label.toLowerCase()}…`}
                  value={textos[grupo.tipo_id] || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setTextos(t => ({ ...t, [grupo.tipo_id]: val }));
                    if (val.trim()) {
                      setSeleccion(s => ({ ...s, [grupo.tipo_id]: { ...grupo.items[0], valor_usuario: val } }));
                    } else {
                      setSeleccion(s => { const ns = { ...s }; delete ns[grupo.tipo_id]; return ns; });
                    }
                  }}
                  maxLength={200}
                />
                <p className="text-[10px] text-slate-400 mt-1">{(textos[grupo.tipo_id] || '').length}/200</p>
              </div>
            ) : (
              /* Selector / Foto */
              <div className="flex flex-wrap gap-2">
                {grupo.items.map((v: any) => {
                  const esSel    = sel?.id === v.id;
                  const sinStock = v.stock === 0;
                  const tieneFoto = !!v.imagen_url;

                  return (
                    <button key={v.id}
                      onClick={() => !sinStock && setSeleccion(s => ({ ...s, [grupo.tipo_id]: esSel ? undefined : v }))}
                      disabled={sinStock}
                      className={`relative flex ${tieneFoto ? 'flex-col items-center gap-1.5 p-2 min-w-[70px]' : 'items-center gap-2 px-4 py-2'} rounded-xl border-2 text-sm font-bold transition-all duration-200
                        ${sinStock
                          ? 'opacity-40 cursor-not-allowed line-through border-slate-200 text-slate-400'
                          : esSel
                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-105'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:scale-105'}`}
                    >
                      {/* Foto de tela/diseño */}
                      {tieneFoto && (
                        <img src={v.imagen_url} alt={v.valor}
                          className={`w-14 h-14 rounded-lg object-cover ${esSel ? 'ring-2 ring-white' : ''}`} />
                      )}
                      {/* Etiqueta letra */}
                      {v.etiqueta && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${esSel ? 'bg-white/20' : 'bg-slate-100 text-slate-700'}`}>
                          {v.etiqueta}
                        </span>
                      )}
                      <span className={tieneFoto ? 'text-center text-xs leading-tight' : ''}>{v.valor}</span>
                      {v.precio_extra > 0 && (
                        <span className={`text-[10px] ${esSel ? 'opacity-80' : 'text-green-600'} font-bold`}>+{v.precio_extra}€</span>
                      )}
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

      {/* Precio final con extras */}
      {precioExtra > 0 && (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 line-through">{precio.toFixed(2)}€</span>
          <span className="text-xl font-black text-slate-900">{precioFinal.toFixed(2)}€</span>
          <span className="text-xs text-green-600 font-bold">+{precioExtra.toFixed(2)}€</span>
        </div>
      )}
    </div>
  );
}
