'use client';

/**
 * VariantesEditor — completamente dinámico
 * Lee los tipos de variante desde tipos_variante / valores_variante en BD.
 * Permite asignar hasta 5 tipos a un producto y ver/editar sus valores.
 */

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface TipoVar {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_input: 'selector' | 'texto_libre' | 'foto';
  es_requerido: boolean;
}

interface ValorVar {
  id: string;
  tipo_id: string;
  valor: string;
  etiqueta: string | null;
  imagen_url: string | null;
  precio_extra: number;
}

const inS: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 8,
  border: '1px solid #e5e7eb', fontSize: 13, outline: 'none',
};

export default function VariantesEditor({
  productoId, onCambio, defaultOpen = false
}: {
  productoId: string;
  onCambio?: () => void;
  variantes?: any[]; // compatibilidad legacy, no usado
  defaultOpen?: boolean;
}) {
  const [abierto, setAbierto]           = useState(defaultOpen);
  const [todosLosTipos, setTodosLosTipos] = useState<TipoVar[]>([]);
  const [todosLosValores, setTodosLosValores] = useState<ValorVar[]>([]);
  const [tiposAsignados, setTiposAsignados]   = useState<TipoVar[]>([]);
  const [cargando, setCargando]         = useState(false);

  const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const sb = useCallback(() => {
    if (!SB_URL || !SB_ANON) throw new Error('Supabase no configurado');
    return createBrowserClient(SB_URL, SB_ANON);
  }, [SB_URL, SB_ANON]);

  const cargar = useCallback(async () => {
    if (!SB_URL || !SB_ANON) return;
    setCargando(true);
    try {
      const client = sb();
      const [{ data: tipos }, { data: vals }, { data: asig }] = await Promise.all([
        client.from('tipos_variante').select('*').eq('activo', true).order('orden').order('created_at'),
        client.from('valores_variante').select('*').eq('activo', true).order('orden').order('created_at'),
        client.from('producto_variantes').select('tipo_id').eq('producto_id', productoId),
      ]);
      setTodosLosTipos(tipos || []);
      setTodosLosValores(vals || []);
      const idsAsig = new Set((asig || []).map((r: any) => r.tipo_id));
      setTiposAsignados((tipos || []).filter((t: TipoVar) => idsAsig.has(t.id)));
    } finally { setCargando(false); }
  }, [productoId, SB_URL, SB_ANON]);

  useEffect(() => { if (abierto) cargar(); }, [abierto, cargar]);

  const asignar = async (tipoId: string) => {
    if (tiposAsignados.length >= 5) return alert('Máximo 5 tipos de variante por producto.');
    await sb().from('producto_variantes').insert([{ producto_id: productoId, tipo_id: tipoId }]);
    await cargar();
    onCambio?.();
  };

  const desasignar = async (tipoId: string) => {
    if (!confirm('¿Quitar este tipo de variante del producto?')) return;
    await sb().from('producto_variantes').delete().eq('producto_id', productoId).eq('tipo_id', tipoId);
    await cargar();
    onCambio?.();
  };

  const tiposDisponibles = todosLosTipos.filter(t => !tiposAsignados.some(a => a.id === t.id));

  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setAbierto(!abierto)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {abierto ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        Variantes del producto
        {tiposAsignados.length > 0 && (
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>· {tiposAsignados.length}/5 tipos</span>
        )}
      </button>

      {abierto && (
        <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: '#f8fafc' }}>

          {cargando ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando…</p>
          ) : (
            <>
              {/* Tipos asignados */}
              {tiposAsignados.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
                  Sin variantes asignadas. Añade un tipo abajo.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {tiposAsignados.map(tipo => {
                    const vals = todosLosValores.filter(v => v.tipo_id === tipo.id);
                    return (
                      <TipoAsignadoRow
                        key={tipo.id}
                        tipo={tipo}
                        valores={vals}
                        onDesasignar={() => desasignar(tipo.id)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Añadir tipo */}
              {tiposDisponibles.length > 0 && tiposAsignados.length < 5 && (
                <div style={{ borderTop: tiposAsignados.length > 0 ? '1px solid #e5e7eb' : 'none', paddingTop: tiposAsignados.length > 0 ? 12 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: 0 }}>AÑADIR TIPO DE VARIANTE</p>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{5 - tiposAsignados.length} disponibles</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {tiposDisponibles.map(t => (
                      <button key={t.id} onClick={() => asignar(t.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: '1px dashed #cbd5e1', background: 'white', color: '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Plus size={11}/> {t.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Si no hay tipos creados en la BD */}
              {todosLosTipos.length === 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
                  No hay tipos de variante creados. Ve a{' '}
                  <Link href="/admin/variantes" style={{ color: '#2563eb', fontWeight: 700 }}>
                    Admin → Tipos de Variante
                  </Link>{' '}
                  para crear los tipos de tu tienda.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Fila de tipo asignado con sus valores (solo lectura, readonly) ────── */
function TipoAsignadoRow({ tipo, valores, onDesasignar }: {
  tipo: TipoVar;
  valores: ValorVar[];
  onDesasignar: () => void;
}) {
  const INPUT_LABEL: Record<string, string> = {
    selector: 'Selector', texto_libre: 'Texto libre', foto: 'Con foto',
  };

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: valores.length > 0 ? 8 : 0 }}>
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{tipo.nombre}</span>
        <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
          {INPUT_LABEL[tipo.tipo_input] || tipo.tipo_input}
        </span>
        {tipo.es_requerido && (
          <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>Obligatorio</span>
        )}
        <button onClick={onDesasignar}
          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Trash2 size={13}/>
        </button>
      </div>

      {/* Valores */}
      {tipo.tipo_input !== 'texto_libre' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {valores.length === 0 ? (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              Sin valores. Añádelos en{' '}
              <Link href="/admin/variantes" style={{ color: '#2563eb', fontWeight: 700 }}>Tipos de Variante</Link>.
            </span>
          ) : (
            valores.map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 7, padding: '3px 8px', fontSize: 11 }}>
                {v.imagen_url && <img src={v.imagen_url} style={{ width: 18, height: 18, borderRadius: 3, objectFit: 'cover' }} />}
                {v.etiqueta && <span style={{ background: '#1e293b', color: 'white', borderRadius: 3, fontSize: 9, fontWeight: 900, padding: '1px 4px' }}>{v.etiqueta}</span>}
                <span style={{ fontWeight: 600 }}>{v.valor}</span>
                {v.precio_extra > 0 && <span style={{ color: '#10b981', fontSize: 10 }}>+{v.precio_extra}€</span>}
              </div>
            ))
          )}
        </div>
      )}
      {tipo.tipo_input === 'texto_libre' && tipo.descripcion && (
        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>"{tipo.descripcion}"</p>
      )}
    </div>
  );
}
