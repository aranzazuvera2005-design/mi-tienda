'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Upload, ExternalLink } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
interface TipoVariante {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_input: 'selector' | 'texto_libre' | 'foto';
  es_requerido: boolean;
  activo: boolean;
}

interface ValorVariante {
  id: string;
  tipo_id: string;
  valor: string;
  etiqueta: string;
  imagen_url: string;
  precio_extra: number;
}

interface VarianteProducto {
  id: string;
  producto_id: string;
  tipo: string;           // tipo_id del tipo custom
  valor: string;          // valor_id o texto libre
  precio_extra: number;
  stock: number;
  etiqueta?: string;
  imagen_url?: string;
  valor_id?: string;
}

const inS: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', marginTop: 2,
};

/* ─── Componente ─────────────────────────────────────────────────────────── */
export default function VariantesEditor({ productoId, variantes, onCambio, defaultOpen = false }: {
  productoId: string;
  variantes: VarianteProducto[];
  onCambio: () => void;
  defaultOpen?: boolean;
}) {
  const [abierto, setAbierto]           = useState(defaultOpen);
  const [tiposDisp, setTiposDisp]       = useState<TipoVariante[]>([]);
  const [valoresDisp, setValoresDisp]   = useState<Record<string, ValorVariante[]>>({});
  const [tiposAsign, setTiposAsign]     = useState<string[]>([]); // tipo_ids ya asignados al producto
  const [cargando, setCargando]         = useState(false);

  // Formulario añadir variante
  const [tipoSel, setTipoSel]   = useState('');
  const [valorSel, setValorSel] = useState('');
  const [stock, setStock]       = useState('0');
  const [guardando, setGuardando] = useState(false);

  const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const sb = () => createBrowserClient(SUPABASE_URL!, SUPABASE_ANON!);

  /* Cargar tipos y valores custom cuando se abre */
  useEffect(() => {
    if (!abierto || !SUPABASE_URL || !SUPABASE_ANON) return;
    cargarTipos();
  }, [abierto]);

  /* Tipos ya asignados = los que tienen al menos una variante en este producto */
  useEffect(() => {
    const usados = [...new Set(variantes.map(v => v.tipo))];
    setTiposAsign(usados);
    if (!tipoSel && usados.length > 0) setTipoSel(usados[0]);
  }, [variantes]);

  const cargarTipos = async () => {
    setCargando(true);
    try {
      const client = sb();
      const { data: ts } = await client.from('tipos_variante').select('*').eq('activo', true).order('orden');
      const { data: vs } = await client.from('valores_variante').select('*').order('orden');
      const tipos = ts || [];
      setTiposDisp(tipos);
      const agr: Record<string, ValorVariante[]> = {};
      (vs || []).forEach(v => { if (!agr[v.tipo_id]) agr[v.tipo_id] = []; agr[v.tipo_id].push(v); });
      setValoresDisp(agr);
      if (!tipoSel && tipos.length > 0) setTipoSel(tipos[0].id);
    } finally { setCargando(false); }
  };

  /* Añadir variante al producto */
  const añadir = async () => {
    const tipo = tiposDisp.find(t => t.id === tipoSel);
    if (!tipo) return alert('Selecciona un tipo');
    if (!valorSel.trim()) return alert('Introduce o elige un valor');
    if (!SUPABASE_URL || !SUPABASE_ANON) return;

    // Máx 5 tipos distintos
    const tiposUsados = [...new Set(variantes.map(v => v.tipo))];
    if (!tiposUsados.includes(tipoSel) && tiposUsados.length >= 5) {
      return alert('Máximo 5 tipos de variante por producto.');
    }

    setGuardando(true);
    try {
      const client = sb();

      // Si selector/foto: buscar si el valor corresponde a un valor_id
      let valorFinal = valorSel;
      let etiquetaFinal: string | undefined;
      let imgFinal: string | undefined;
      let precioExtra = 0;
      let valorId: string | undefined;

      if (tipo.tipo_input !== 'texto_libre') {
        const valObj = (valoresDisp[tipoSel] || []).find(v => v.id === valorSel);
        if (valObj) {
          valorFinal    = valObj.valor;
          etiquetaFinal = valObj.etiqueta;
          imgFinal      = valObj.imagen_url;
          precioExtra   = valObj.precio_extra || 0;
          valorId       = valObj.id;
        }
      }

      const payload: any = {
        producto_id:  productoId,
        tipo:         tipoSel,
        valor:        valorFinal.trim(),
        precio_extra: precioExtra,
        stock:        parseInt(stock) || 0,
      };
      if (etiquetaFinal) payload.etiqueta  = etiquetaFinal;
      if (imgFinal)      payload.imagen_url = imgFinal;
      if (valorId)       payload.valor_id   = valorId;

      const { error } = await client.from('variantes').insert([payload]);
      if (error) return alert(error.message);
      setValorSel('');
      setStock('0');
      onCambio();
    } finally { setGuardando(false); }
  };

  const eliminar = async (id: string) => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    await sb().from('variantes').delete().eq('id', id);
    onCambio();
  };

  const actualizarStock = async (id: string, nuevoStock: number) => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    await sb().from('variantes').update({ stock: nuevoStock }).eq('id', id);
    onCambio();
  };

  /* Agrupar variantes del producto por tipo */
  const varPorTipo = tiposAsign.map(tid => {
    const tipoInfo = tiposDisp.find(t => t.id === tid);
    return {
      tipo_id: tid,
      label:   tipoInfo?.nombre || tid,
      items:   variantes.filter(v => v.tipo === tid),
    };
  });

  const tipoSelInfo = tiposDisp.find(t => t.id === tipoSel);
  const valoresDelTipo = valoresDisp[tipoSel] || [];

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setAbierto(!abierto)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {abierto ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        Variantes ({variantes.length})
        {tiposAsign.length > 0 && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>· {tiposAsign.length}/5 tipos</span>}
      </button>

      {abierto && (
        <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, backgroundColor: '#f9fafb' }}>

          {/* Sin tipos definidos */}
          {!cargando && tiposDisp.length === 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>No hay tipos de variante definidos.</span>
              <Link href="/admin/variantes" target="_blank" style={{ color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                Crear tipos <ExternalLink size={12}/>
              </Link>
            </div>
          )}

          {/* Variantes existentes agrupadas */}
          {varPorTipo.map(grupo => (
            <div key={grupo.tipo_id} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{grupo.label}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {grupo.items.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', fontSize: 12 }}>
                    {v.imagen_url && <img src={v.imagen_url} style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                    {v.etiqueta   && <span style={{ background: '#1e293b', color: 'white', borderRadius: 4, fontSize: 10, fontWeight: 900, padding: '1px 5px' }}>{v.etiqueta}</span>}
                    <span style={{ fontWeight: 600 }}>{v.valor}</span>
                    {v.precio_extra > 0 && <span style={{ color: '#10b981', fontSize: 11 }}>+{v.precio_extra}€</span>}
                    <span style={{ color: '#d1d5db' }}>·</span>
                    <input type="number" min="0" value={v.stock}
                      onChange={e => actualizarStock(v.id, parseInt(e.target.value) || 0)}
                      style={{ width: 36, border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 4px', fontSize: 11, textAlign: 'center' }} />
                    <span style={{ color: '#9ca3af', fontSize: 10 }}>uds</span>
                    <button onClick={() => eliminar(v.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Formulario añadir */}
          {!cargando && tiposDisp.length > 0 && (
            <div style={{ borderTop: varPorTipo.length > 0 ? '1px solid #e5e7eb' : 'none', paddingTop: varPorTipo.length > 0 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: 0 }}>AÑADIR VARIANTE</p>
                <span style={{ fontSize: 10, color: tiposAsign.length >= 5 ? '#ef4444' : '#9ca3af' }}>{5 - tiposAsign.length} tipos libres</span>
              </div>

              {/* Selector de tipo */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                {tiposDisp.map(t => {
                  const yaUsado   = tiposAsign.includes(t.id);
                  const disponible = yaUsado || tiposAsign.length < 5;
                  return (
                    <button key={t.id} onClick={() => disponible && setTipoSel(t.id)} disabled={!disponible}
                      style={{ padding: '4px 12px', borderRadius: 16, border: '1px solid #e5e7eb', fontSize: 12, cursor: disponible ? 'pointer' : 'not-allowed', background: tipoSel === t.id ? '#1e293b' : disponible ? 'white' : '#f3f4f6', color: tipoSel === t.id ? 'white' : disponible ? '#374151' : '#9ca3af', fontWeight: tipoSel === t.id ? 700 : 400, opacity: disponible ? 1 : 0.5 }}>
                      {t.nombre}
                    </button>
                  );
                })}
              </div>

              {/* Selector de valor */}
              {tipoSelInfo && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 2, minWidth: 160 }}>
                    <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>
                      {tipoSelInfo.tipo_input === 'texto_libre' ? 'PLACEHOLDER' : 'VALOR'}
                    </label>
                    {tipoSelInfo.tipo_input === 'texto_libre' ? (
                      /* Texto libre: input directo */
                      <input style={inS}
                        placeholder={tipoSelInfo.descripcion || 'Texto de ayuda para el cliente…'}
                        value={valorSel}
                        onChange={e => setValorSel(e.target.value)} />
                    ) : valoresDelTipo.length > 0 ? (
                      /* Selector con valores definidos */
                      <select style={inS} value={valorSel} onChange={e => setValorSel(e.target.value)}>
                        <option value="">— Elige un valor —</option>
                        {valoresDelTipo.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.etiqueta ? `[${v.etiqueta}] ` : ''}{v.valor}{v.precio_extra > 0 ? ` (+${v.precio_extra}€)` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ ...inS, color: '#9ca3af', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                        <span>Sin valores definidos</span>
                        <Link href="/admin/variantes" target="_blank" style={{ color: '#2563eb', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                          Añadir <ExternalLink size={10}/>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 80 }}>
                    <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>STOCK</label>
                    <input style={inS} type="number" min="0" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
                  </div>

                  <button onClick={añadir} disabled={guardando || (!valorSel.trim())}
                    style={{ padding: '9px 14px', borderRadius: 10, background: (guardando || !valorSel.trim()) ? '#9ca3af' : '#1e293b', color: 'white', border: 'none', cursor: (guardando || !valorSel.trim()) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, height: 40, whiteSpace: 'nowrap' }}>
                    <Plus size={13}/> {guardando ? '…' : 'Añadir'}
                  </button>
                </div>
              )}
            </div>
          )}

          {cargando && <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 12 }}>Cargando tipos…</div>}
        </div>
      )}
    </div>
  );
}
