'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// ── Tipos de variante disponibles (máx 5 por producto) ──────────────────────
export const TIPOS_VARIANTE = [
  { value: 'talla',           label: 'Talla',           placeholder: 'XS, S, M, L, XL…', tieneColor: false, tieneFoto: false },
  { value: 'color',           label: 'Color',           placeholder: 'Rojo, Azul, Verde…', tieneColor: true,  tieneFoto: false },
  { value: 'diseno_tela',     label: 'Diseño de tela',  placeholder: 'Descripción del diseño', tieneColor: false, tieneFoto: true  },
  { value: 'accesorio',       label: 'Accesorio',       placeholder: 'Bolso, Cinturón, Bufanda…', tieneColor: false, tieneFoto: false },
  { value: 'personalizacion', label: 'Personalización', placeholder: 'Nombre bordado, Texto…',     tieneColor: false, tieneFoto: false },
];

const TALLAS_RAPIDAS = ['XS','S','M','L','XL','XXL','36','37','38','39','40','41','42','43','44'];
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const inS: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', marginTop: 2 };

export default function VariantesEditor({ productoId, variantes, onCambio, defaultOpen = false }: {
  productoId: string;
  variantes: any[];
  onCambio: () => void;
  defaultOpen?: boolean;
}) {
  const [abierto, setAbierto] = useState(defaultOpen);
  const [tipo, setTipo] = useState('talla');
  const [valor, setValor] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [precioExtra, setPrecioExtra] = useState('0');
  const [stock, setStock] = useState('0');
  const [imagenUrl, setImagenUrl] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const tiposUsados = [...new Set(variantes.map(v => v.tipo))];
  const puedeAñadirTipo = (t: string) => tiposUsados.includes(t) || tiposUsados.length < 5;
  const tipoInfo = TIPOS_VARIANTE.find(t => t.value === tipo);

  const subirFotoTela = async (file: File): Promise<string | null> => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return null;
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const ext = file.name.split('.').pop();
    const nombre = `telas/${productoId}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from('imagenes').upload(nombre, file, { upsert: true });
    if (error) { alert('Error subiendo foto: ' + error.message); return null; }
    return sb.storage.from('imagenes').getPublicUrl(nombre).data.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(true);
    const url = await subirFotoTela(file);
    setSubiendoFoto(false);
    if (url) setImagenUrl(url);
  };

  const añadir = async () => {
    if (!valor.trim()) return alert('Escribe un valor');
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    if (!tiposUsados.includes(tipo) && tiposUsados.length >= 5)
      return alert('Máximo 5 tipos de variante por producto.');
    setGuardando(true);
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const payload: any = { producto_id: productoId, tipo, valor: valor.trim(), precio_extra: parseFloat(precioExtra) || 0, stock: parseInt(stock) || 0 };
    if (tipo === 'diseno_tela') {
      if (imagenUrl) payload.imagen_url = imagenUrl;
      if (etiqueta)  payload.etiqueta  = etiqueta.toUpperCase();
    }
    const { error } = await sb.from('variantes').insert([payload]);
    setGuardando(false);
    if (error) return alert(error.message);
    setValor(''); setPrecioExtra('0'); setStock('0'); setImagenUrl(''); setEtiqueta('');
    onCambio();
  };

  const añadirTallaRapida = async (v: string) => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    if (variantes.some(va => va.tipo === 'talla' && va.valor === v)) return;
    if (!tiposUsados.includes('talla') && tiposUsados.length >= 5) return alert('Máximo 5 tipos de variante.');
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    await sb.from('variantes').insert([{ producto_id: productoId, tipo: 'talla', valor: v, precio_extra: 0, stock: 0 }]);
    onCambio();
  };

  const eliminar = async (id: string) => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    await createBrowserClient(SUPABASE_URL, SUPABASE_ANON).from('variantes').delete().eq('id', id);
    onCambio();
  };

  const actualizarStock = async (id: string, nuevoStock: number) => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    await createBrowserClient(SUPABASE_URL, SUPABASE_ANON).from('variantes').update({ stock: nuevoStock }).eq('id', id);
    onCambio();
  };

  const variantesPorTipo = tiposUsados.map(t => ({
    tipo: t,
    label: TIPOS_VARIANTE.find(x => x.value === t)?.label || t,
    items: variantes.filter(v => v.tipo === t),
    tieneColor: TIPOS_VARIANTE.find(x => x.value === t)?.tieneColor || false,
    tieneFoto:  TIPOS_VARIANTE.find(x => x.value === t)?.tieneFoto  || false,
  }));

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setAbierto(!abierto)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {abierto ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        Variantes ({variantes.length})
        {tiposUsados.length > 0 && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>· {tiposUsados.length}/5 tipos</span>}
      </button>

      {abierto && (
        <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, backgroundColor: '#f9fafb' }}>

          {variantesPorTipo.map(grupo => (
            <div key={grupo.tipo} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{grupo.label}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {grupo.items.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', fontSize: 12 }}>
                    {grupo.tieneColor && <div style={{ width: 12, height: 12, borderRadius: '50%', background: v.valor.toLowerCase(), border: '1px solid #e5e7eb', flexShrink: 0 }} />}
                    {grupo.tieneFoto && v.imagen_url && <img src={v.imagen_url} style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                    {v.etiqueta && <span style={{ background: '#1e293b', color: 'white', borderRadius: 4, fontSize: 10, fontWeight: 900, padding: '1px 5px' }}>{v.etiqueta}</span>}
                    <span style={{ fontWeight: 600 }}>{v.valor}</span>
                    {v.precio_extra > 0 && <span style={{ color: '#10b981', fontSize: 11 }}>+{v.precio_extra}€</span>}
                    <span style={{ color: '#9ca3af', fontSize: 11 }}>·</span>
                    <input type="number" min="0" value={v.stock}
                      onChange={e => actualizarStock(v.id, parseInt(e.target.value) || 0)}
                      style={{ width: 36, border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 4px', fontSize: 11, textAlign: 'center' }} />
                    <span style={{ color: '#9ca3af', fontSize: 10 }}>uds</span>
                    <button onClick={() => eliminar(v.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><Trash2 size={11}/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ borderTop: variantesPorTipo.length > 0 ? '1px solid #e5e7eb' : 'none', paddingTop: variantesPorTipo.length > 0 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: 0 }}>AÑADIR VARIANTE</p>
              <span style={{ fontSize: 10, color: tiposUsados.length >= 5 ? '#ef4444' : '#9ca3af' }}>{5 - tiposUsados.length} tipos libres</span>
            </div>

            <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
              {TIPOS_VARIANTE.map(t => {
                const ok = puedeAñadirTipo(t.value);
                return (
                  <button key={t.value} onClick={() => ok && setTipo(t.value)} disabled={!ok}
                    style={{ padding: '4px 10px', borderRadius: 16, border: '1px solid #e5e7eb', fontSize: 12, cursor: ok ? 'pointer' : 'not-allowed', background: tipo === t.value ? 'black' : ok ? 'white' : '#f3f4f6', color: tipo === t.value ? 'white' : ok ? '#374151' : '#9ca3af', fontWeight: tipo === t.value ? 700 : 400, opacity: ok ? 1 : 0.5 }}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tipo === 'talla' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {TALLAS_RAPIDAS.map(t => {
                  const ya = variantes.some(v => v.tipo === 'talla' && v.valor === t);
                  return <button key={t} onClick={() => añadirTallaRapida(t)} disabled={ya}
                    style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, cursor: ya ? 'default' : 'pointer', background: ya ? '#f3f4f6' : 'white', color: ya ? '#9ca3af' : '#374151', textDecoration: ya ? 'line-through' : 'none' }}>{t}</button>;
                })}
              </div>
            )}

            {tipo === 'diseno_tela' && (
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, margin: '0 0 8px' }}>Sube la foto de la tela y asígnale una letra (A, B, C…)</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#f9fafb', fontSize: 12 }}>
                    <Upload size={13} />
                    {subiendoFoto ? 'Subiendo…' : imagenUrl ? '✓ Foto lista' : 'Subir foto'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} disabled={subiendoFoto} />
                  </label>
                  {imagenUrl && <img src={imagenUrl} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />}
                  <div>
                    <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>ETIQUETA</label>
                    <select value={etiqueta} onChange={e => setEtiqueta(e.target.value)} style={{ ...inS, width: 70, marginTop: 2 }}>
                      <option value="">—</option>
                      {LETRAS.filter(l => !variantes.some(v => v.tipo === 'diseno_tela' && v.etiqueta === l)).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: 120 }}>
                <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>{tipo === 'diseno_tela' ? 'DESCRIPCIÓN' : 'VALOR'}</label>
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
              <button onClick={añadir} disabled={guardando || subiendoFoto}
                style={{ padding: '9px 14px', borderRadius: 10, background: (guardando || subiendoFoto) ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', cursor: (guardando || subiendoFoto) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', height: 40 }}>
                <Plus size={13}/> {guardando ? '…' : 'Añadir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
