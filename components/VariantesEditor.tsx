'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const TIPOS = [
  { value: 'talla', label: 'Talla', placeholder: 'XS, S, M, L, XL...' },
  { value: 'color', label: 'Color', placeholder: 'Rojo, Azul, Verde...' },
  { value: 'personalizacion', label: 'Personalización', placeholder: 'Nombre bordado, Texto...' },
];

const TALLAS_RAPIDAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42'];

export default function VariantesEditor({ productoId, variantes, onCambio }: {
  productoId: string;
  variantes: any[];
  onCambio: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<string>('talla');
  const [valor, setValor] = useState('');
  const [precioExtra, setPrecioExtra] = useState('0');
  const [stock, setStock] = useState('0');
  const [guardando, setGuardando] = useState(false);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const añadir = async () => {
    if (!valor.trim()) return alert('Escribe un valor');
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    setGuardando(true);
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const { error } = await sb.from('variantes').insert([{
      producto_id: productoId,
      tipo,
      valor: valor.trim(),
      precio_extra: parseFloat(precioExtra) || 0,
      stock: parseInt(stock) || 0,
    }]);
    setGuardando(false);
    if (error) return alert(error.message);
    setValor('');
    setPrecioExtra('0');
    setStock('0');
    onCambio();
  };

  const añadirRapida = async (v: string) => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    // Evitar duplicados
    if (variantes.some(va => va.tipo === 'talla' && va.valor === v)) return;
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    await sb.from('variantes').insert([{ producto_id: productoId, tipo: 'talla', valor: v, precio_extra: 0, stock: 0 }]);
    onCambio();
  };

  const eliminar = async (id: string) => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    await sb.from('variantes').delete().eq('id', id);
    onCambio();
  };

  const actualizarStock = async (id: string, stock: number) => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    await sb.from('variantes').update({ stock }).eq('id', id);
    onCambio();
  };

  const tipoInfo = TIPOS.find(t => t.value === tipo);
  const variantesPorTipo = TIPOS.map(t => ({
    ...t,
    items: variantes.filter(v => v.tipo === t.value)
  })).filter(t => t.items.length > 0);

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setAbierto(!abierto)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {abierto ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        Variantes ({variantes.length})
      </button>

      {abierto && (
        <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, backgroundColor: '#f9fafb' }}>

          {/* Variantes existentes */}
          {variantesPorTipo.map(grupo => (
            <div key={grupo.value} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{grupo.label}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {grupo.items.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', fontSize: 12 }}>
                    {grupo.value === 'color' && (
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: v.valor.toLowerCase(), border: '1px solid #e5e7eb', flexShrink: 0 }} />
                    )}
                    <span style={{ fontWeight: 600 }}>{v.valor}</span>
                    {v.precio_extra > 0 && <span style={{ color: '#10b981', fontSize: 11 }}>+{v.precio_extra}€</span>}
                    <span style={{ color: '#9ca3af', fontSize: 11 }}>·</span>
                    <input
                      type="number" min="0"
                      value={v.stock}
                      onChange={e => actualizarStock(v.id, parseInt(e.target.value) || 0)}
                      style={{ width: 36, border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 4px', fontSize: 11, textAlign: 'center' }}
                    />
                    <span style={{ color: '#9ca3af', fontSize: 10 }}>uds</span>
                    <button onClick={() => eliminar(v.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Formulario nueva variante */}
          <div style={{ borderTop: variantesPorTipo.length > 0 ? '1px solid #e5e7eb' : 'none', paddingTop: variantesPorTipo.length > 0 ? 12 : 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>AÑADIR VARIANTE</p>

            {/* Selector tipo */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {TIPOS.map(t => (
                <button key={t.value} onClick={() => setTipo(t.value)}
                  style={{ padding: '4px 10px', borderRadius: 16, border: '1px solid #e5e7eb', fontSize: 12, cursor: 'pointer', background: tipo === t.value ? 'black' : 'white', color: tipo === t.value ? 'white' : '#374151', fontWeight: tipo === t.value ? 700 : 400 }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Atajos tallas */}
            {tipo === 'talla' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {TALLAS_RAPIDAS.map(t => {
                  const yaExiste = variantes.some(v => v.tipo === 'talla' && v.valor === t);
                  return (
                    <button key={t} onClick={() => añadirRapida(t)} disabled={yaExiste}
                      style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, cursor: yaExiste ? 'default' : 'pointer', background: yaExiste ? '#f3f4f6' : 'white', color: yaExiste ? '#9ca3af' : '#374151', textDecoration: yaExiste ? 'line-through' : 'none' }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: 120 }}>
                <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>VALOR</label>
                <input style={inS} placeholder={tipoInfo?.placeholder || 'Valor'} value={valor} onChange={e => setValor(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: 80 }}>
                <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>PRECIO EXTRA (€)</label>
                <input style={inS} type="number" step="0.01" min="0" placeholder="0" value={precioExtra} onChange={e => setPrecioExtra(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: 80 }}>
                <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>STOCK</label>
                <input style={inS} type="number" min="0" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
              </div>
              <button onClick={añadir} disabled={guardando}
                style={{ padding: '9px 14px', borderRadius: 10, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', height: 40 }}>
                <Plus size={13}/> {guardando ? '...' : 'Añadir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inS: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', marginTop: 2 };
