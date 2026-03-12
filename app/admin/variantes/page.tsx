'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft, Plus, Trash2, Pencil, Check, X, Upload,
  GripVertical, ChevronDown, ChevronUp, Tag, Type, Image as ImageIcon, List
} from 'lucide-react';
import Link from 'next/link';

/* ─── Tipos ─────────────────────────────────────────────────────────────── */
type TipoInput = 'selector' | 'texto_libre' | 'foto';

interface TipoVariante {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_input: TipoInput;
  es_requerido: boolean;
  orden: number;
  activo: boolean;
}

interface ValorVariante {
  id: string;
  tipo_id: string;
  valor: string;
  etiqueta: string;
  imagen_url: string;
  precio_extra: number;
  activo: boolean;
  orden: number;
}

const inS: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1px solid #e5e7eb', fontSize: 14, outline: 'none',
};

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const TIPO_INPUT_INFO: Record<TipoInput, { label: string; icon: any; desc: string }> = {
  selector:     { label: 'Selector',      icon: List,       desc: 'El cliente elige entre opciones predefinidas (tallas, colores…)' },
  texto_libre:  { label: 'Texto libre',   icon: Type,       desc: 'El cliente escribe su propio texto (personalización, nombre…)' },
  foto:         { label: 'Con foto',      icon: ImageIcon,  desc: 'Valores con foto asociada, identificados por letra (telas, diseños…)' },
};

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function GestionVariantes() {
  const [tipos, setTipos]     = useState<TipoVariante[]>([]);
  const [valores, setValores] = useState<Record<string, ValorVariante[]>>({});
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});
  const [cargando, setCargando] = useState(true);

  // Nuevo tipo
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: '', descripcion: '', tipo_input: 'selector' as TipoInput, es_requerido: false });
  const [guardandoTipo, setGuardandoTipo] = useState(false);

  // Editar tipo
  const [editandoTipo, setEditandoTipo] = useState<string | null>(null);
  const [datosEditTipo, setDatosEditTipo] = useState<Partial<TipoVariante>>({});

  // Nuevo valor por tipo
  const [nuevoValor, setNuevoValor] = useState<Record<string, { valor: string; etiqueta: string; precio_extra: string; imagen_url: string }>>({});
  const [subiendoFoto, setSubiendoFoto] = useState<Record<string, boolean>>({});

  const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const sb = () => {
    if (!SUPABASE_URL || !SUPABASE_ANON) throw new Error('Supabase no configurado');
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
  };

  /* ── Carga ─────────────────────────────────────────────────────────────── */
  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const client = sb();
      const { data: ts } = await client.from('tipos_variante').select('*').order('orden').order('created_at');
      const { data: vs } = await client.from('valores_variante').select('*').order('orden').order('created_at');

      setTipos(ts || []);
      const agrupados: Record<string, ValorVariante[]> = {};
      (vs || []).forEach(v => {
        if (!agrupados[v.tipo_id]) agrupados[v.tipo_id] = [];
        agrupados[v.tipo_id].push(v);
      });
      setValores(agrupados);
    } catch (e) {
      console.error(e);
    }
    setCargando(false);
  };

  /* ── CRUD Tipos ────────────────────────────────────────────────────────── */
  const crearTipo = async () => {
    if (!nuevoTipo.nombre.trim()) return alert('El nombre es obligatorio');
    setGuardandoTipo(true);
    try {
      const { error } = await sb().from('tipos_variante').insert([{
        nombre: nuevoTipo.nombre.trim(),
        descripcion: nuevoTipo.descripcion.trim() || null,
        tipo_input: nuevoTipo.tipo_input,
        es_requerido: nuevoTipo.es_requerido,
        orden: tipos.length,
      }]);
      if (error) return alert(error.message);
      setNuevoTipo({ nombre: '', descripcion: '', tipo_input: 'selector', es_requerido: false });
      await cargar();
    } finally { setGuardandoTipo(false); }
  };

  const guardarTipo = async (id: string) => {
    try {
      const { error } = await sb().from('tipos_variante').update(datosEditTipo).eq('id', id);
      if (error) return alert(error.message);
      setEditandoTipo(null);
      await cargar();
    } catch (e: any) { alert(String(e)); }
  };

  const eliminarTipo = async (id: string) => {
    if (!confirm('¿Eliminar este tipo de variante y todos sus valores? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await sb().from('tipos_variante').delete().eq('id', id);
      if (error) return alert(error.message);
      await cargar();
    } catch (e: any) { alert(String(e)); }
  };

  const toggleActivo = async (tipo: TipoVariante) => {
    await sb().from('tipos_variante').update({ activo: !tipo.activo }).eq('id', tipo.id);
    await cargar();
  };

  /* ── CRUD Valores ──────────────────────────────────────────────────────── */
  const initNuevoValor = (tipoId: string) => {
    if (!nuevoValor[tipoId]) {
      setNuevoValor(prev => ({ ...prev, [tipoId]: { valor: '', etiqueta: '', precio_extra: '0', imagen_url: '' } }));
    }
  };

  const crearValor = async (tipo: TipoVariante) => {
    const nv = nuevoValor[tipo.id];
    if (!nv?.valor.trim()) return alert('El valor es obligatorio');
    try {
      const payload: any = {
        tipo_id: tipo.id,
        valor: nv.valor.trim(),
        precio_extra: parseFloat(nv.precio_extra) || 0,
        orden: (valores[tipo.id] || []).length,
      };
      if (tipo.tipo_input === 'foto') {
        if (nv.imagen_url) payload.imagen_url = nv.imagen_url;
        if (nv.etiqueta)   payload.etiqueta   = nv.etiqueta.toUpperCase();
      }
      const { error } = await sb().from('valores_variante').insert([payload]);
      if (error) return alert(error.message);
      setNuevoValor(prev => ({ ...prev, [tipo.id]: { valor: '', etiqueta: '', precio_extra: '0', imagen_url: '' } }));
      await cargar();
    } catch (e: any) { alert(String(e)); }
  };

  const eliminarValor = async (id: string) => {
    if (!confirm('¿Eliminar este valor?')) return;
    await sb().from('valores_variante').delete().eq('id', id);
    await cargar();
  };

  const actualizarValor = async (id: string, campo: string, valor: any) => {
    await sb().from('valores_variante').update({ [campo]: valor }).eq('id', id);
    await cargar();
  };

  /* ── Subir foto de valor ──────────────────────────────────────────────── */
  const subirFoto = async (tipoId: string, file: File) => {
    setSubiendoFoto(prev => ({ ...prev, [tipoId]: true }));
    try {
      const client = sb();
      const ext    = file.name.split('.').pop();
      const nombre = `variantes/${tipoId}-${Date.now()}.${ext}`;
      const { error } = await client.storage.from('imagenes').upload(nombre, file, { upsert: true });
      if (error) { alert('Error subiendo foto: ' + error.message); return; }
      const { data } = client.storage.from('imagenes').getPublicUrl(nombre);
      setNuevoValor(prev => ({ ...prev, [tipoId]: { ...prev[tipoId], imagen_url: data.publicUrl } }));
    } finally {
      setSubiendoFoto(prev => ({ ...prev, [tipoId]: false }));
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', textDecoration: 'none', marginBottom: 20, fontWeight: 'bold' }}>
          <ArrowLeft size={18} /> Volver al Menú Admin
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Tipos de Variante</h1>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>
            Define aquí los tipos de variante que tendrá tu tienda (Talla, Color, Tela, Acabado…) y sus valores posibles.
            Luego, en el inventario, asigna qué tipos aplican a cada producto.
          </p>
        </div>

        {/* ── Formulario nuevo tipo ─────────────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', padding: 24, marginBottom: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> Crear nuevo tipo de variante
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>NOMBRE DEL TIPO</label>
              <input style={inS} placeholder="Ej: Talla, Color, Tela, Acabado…"
                value={nuevoTipo.nombre} onChange={e => setNuevoTipo(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>DESCRIPCIÓN <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional, se muestra al cliente)</span></label>
              <input style={inS} placeholder="Ej: Elige tu talla según la tabla de la imagen"
                value={nuevoTipo.descripcion} onChange={e => setNuevoTipo(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
          </div>

          {/* Tipo de input */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>TIPO DE SELECCIÓN</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              {(Object.entries(TIPO_INPUT_INFO) as [TipoInput, any][]).map(([key, info]) => (
                <button key={key} onClick={() => setNuevoTipo(p => ({ ...p, tipo_input: key }))}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 16px', borderRadius: 12, border: `2px solid ${nuevoTipo.tipo_input === key ? '#1e293b' : '#e5e7eb'}`, background: nuevoTipo.tipo_input === key ? '#1e293b' : 'white', color: nuevoTipo.tipo_input === key ? 'white' : '#374151', cursor: 'pointer', textAlign: 'left', minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <info.icon size={15} />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{info.label}</span>
                  </div>
                  <span style={{ fontSize: 11, opacity: 0.75 }}>{info.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
              <input type="checkbox" checked={nuevoTipo.es_requerido} onChange={e => setNuevoTipo(p => ({ ...p, es_requerido: e.target.checked }))} />
              Obligatorio (el cliente debe seleccionarlo antes de añadir al carrito)
            </label>
            <button onClick={crearTipo} disabled={guardandoTipo}
              style={{ marginLeft: 'auto', padding: '10px 22px', borderRadius: 12, background: guardandoTipo ? '#9ca3af' : '#1e293b', color: 'white', border: 'none', cursor: guardandoTipo ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> {guardandoTipo ? 'Guardando…' : 'Crear tipo'}
            </button>
          </div>
        </div>

        {/* ── Lista de tipos ────────────────────────────────────────────── */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando…</div>
        ) : tipos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 20, border: '1px dashed #e5e7eb', color: '#9ca3af' }}>
            No hay tipos de variante creados. Crea el primero arriba.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tipos.map(tipo => {
              const tipoVals = valores[tipo.id] || [];
              const expanded = abierto[tipo.id];
              const info     = TIPO_INPUT_INFO[tipo.tipo_input as TipoInput] || TIPO_INPUT_INFO.selector;
              const nv       = nuevoValor[tipo.id] || { valor: '', etiqueta: '', precio_extra: '0', imagen_url: '' };

              return (
                <div key={tipo.id} style={{ background: 'white', borderRadius: 20, border: `1px solid ${tipo.activo ? '#e5e7eb' : '#fee2e2'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                  {/* Cabecera del tipo */}
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {editandoTipo === tipo.id ? (
                      /* Modo edición */
                      <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input style={{ ...inS, flex: 2, minWidth: 160 }} placeholder="Nombre"
                          value={datosEditTipo.nombre ?? tipo.nombre}
                          onChange={e => setDatosEditTipo(p => ({ ...p, nombre: e.target.value }))} />
                        <input style={{ ...inS, flex: 3, minWidth: 200 }} placeholder="Descripción"
                          value={datosEditTipo.descripcion ?? tipo.descripcion ?? ''}
                          onChange={e => setDatosEditTipo(p => ({ ...p, descripcion: e.target.value }))} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                          <input type="checkbox" checked={datosEditTipo.es_requerido ?? tipo.es_requerido}
                            onChange={e => setDatosEditTipo(p => ({ ...p, es_requerido: e.target.checked }))} />
                          Obligatorio
                        </label>
                        <button onClick={() => guardarTipo(tipo.id)} style={btnVerde}><Check size={16} /></button>
                        <button onClick={() => setEditandoTipo(null)} style={btnGris}><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 17, fontWeight: 800 }}>{tipo.nombre}</span>
                            <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', borderRadius: 6, padding: '2px 8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <info.icon size={11} /> {info.label}
                            </span>
                            {tipo.es_requerido && <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>Obligatorio</span>}
                            {!tipo.activo && <span style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>Inactivo</span>}
                          </div>
                          {tipo.descripcion && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{tipo.descripcion}</p>}
                          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{tipoVals.length} valor{tipoVals.length !== 1 ? 'es' : ''}</p>
                        </div>

                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button onClick={() => toggleActivo(tipo)}
                            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: tipo.activo ? '#f0fdf4' : '#fff7ed', color: tipo.activo ? '#166534' : '#9a3412', cursor: 'pointer', fontWeight: 700 }}>
                            {tipo.activo ? 'Activo' : 'Inactivo'}
                          </button>
                          <button onClick={() => { setEditandoTipo(tipo.id); setDatosEditTipo({}); }} style={btnAzul}><Pencil size={15} /></button>
                          <button onClick={() => eliminarTipo(tipo.id)} style={btnRojo}><Trash2 size={15} /></button>
                          <button onClick={() => { setAbierto(p => ({ ...p, [tipo.id]: !expanded })); initNuevoValor(tipo.id); }}
                            style={{ ...btnGris, display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 10, paddingRight: 10, fontSize: 12, fontWeight: 700 }}>
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            {expanded ? 'Cerrar' : 'Valores'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Panel de valores */}
                  {expanded && (
                    <div style={{ borderTop: '1px solid #f3f4f6', background: '#fafafa', padding: '16px 20px' }}>

                      {/* Valores existentes */}
                      {tipoVals.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 14 }}>Sin valores todavía. Añade el primero abajo.</p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                          {tipoVals.map(v => (
                            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '6px 10px', fontSize: 13 }}>
                              {/* Preview foto */}
                              {v.imagen_url && <img src={v.imagen_url} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                              {/* Etiqueta letra */}
                              {v.etiqueta && <span style={{ background: '#1e293b', color: 'white', borderRadius: 4, fontSize: 10, fontWeight: 900, padding: '1px 6px' }}>{v.etiqueta}</span>}
                              <span style={{ fontWeight: 700 }}>{v.valor}</span>
                              {/* Precio extra editable inline */}
                              <span style={{ color: '#9ca3af', fontSize: 12 }}>+</span>
                              <input type="number" min="0" step="0.01"
                                value={v.precio_extra}
                                onChange={e => actualizarValor(v.id, 'precio_extra', parseFloat(e.target.value) || 0)}
                                style={{ width: 52, border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 6px', fontSize: 12, textAlign: 'right' }} />
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>€</span>
                              <button onClick={() => eliminarValor(v.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: 2 }}><Trash2 size={13} /></button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulario nuevo valor */}
                      <div style={{ background: 'white', border: '1px dashed #d1d5db', borderRadius: 12, padding: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 10 }}>AÑADIR VALOR</p>

                        {/* Foto (solo tipo 'foto') */}
                        {tipo.tipo_input === 'foto' && (
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#f9fafb', fontSize: 13 }}>
                              <Upload size={13} />
                              {subiendoFoto[tipo.id] ? 'Subiendo…' : nv.imagen_url ? '✓ Foto lista' : 'Subir foto'}
                              <input type="file" accept="image/*" style={{ display: 'none' }}
                                disabled={subiendoFoto[tipo.id]}
                                onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(tipo.id, f); }} />
                            </label>
                            {nv.imagen_url && <img src={nv.imagen_url} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />}
                            <div>
                              <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>ETIQUETA (letra)</label>
                              <select value={nv.etiqueta}
                                onChange={e => setNuevoValor(p => ({ ...p, [tipo.id]: { ...p[tipo.id], etiqueta: e.target.value } }))}
                                style={{ ...inS, width: 80, marginTop: 2 }}>
                                <option value="">—</option>
                                {LETRAS.filter(l => !tipoVals.some(v => v.etiqueta === l)).map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Texto libre: solo aviso */}
                        {tipo.tipo_input === 'texto_libre' && (
                          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#92400e' }}>
                            Este tipo es de texto libre — el cliente escribe su propio texto. No necesitas definir valores aquí, solo puedes añadir un texto de ayuda/placeholder.
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div style={{ flex: 2, minWidth: 140 }}>
                            <label style={lbl}>{tipo.tipo_input === 'texto_libre' ? 'PLACEHOLDER (texto de ayuda)' : 'VALOR'}</label>
                            <input style={inS}
                              placeholder={tipo.tipo_input === 'texto_libre' ? 'Ej: Escribe el nombre a bordar…' : 'Ej: XL, Rojo, Satén…'}
                              value={nv.valor}
                              onChange={e => setNuevoValor(p => ({ ...p, [tipo.id]: { ...p[tipo.id], valor: e.target.value } }))}
                              onKeyDown={e => { if (e.key === 'Enter') crearValor(tipo); }} />
                          </div>
                          {tipo.tipo_input !== 'texto_libre' && (
                            <div style={{ minWidth: 90 }}>
                              <label style={lbl}>PRECIO EXTRA (€)</label>
                              <input type="number" step="0.01" min="0" style={inS}
                                placeholder="0"
                                value={nv.precio_extra}
                                onChange={e => setNuevoValor(p => ({ ...p, [tipo.id]: { ...p[tipo.id], precio_extra: e.target.value } }))} />
                            </div>
                          )}
                          <button onClick={() => crearValor(tipo)}
                            disabled={subiendoFoto[tipo.id]}
                            style={{ padding: '10px 18px', borderRadius: 10, background: '#1e293b', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, height: 42 }}>
                            <Plus size={14} /> Añadir
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Estilos de botones ────────────────────────────────────────────────── */
const lbl: React.CSSProperties = { fontSize: 10, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 4, letterSpacing: '0.05em' };
const btnBase: React.CSSProperties = { border: 'none', borderRadius: 8, cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const btnAzul  = { ...btnBase, background: '#eff6ff', color: '#2563eb' };
const btnRojo  = { ...btnBase, background: '#fff1f2', color: '#ef4444' };
const btnVerde = { ...btnBase, background: '#f0fdf4', color: '#16a34a' };
const btnGris  = { ...btnBase, background: '#f3f4f6', color: '#374151' };
