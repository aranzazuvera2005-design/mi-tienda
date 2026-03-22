'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useRef } from 'react';
import { Trash2, ArrowLeft, Pencil, X, Check, Search, Plus, Upload, Link as LinkIcon, HardDrive, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';
import Link from 'next/link';
import VariantesEditor from '@/components/VariantesEditor';

type ModoImagen = 'url' | 'local' | 'drive';

export default function GestionInventario() {
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoP, setNuevoP] = useState({ nombre: '', precio: '', precio_tachado: '', descuento_pct: '', familia_id: '', descripcion: '', descripcion_larga: '' });
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Imágenes del nuevo producto
  const [imagenesNuevo, setImagenesNuevo] = useState<string[]>([]);
  const [modoImagenNuevo, setModoImagenNuevo] = useState<ModoImagen>('url');
  const [urlInputNuevo, setUrlInputNuevo] = useState('');
  const fileInputNuevoRef = useRef<HTMLInputElement>(null);

  // ESTADOS PARA BÚSQUEDA Y EDICIÓN
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroFamilia, setFiltroFamilia]     = useState('');
  const [sortAdmin, setSortAdmin]             = useState('newest');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [datosEdit, setDatosEdit] = useState<any>(null);
  const [imagenesEdit, setImagenesEdit] = useState<string[]>([]);
  const [modoImagenEdit, setModoImagenEdit] = useState<ModoImagen>('url');
  const [urlInputEdit, setUrlInputEdit] = useState('');
  const fileInputEditRef = useRef<HTMLInputElement>(null);

  // Carousel por producto (índice activo)
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({});

  // Variantes por producto
  const [variantesPorProducto, setVariantesPorProducto] = useState<Record<string, any[]>>({});

  // Familias
  const [familias, setFamilias] = useState<any[]>([]);
  const [nuevoFamiliaNombre, setNuevoFamiliaNombre] = useState('');

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  useEffect(() => {
    fetchFamilias();
    fetchProductos();
  }, []);

  const fetchFamilias = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON) { setFamilias([]); return; }
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const { data } = await supabase.from('familias').select('*').order('nombre');
    setFamilias(data || []);
  };

  const fetchProductos = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON) { setProductos([]); setCargando(false); return; }
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
    const { data } = await supabase.from('productos').select('*, familias(id, nombre)').order('id', { ascending: false });
    setProductos(data || []);
    setCargando(false);
    // Cargar variantes para todos los productos
    if (data && data.length > 0) {
      const ids = data.map((p: any) => p.id);
      const { data: vars } = await supabase.from('variantes').select('*').in('producto_id', ids);
      if (vars) {
        const agrupadas: Record<string, any[]> = {};
        vars.forEach((v: any) => {
          if (!agrupadas[v.producto_id]) agrupadas[v.producto_id] = [];
          agrupadas[v.producto_id].push(v);
        });
        setVariantesPorProducto(agrupadas);
      }
    }
  };

  // Utilidades de imagen
  const convertirUrlDrive = (url: string): string => {
    const match = url.match(/[-\w]{25,}/);
    if (!match) return url;
    return `https://drive.google.com/uc?export=view&id=${match[0]}`;
  };

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

  const resolverUrlImagen = async (modo: ModoImagen, urlInput: string, fileRef: React.RefObject<HTMLInputElement>): Promise<string | null> => {
    if (modo === 'url' && urlInput.trim()) return urlInput.trim();
    if (modo === 'drive' && urlInput.trim()) return convertirUrlDrive(urlInput.trim());
    if (modo === 'local' && fileRef.current?.files?.[0]) {
      setSubiendoImagen(true);
      const url = await subirImagenLocal(fileRef.current.files[0]);
      setSubiendoImagen(false);
      if (fileRef.current) fileRef.current.value = '';
      return url;
    }
    return null;
  };

  // Añadir imagen a la lista (nuevo producto)
  const añadirImagenNuevo = async () => {
    const url = await resolverUrlImagen(modoImagenNuevo, urlInputNuevo, fileInputNuevoRef);
    if (!url) return alert('Selecciona o escribe una imagen primero');
    setImagenesNuevo(prev => [...prev, url]);
    setUrlInputNuevo('');
  };

  // Añadir imagen a la lista (edición)
  const añadirImagenEdit = async () => {
    const url = await resolverUrlImagen(modoImagenEdit, urlInputEdit, fileInputEditRef);
    if (!url) return alert('Selecciona o escribe una imagen primero');
    setImagenesEdit(prev => [...prev, url]);
    setUrlInputEdit('');
  };

  const crearProducto = async () => {
    if (!nuevoP.nombre || !nuevoP.precio) return alert('Nombre y precio son obligatorios');
    if (!SUPABASE_URL || !SUPABASE_ANON) return alert('Supabase no configurado.');
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);

    const payload: any = {
      nombre: nuevoP.nombre,
      precio: parseFloat(nuevoP.precio),
      precio_tachado: nuevoP.precio_tachado ? parseFloat(nuevoP.precio_tachado) : null,
      descuento_pct:  nuevoP.descuento_pct  ? parseFloat(nuevoP.descuento_pct)  : null,
      imagen_url: imagenesNuevo[0] || null,
      imagenes: imagenesNuevo,
      descripcion: nuevoP.descripcion || null,
      descripcion_larga: nuevoP.descripcion_larga || null,
    };

    if (nuevoP.familia_id) {
      payload.familia_id = nuevoP.familia_id;
      const f = familias.find((x) => String(x.id) === String(nuevoP.familia_id));
      if (f) payload.familia = f.nombre;
    }

    const sanitized: any = Object.fromEntries(
      Object.entries(payload).filter(([k, v]) => {
        if (k === 'familias') return false;
        if (v === null || Array.isArray(v)) return true;
        const t = typeof v;
        return t === 'string' || t === 'number' || t === 'boolean';
      })
    );

    try {
      const { error } = await supabase.from('productos').insert([sanitized]);
      if (error) {
        const s2 = { ...sanitized }; delete s2.familia;
        const { error: e2 } = await supabase.from('productos').insert([s2]);
        if (e2) return alert(e2.message);
      }
      setNuevoP({ nombre: '', precio: '', precio_tachado: '', descuento_pct: '', familia_id: '', descripcion: '', descripcion_larga: '' });
      setImagenesNuevo([]);
      setUrlInputNuevo('');
      fetchProductos();
    } catch (e: any) { alert(String(e)); }
  };

  const guardarEdicion = async (id: string) => {
    const familiaSeleccionada = datosEdit?.familia_id
      ? familias.find((x) => String(x.id) === String(datosEdit.familia_id))
      : null;

    const payload: any = {
      id,
      nombre: datosEdit.nombre,
      precio: parseFloat(datosEdit.precio) || 0,
      precio_tachado: datosEdit.precio_tachado ? parseFloat(datosEdit.precio_tachado) : null,
      descuento_pct: datosEdit.descuento_pct ? parseFloat(datosEdit.descuento_pct) : null,
      descripcion: datosEdit.descripcion || null,
      descripcion_larga: datosEdit.descripcion_larga || null,
      imagen_url: imagenesEdit[0] || null,
      imagenes: imagenesEdit,
      familia_id: datosEdit.familia_id || null,
      familia: familiaSeleccionada?.nombre || null,
    };

    try {
      const res = await fetch('/api/admin/productos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) return alert(json.error || 'Error al guardar');
      setEditandoId(null);
      setDatosEdit(null);
      setImagenesEdit([]);
      setUrlInputEdit('');
      setModoImagenEdit('url');
      fetchProductos();
    } catch (e: any) { alert(String(e)); }
  };

  const eliminarProducto = async (id: any) => {
    if (!confirm('¿Seguro que quieres eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/admin/productos?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) return alert(json.error || 'Error al eliminar');
      fetchProductos();
    } catch (e: any) { alert(String(e)); }
  };

  const productosFiltrados = (() => {
    let r = productos.filter(p =>
      p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      ((p.familias?.nombre || p.familia || '').toLowerCase().includes(terminoBusqueda.toLowerCase()))
    );
    if (filtroFamilia) r = r.filter(p => String(p.familia_id) === filtroFamilia || String(p.familias?.id) === filtroFamilia);
    r = [...r].sort((a, b) => {
      switch (sortAdmin) {
        case 'price_asc':     return Number(a.precio || 0) - Number(b.precio || 0);
        case 'price_desc':    return Number(b.precio || 0) - Number(a.precio || 0);
        case 'name_asc':      return (a.nombre || '').localeCompare(b.nombre || '');
        case 'name_desc':     return (b.nombre || '').localeCompare(a.nombre || '');
        case 'discount_desc': {
          const pct = (p: any) => { const pvp = Number(p.precio||0), t = Number(p.precio_tachado||0), d = Number(p.descuento_pct||0); return d > 0 ? d : (t > pvp && pvp > 0 ? Math.round((1-pvp/t)*100) : 0); };
          return pct(b) - pct(a);
        }
        case 'discount_asc': {
          const pct = (p: any) => { const pvp = Number(p.precio||0), t = Number(p.precio_tachado||0), d = Number(p.descuento_pct||0); return d > 0 ? d : (t > pvp && pvp > 0 ? Math.round((1-pvp/t)*100) : 0); };
          return pct(a) - pct(b);
        }
        default: return (b.id || 0) - (a.id || 0);
      }
    });
    return r;
  })();

  const getImagenes = (p: any): string[] => {
    if (Array.isArray(p.imagenes) && p.imagenes.length > 0) return p.imagenes;
    if (p.imagen_url) return [p.imagen_url];
    return [];
  };

  // Componente selector de imagen reutilizable
  const SelectorImagen = ({ modo, setModo, urlInput, setUrlInput, fileRef, onAñadir, disabled }: any) => (
    <div style={{ border: '1px dashed #d1d5db', borderRadius: 12, padding: 12, backgroundColor: '#f9fafb' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['url', 'local', 'drive'] as ModoImagen[]).map(m => (
          <button key={m} onClick={() => setModo(m)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #e5e7eb', background: modo === m ? 'black' : 'white', color: modo === m ? 'white' : '#374151', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            {m === 'url' && <><LinkIcon size={11}/> URL</>}
            {m === 'local' && <><Upload size={11}/> Subir</>}
            {m === 'drive' && <><HardDrive size={11}/> Drive</>}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {modo === 'local' ? (
          <input ref={fileRef} type="file" accept="image/*" style={{ ...inS, padding: '8px', flex: 1 }} />
        ) : (
          <input style={{ ...inS, flex: 1 }} placeholder={modo === 'drive' ? 'Enlace de Google Drive' : 'https://...'} value={urlInput} onChange={e => setUrlInput(e.target.value)} />
        )}
        <button onClick={onAñadir} disabled={disabled} style={{ padding: '8px 14px', borderRadius: 10, background: disabled ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 13, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
          <ImagePlus size={14}/> {disabled ? 'Subiendo...' : 'Añadir'}
        </button>
      </div>
    </div>
  );

  // Lista de imágenes añadidas
  const ListaImagenes = ({ imagenes, setImagenes }: { imagenes: string[], setImagenes: (imgs: string[]) => void }) => (
    imagenes.length > 0 ? (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {imagenes.map((url, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={url} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: i === 0 ? '2px solid #2563eb' : '2px solid #e5e7eb' }} />
            {i === 0 && <span style={{ position: 'absolute', bottom: 2, left: 2, background: '#2563eb', color: 'white', fontSize: 9, borderRadius: 4, padding: '1px 4px' }}>PRINCIPAL</span>}
            <button onClick={() => setImagenes(imagenes.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', border: 'none', borderRadius: '50%', width: 18, height: 18, color: 'white', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        ))}
      </div>
    ) : null
  );

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

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
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 4 }}>PVP (€)</label>
              <input style={inS} placeholder="Precio de venta" type="number" value={nuevoP.precio} onChange={e => setNuevoP({...nuevoP, precio: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, display: 'block', marginBottom: 4 }}>Precio tachado (€) <span style={{ fontWeight: 400 }}>opcional</span></label>
              <input style={inS} placeholder="Precio original" type="number" value={nuevoP.precio_tachado} onChange={e => setNuevoP({...nuevoP, precio_tachado: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, display: 'block', marginBottom: 4 }}>Descuento % <span style={{ fontWeight: 400 }}>opcional</span></label>
              <input style={inS} placeholder="Ej: 20" type="number" min="0" max="99" value={nuevoP.descuento_pct} onChange={e => setNuevoP({...nuevoP, descuento_pct: e.target.value})} />
            </div>
            <select style={inS} value={nuevoP.familia_id} onChange={(e) => setNuevoP({...nuevoP, familia_id: e.target.value})}>
              <option value="">-- Familia (opcional) --</option>
              {familias.map((f) => <option key={f.id} value={String(f.id)}>{f.nombre}</option>)}
            </select>
          </div>

          {/* Selector imágenes nuevo producto */}
          <div style={{ marginTop: 15 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Imágenes del producto <span style={{ color: '#9ca3af', fontWeight: 400 }}>(la primera será la principal)</span></p>
            <SelectorImagen
              modo={modoImagenNuevo} setModo={setModoImagenNuevo}
              urlInput={urlInputNuevo} setUrlInput={setUrlInputNuevo}
              fileRef={fileInputNuevoRef} onAñadir={añadirImagenNuevo} disabled={subiendoImagen}
            />
            <ListaImagenes imagenes={imagenesNuevo} setImagenes={setImagenesNuevo} />
          </div>

          {/* Descripción */}
          <div style={{ marginTop: 15 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Descripción corta <span style={{ color: '#9ca3af', fontWeight: 400 }}>(aparece en la tarjeta)</span></p>
            <textarea
              style={{ ...inS, minHeight: 50, resize: 'vertical' }}
              placeholder="Resumen corto del producto"
              value={nuevoP.descripcion}
              onChange={e => setNuevoP({ ...nuevoP, descripcion: e.target.value })}
            />
          </div>
          <div style={{ marginTop: 15 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Descripción larga <span style={{ color: '#9ca3af', fontWeight: 400 }}>(aparece en el detalle del producto)</span></p>
            <textarea
              style={{ ...inS, minHeight: 80, resize: 'vertical' }}
              placeholder="Descripción detallada: materiales, cuidados, tallas disponibles…"
              value={nuevoP.descripcion_larga}
              onChange={e => setNuevoP({ ...nuevoP, descripcion_larga: e.target.value })}
            />
          </div>

          <div style={{ marginTop: 15, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={crearProducto} disabled={subiendoImagen} style={{ backgroundColor: subiendoImagen ? '#9ca3af' : 'black', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: subiendoImagen ? 'not-allowed' : 'pointer', height: '42px', padding: '0 24px' }}>
              {subiendoImagen ? 'Subiendo...' : 'Guardar producto'}
            </button>

            <input style={{ ...inS, width: 200 }} placeholder="Nueva familia" value={nuevoFamiliaNombre} onChange={(e) => setNuevoFamiliaNombre(e.target.value)} />
            <button onClick={async () => {
              if (!nuevoFamiliaNombre.trim()) return alert('Nombre de familia vacío');
              if (!SUPABASE_URL || !SUPABASE_ANON) return alert('Supabase no configurado.');
              const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
              const { error, data } = await supabase.from('familias').insert([{ nombre: nuevoFamiliaNombre.trim() }]).select().single();
              if (error) return alert(error.message);
              setNuevoFamiliaNombre('');
              fetchFamilias();
              setNuevoP((np) => ({ ...np, familia_id: String(data.id) }));
            }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>Crear familia</button>
          </div>
        </div>

        {/* BUSCADOR + FILTROS */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search style={{ position: 'absolute', left: 15, top: 12, color: '#9ca3af' }} size={20} />
            <input style={{ ...inS, paddingLeft: '45px', height: '45px', backgroundColor: 'white' }} placeholder="Buscar por nombre o familia..." value={terminoBusqueda} onChange={e => setTerminoBusqueda(e.target.value)} />
          </div>
          <select value={filtroFamilia} onChange={e => setFiltroFamilia(e.target.value)}
            style={{ ...inS, height: 45, minWidth: 150, backgroundColor: 'white', cursor: 'pointer' }}>
            <option value="">Todas las familias</option>
            {familias.map(f => <option key={f.id} value={String(f.id)}>{f.nombre}</option>)}
          </select>
          <select value={sortAdmin} onChange={e => setSortAdmin(e.target.value)}
            style={{ ...inS, height: 45, minWidth: 170, backgroundColor: 'white', cursor: 'pointer' }}>
            <option value="newest">Más nuevos</option>
            <option value="discount_desc">Mayor descuento</option>
            <option value="discount_asc">Menor descuento</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="name_asc">Nombre: A-Z</option>
            <option value="name_desc">Nombre: Z-A</option>
          </select>
        </div>

        {/* TABLA */}
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
              {productosFiltrados.map(p => {
                const imgs = getImagenes(p);
                const idx = carouselIdx[p.id] || 0;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '15px 20px' }}>
                      {editandoId === p.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input style={inS} value={datosEdit?.nombre ?? ''} onChange={e => setDatosEdit({...datosEdit, nombre: e.target.value})} />
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>Imágenes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(la primera será la principal)</span></p>
                          <SelectorImagen
                            modo={modoImagenEdit} setModo={setModoImagenEdit}
                            urlInput={urlInputEdit} setUrlInput={setUrlInputEdit}
                            fileRef={fileInputEditRef} onAñadir={añadirImagenEdit} disabled={subiendoImagen}
                          />
                          <ListaImagenes imagenes={imagenesEdit} setImagenes={setImagenesEdit} />
                          {/* Descripción en edición */}
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Descripción corta <span style={{ color: '#9ca3af', fontWeight: 400 }}>(tarjeta)</span></span>
                            <textarea
                              style={{ ...inS, minHeight: 50, resize: 'vertical' }}
                              placeholder="Descripción corta"
                              value={datosEdit?.descripcion ?? ''}
                              onChange={e => setDatosEdit({ ...datosEdit, descripcion: e.target.value })}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Descripción larga <span style={{ color: '#9ca3af', fontWeight: 400 }}>(detalle)</span></span>
                            <textarea
                              style={{ ...inS, minHeight: 70, resize: 'vertical' }}
                              placeholder="Descripción detallada del producto"
                              value={datosEdit?.descripcion_larga ?? ''}
                              onChange={e => setDatosEdit({ ...datosEdit, descripcion_larga: e.target.value })}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, display: 'block', marginBottom: 4 }}>Precio tachado (€)</span>
                              <input style={inS} type="number" placeholder="0.00" value={datosEdit?.precio_tachado ?? ''} onChange={e => setDatosEdit({ ...datosEdit, precio_tachado: e.target.value })} />
                            </div>
                            <div>
                              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, display: 'block', marginBottom: 4 }}>Descuento %</span>
                              <input style={inS} type="number" min="0" max="99" placeholder="0" value={datosEdit?.descuento_pct ?? ''} onChange={e => setDatosEdit({ ...datosEdit, descuento_pct: e.target.value })} />
                            </div>
                          </div>
                          <VariantesEditor
                            productoId={p.id}
                            variantes={variantesPorProducto[p.id] || []}
                            onCambio={fetchProductos}
                            defaultOpen={true}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {/* Mini carousel */}
                          <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                            {imgs.length > 0 ? (
                              <>
                                <img src={imgs[idx]} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
                                {imgs.length > 1 && (
                                  <>
                                    <button onClick={() => setCarouselIdx(c => ({...c, [p.id]: (idx - 1 + imgs.length) % imgs.length}))} style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', background: 'white', border: '1px solid #e5e7eb', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                                      <ChevronLeft size={11} />
                                    </button>
                                    <button onClick={() => setCarouselIdx(c => ({...c, [p.id]: (idx + 1) % imgs.length}))} style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', background: 'white', border: '1px solid #e5e7eb', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                                      <ChevronRight size={11} />
                                    </button>
                                    <div style={{ position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3 }}>
                                      {imgs.map((_, i) => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: i === idx ? '#2563eb' : '#d1d5db' }} />)}
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <div style={{ width: 56, height: 56, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 10 }}>Sin img</div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.nombre}</span>
                            {imgs.length > 0 && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{imgs.length} imagen{imgs.length > 1 ? 'es' : ''}</div>}
                            <VariantesEditor
                              productoId={p.id}
                              variantes={variantesPorProducto[p.id] || []}
                              onCambio={fetchProductos}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editandoId === p.id ? (
                        <select style={inS} value={datosEdit?.familia_id ?? ''} onChange={e => setDatosEdit({...datosEdit, familia_id: e.target.value})}>
                          <option value="">-- Sin familia --</option>
                          {familias.map((f) => <option key={f.id} value={String(f.id)}>{f.nombre}</option>)}
                        </select>
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>{p.familias?.nombre || p.familia || 'General'}</span>
                      )}
                    </td>
                    <td>
                      {editandoId === p.id ? (
                        <input style={inS} type="number" value={datosEdit?.precio ?? ''} onChange={e => setDatosEdit({...datosEdit, precio: e.target.value === '' ? '' : parseFloat(e.target.value)})} />
                      ) : (
                        <div>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.precio}€</span>
                          {p.precio_tachado && Number(p.precio_tachado) > Number(p.precio) && (
                            <div style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{p.precio_tachado}€</div>
                          )}
                          {(p.descuento_pct > 0 || (p.precio_tachado > p.precio)) && (
                            <span style={{ fontSize: 10, background: '#fee2e2', color: '#ef4444', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>
                              -{p.descuento_pct > 0 ? p.descuento_pct : Math.round((1 - p.precio/p.precio_tachado)*100)}%
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        {editandoId === p.id ? (
                          <>
                            <button onClick={() => guardarEdicion(p.id)} style={{ color: '#10b981', border: 'none', background: 'none', cursor: 'pointer' }}><Check size={20}/></button>
                            <button onClick={() => { setEditandoId(null); setDatosEdit(null); setImagenesEdit([]); setUrlInputEdit(''); setModoImagenEdit('url'); }} style={{ color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer' }}><X size={20}/></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => {
                              const famId = p.familia_id ?? (familias.find(f => f.nombre === p.familia)?.id ?? '');
                              setEditandoId(p.id);
                              setDatosEdit({ ...p, familia_id: String(famId) });
                              setImagenesEdit(getImagenes(p));
                              setModoImagenEdit('url');
                              setUrlInputEdit('');
                            }} style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer' }}><Pencil size={18} /></button>
                            <button onClick={() => eliminarProducto(p.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {productosFiltrados.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No se encontraron productos.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const inS: React.CSSProperties = { width: '100%', padding: '10px 15px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px' };
