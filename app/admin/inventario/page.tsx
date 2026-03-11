'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useRef } from 'react';
import { Save, Trash2, ArrowLeft, Pencil, X, Check, Search, Plus, Upload, Link as LinkIcon, HardDrive } from 'lucide-react';
import Link from 'next/link';

export default function GestionInventario() {
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoP, setNuevoP] = useState({ nombre: '', precio: '', familia_id: '', imagen_url: '' });
  const [modoImagen, setModoImagen] = useState<'url' | 'local' | 'drive'>('url');
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modoImagenEdit, setModoImagenEdit] = useState<'url' | 'local' | 'drive'>('url');
  const [driveUrlEdit, setDriveUrlEdit] = useState('');
  const fileInputEditRef = useRef<HTMLInputElement>(null);

  // ESTADOS PARA BÚSQUEDA Y EDICIÓN
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [datosEdit, setDatosEdit] = useState<any>(null);

  // Familias
  const [familias, setFamilias] = useState<any[]>([]);
  const [nuevoFamiliaNombre, setNuevoFamiliaNombre] = useState('');

  // Create Supabase client lazily inside functions to avoid errors during module evaluation
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  useEffect(() => {
    fetchFamilias();
    fetchProductos();
  }, []);

  const fetchFamilias = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      console.warn('Supabase no configurado; no se cargarán familias.');
      setFamilias([]);
      return;
    }
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const { data } = await supabase.from('familias').select('*').order('nombre');
    setFamilias(data || []);
  };

  const fetchProductos = async () => {
    // solicitar la relación con familias si existe
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      console.warn('Supabase no configurado; no se cargarán productos.');
      setProductos([]);
      setCargando(false);
      return;
    }
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const { data } = await supabase.from('productos').select('*, familias(id, nombre)').order('id', { ascending: false });
    setProductos(data || []);
    setCargando(false);
  };

  // Convierte URL de Google Drive a URL directa de imagen
  const convertirUrlDrive = (url: string): string => {
    const match = url.match(/[-\w]{25,}/);
    if (!match) return url;
    return `https://drive.google.com/uc?export=view&id=${match[0]}`;
  };

  // Sube un archivo local a Supabase Storage y devuelve la URL pública
  const subirImagenLocal = async (file: File): Promise<string | null> => {
    if (!SUPABASE_URL || !SUPABASE_ANON) { alert('Supabase no configurado'); return null; }
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const ext = file.name.split('.').pop();
    const nombre = `productos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('imagenes').upload(nombre, file, { upsert: true });
    if (error) { alert('Error subiendo imagen: ' + error.message); return null; }
    const { data } = supabase.storage.from('imagenes').getPublicUrl(nombre);
    return data.publicUrl;
  };

  const crearProducto = async () => {
    if (!nuevoP.nombre || !nuevoP.precio) return alert("Nombre y precio son obligatorios");

    let imagenFinal = nuevoP.imagen_url || null;

    // Resolver imagen según el modo
    if (modoImagen === 'local' && fileInputRef.current?.files?.[0]) {
      setSubiendoImagen(true);
      imagenFinal = await subirImagenLocal(fileInputRef.current.files[0]);
      setSubiendoImagen(false);
      if (!imagenFinal) return;
    } else if (modoImagen === 'drive' && driveUrl.trim()) {
      imagenFinal = convertirUrlDrive(driveUrl.trim());
    }

    if (!SUPABASE_URL || !SUPABASE_ANON) return alert('Supabase no configurado. No se puede crear producto.');
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);

    const payload: any = {
      nombre: nuevoP.nombre,
      precio: parseFloat(nuevoP.precio),
      imagen_url: imagenFinal
    };

    if (nuevoP.familia_id) {
      payload.familia_id = nuevoP.familia_id;
      // también mantener el nombre en la columna legacy por compatibilidad si existe
      const f = familias.find((x) => String(x.id) === String(nuevoP.familia_id));
      if (f) payload.familia = f.nombre;
    }

    // Sanear payload: eliminar campos no-primarios (objetos/arrays) y la relación 'familias'
    const sanitizedInsert: any = Object.fromEntries(
      Object.entries(payload).filter(([k, v]) => {
        if (k === 'familias') return false;
        if (v === null) return true;
        const t = typeof v;
        return (t === 'string' || t === 'number' || t === 'boolean');
      })
    );

    // Intentar insertar; si la API reclama que la columna 'familia' no existe, reintentar sin ella
    try {
      const { error } = await supabase.from('productos').insert([sanitizedInsert]);
      if (error) {
        if (String(error.message).toLowerCase().includes('familia')) {
          const s2 = { ...sanitizedInsert };
          delete s2.familia;
          const { error: e2 } = await supabase.from('productos').insert([s2]);
          if (e2) return alert(e2.message);
        } else {
          return alert(error.message);
        }
      }

      setNuevoP({ nombre: '', precio: '', familia_id: '', imagen_url: '' });
      setDriveUrl('');
      setModoImagen('url');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchProductos();
    } catch (e: any) {
      // fallback: si la excepción menciona la columna familia, intentar sin ella
      if (String(e).toLowerCase().includes('familia')) {
        const s2 = { ...sanitizedInsert };
        delete s2.familia;
        const { error: e2 } = await supabase.from('productos').insert([s2]);
        if (e2) return alert(e2.message);
        setNuevoP({ nombre: '', precio: '', familia_id: '', imagen_url: '' });
        fetchProductos();
      } else {
        alert(String(e));
      }
    }
  };

  const guardarEdicion = async (id: string) => {
    // Resolver imagen si se está subiendo en modo edición
    if (modoImagenEdit === 'local' && fileInputEditRef.current?.files?.[0]) {
      setSubiendoImagen(true);
      const url = await subirImagenLocal(fileInputEditRef.current.files[0]);
      setSubiendoImagen(false);
      if (!url) return;
      setDatosEdit((d: any) => ({ ...d, imagen_url: url }));
      // usar el valor directamente en el payload
      datosEdit.imagen_url = url;
    } else if (modoImagenEdit === 'drive' && driveUrlEdit.trim()) {
      datosEdit.imagen_url = convertirUrlDrive(driveUrlEdit.trim());
    }

    // preparar payload: si viene familia_id, también actualizar el campo legacy 'familia' con el nombre
    const payload: any = { ...datosEdit };
    if (datosEdit?.familia_id) {
      const f = familias.find((x) => String(x.id) === String(datosEdit.familia_id));
      if (f) payload.familia = f.nombre;
    } else {
      payload.familia = null;
      payload.familia_id = null;
    }

    // Sanear payload: eliminar campos no-primarios (objetos/arrays) y la relación 'familias'
    const sanitizedPayload: any = Object.fromEntries(
      Object.entries(payload).filter(([k, v]) => {
        if (k === 'familias') return false;
        // permitir null y primitivos (string, number, boolean)
        if (v === null) return true;
        const t = typeof v;
        return (t === 'string' || t === 'number' || t === 'boolean');
      })
    );

    try {
      if (!SUPABASE_URL || !SUPABASE_ANON) return alert('Supabase no configurado. No se puede guardar la edición.');
      const supabase = createBrowserClient(SUPABASE_URL!, SUPABASE_ANON!);
      const { error } = await supabase.from('productos').update(sanitizedPayload).eq('id', id);
      if (error) {
        // Si la API dice que no existe la columna legacy 'familia', reintentar sin ese campo
        if (String(error.message).toLowerCase().includes('familia') || String(error.message).toLowerCase().includes('could not find')) {
          const s2 = { ...sanitizedPayload };
          delete s2.familia;
          const { error: retryErr } = await supabase.from('productos').update(s2).eq('id', id);
          if (retryErr) return alert(retryErr.message);
        } else {
          return alert(error.message);
        }
      }

      setEditandoId(null);
      setDatosEdit(null);
      fetchProductos();
    } catch (e: any) {
      // Fallback: si la excepción contiene 'familia' o error inesperado, mostrar aviso
      if (String(e).toLowerCase().includes('familia')) {
        const s2 = { ...sanitizedPayload };
        delete s2.familia;
        if (!SUPABASE_URL || !SUPABASE_ANON) return alert('Supabase no configurado. No se puede guardar la edición.');
        const supabase = createBrowserClient(SUPABASE_URL!, SUPABASE_ANON!);
        const { error: retryErr } = await supabase.from('productos').update(s2).eq('id', id);
        if (retryErr) return alert(retryErr.message);
        setEditandoId(null);
        setDatosEdit(null);
        fetchProductos();
      } else {
        alert(String(e));
      }
    }
  };

  const eliminarProducto = async (id: any) => {
    if (confirm("¿Seguro que quieres eliminarlo?")) {
      if (!SUPABASE_URL || !SUPABASE_ANON) return alert('Supabase no configurado. No se puede eliminar.');
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
      await supabase.from('productos').delete().eq('id', id);
      fetchProductos();
    }
  };

  // FILTRADO PARA EL BUSCADOR
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
    ((p.familias?.nombre || p.familia || '') && (p.familias?.nombre || p.familia || '').toLowerCase().includes(terminoBusqueda.toLowerCase()))
  );

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', textDecoration: 'none', marginBottom: '20px', fontWeight: 'bold' }}>
          <ArrowLeft size={18} /> Volver al Menú Admin
        </Link>

        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '30px' }}>Inventario de Productos</h1>

        {/* FORMULARIO DE CREACIÓN */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e5e7eb', marginBottom: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Añadir Producto
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <input style={inS} placeholder="Nombre" value={nuevoP.nombre} onChange={e => setNuevoP({...nuevoP, nombre: e.target.value})} />
            <input style={inS} placeholder="Precio (€)" type="number" value={nuevoP.precio} onChange={e => setNuevoP({...nuevoP, precio: e.target.value})} />

            <select style={inS} value={nuevoP.familia_id} onChange={(e) => setNuevoP({...nuevoP, familia_id: e.target.value})}>
              <option value="">-- Selecciona familia (opcional) --</option>
              {familias.map((f) => (
                <option key={f.id} value={String(f.id)}>{f.nombre}</option>
              ))}
            </select>

            {/* SELECTOR DE MODO IMAGEN */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {(['url', 'local', 'drive'] as Array<'url' | 'local' | 'drive'>).map(modo => (
                  <button key={modo} onClick={() => setModoImagen(modo)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #e5e7eb', background: modoImagen === modo ? 'black' : 'white', color: modoImagen === modo ? 'white' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: modoImagen === modo ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {modo === 'url' && <><LinkIcon size={13}/> URL</>}
                    {modo === 'local' && <><Upload size={13}/> Subir archivo</>}
                    {modo === 'drive' && <><HardDrive size={13}/> Google Drive</>}
                  </button>
                ))}
              </div>
              {modoImagen === 'url' && (
                <input style={inS} placeholder="URL de la imagen" value={nuevoP.imagen_url} onChange={e => setNuevoP({...nuevoP, imagen_url: e.target.value})} />
              )}
              {modoImagen === 'local' && (
                <input ref={fileInputRef} type="file" accept="image/*" style={{ ...inS, padding: '8px' }} />
              )}
              {modoImagen === 'drive' && (
                <input style={inS} placeholder="Pega el enlace de Google Drive" value={driveUrl} onChange={e => setDriveUrl(e.target.value)} />
              )}
            </div>
            <button onClick={crearProducto} disabled={subiendoImagen} style={{ backgroundColor: subiendoImagen ? '#9ca3af' : 'black', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: subiendoImagen ? 'not-allowed' : 'pointer', height: '42px' }}>
              {subiendoImagen ? 'Subiendo...' : 'Guardar'}
            </button>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input style={{ ...inS, width: 240 }} placeholder="Nueva familia" value={nuevoFamiliaNombre} onChange={(e) => setNuevoFamiliaNombre(e.target.value)} />
            <button onClick={async () => {
              if (!nuevoFamiliaNombre.trim()) return alert('Nombre de familia vacío');
              if (!SUPABASE_URL || !SUPABASE_ANON) return alert('Supabase no configurado. No se puede crear familia.');
              const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
              const { error, data } = await supabase.from('familias').insert([{ nombre: nuevoFamiliaNombre.trim() }]).select().single();
              if (error) return alert(error.message);
              setNuevoFamiliaNombre('');
              fetchFamilias();
              // seleccionar la familia recién creada para el nuevo producto
              setNuevoP((np) => ({ ...np, familia_id: String(data.id) }));
            }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>Crear familia</button>
          </div>
        </div>

        {/* BUSCADOR DE ADMINISTRACIÓN */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search style={{ position: 'absolute', left: '15px', top: '12px', color: '#9ca3af' }} size={20} />
          <input 
            style={{ ...inS, paddingLeft: '45px', height: '45px', backgroundColor: 'white' }} 
            placeholder="Buscar por nombre o familia..." 
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
          />
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '20px', fontSize: '14px', color: '#6b7280' }}>PRODUCTO</th>
                <th style={{ fontSize: '14px', color: '#6b7280' }}>FAMILIA</th>
                <th style={{ fontSize: '14px', color: '#6b7280' }}>PRECIO</th>
                <th style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '15px 20px' }}>
                    {editandoId === p.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input style={inS} value={datosEdit?.nombre ?? ''} onChange={e => setDatosEdit({...datosEdit, nombre: e.target.value})} />
                        {/* Selector modo imagen edición */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(['url', 'local', 'drive'] as Array<'url' | 'local' | 'drive'>).map(modo => (
                            <button key={modo} onClick={() => setModoImagenEdit(modo)} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid #e5e7eb', background: modoImagenEdit === modo ? 'black' : 'white', color: modoImagenEdit === modo ? 'white' : '#374151', cursor: 'pointer', fontSize: 12 }}>
                              {modo === 'url' && 'URL'}
                              {modo === 'local' && 'Subir'}
                              {modo === 'drive' && 'Drive'}
                            </button>
                          ))}
                        </div>
                        {modoImagenEdit === 'url' && (
                          <input style={inS} placeholder="URL imagen" value={datosEdit?.imagen_url ?? ''} onChange={e => setDatosEdit({...datosEdit, imagen_url: e.target.value})} />
                        )}
                        {modoImagenEdit === 'local' && (
                          <input ref={fileInputEditRef} type="file" accept="image/*" style={{ ...inS, padding: '8px' }} />
                        )}
                        {modoImagenEdit === 'drive' && (
                          <input style={inS} placeholder="Enlace de Google Drive" value={driveUrlEdit} onChange={e => setDriveUrlEdit(e.target.value)} />
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={p.imagen_url} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.nombre}</span>
                        </div>
                        <a href={p.imagen_url || '#'} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: p.imagen_url ? '#2563eb' : '#9ca3af', textDecoration: p.imagen_url ? 'underline' : 'none', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.imagen_url || '—'}</a>
                      </div>
                    )}
                  </td>
                  <td>
                    {editandoId === p.id ? (
                      <select style={inS} value={datosEdit?.familia_id ?? ''} onChange={e => setDatosEdit({...datosEdit, familia_id: e.target.value})}>
                        <option value="">-- Sin familia --</option>
                        {familias.map((f) => (
                          <option key={f.id} value={String(f.id)}>{f.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>{p.familias?.nombre || p.familia || 'General'}</span>
                    )}
                  </td>
                  <td>
                    {editandoId === p.id ? (
                      <input style={inS} type="number" value={datosEdit?.precio ?? ''} onChange={e => setDatosEdit({...datosEdit, precio: e.target.value === '' ? '' : parseFloat(e.target.value)})} />
                    ) : (
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.precio}€</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      {editandoId === p.id ? (
                        <>
                          <button onClick={() => guardarEdicion(p.id)} style={{ color: '#10b981', border: 'none', background: 'none', cursor: 'pointer' }}><Check size={20}/></button>
                          <button onClick={() => { setEditandoId(null); setDatosEdit(null); setModoImagenEdit('url'); setDriveUrlEdit(''); if (fileInputEditRef.current) fileInputEditRef.current.value = ''; }} style={{ color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer' }}><X size={20}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { const famId = p.familia_id ?? (familias.find(f => f.nombre === p.familia)?.id ?? ''); setEditandoId(p.id); setDatosEdit({ ...p, familia_id: String(famId) }); setModoImagenEdit('url'); setDriveUrlEdit(''); }} style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer' }}><Pencil size={18} /></button>
                          <button onClick={() => eliminarProducto(p.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {productosFiltrados.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No se encontraron productos coincidentes.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const inS = { width: '100%', padding: '10px 15px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px' };
