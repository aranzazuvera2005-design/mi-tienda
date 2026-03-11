'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Check, Store, Truck, CreditCard, RefreshCw, XCircle, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// ─── Medios de pago disponibles ──────────────────────────────────────────────
const MEDIOS_PAGO_DISPONIBLES = [
  { id: 'visa',       label: 'Visa',        svg: <svg viewBox="0 0 48 48" width="36" height="22"><rect width="48" height="48" rx="6" fill="#1A1F71"/><text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial">VISA</text></svg> },
  { id: 'mastercard', label: 'Mastercard',  svg: <svg viewBox="0 0 48 48" width="36" height="22"><rect width="48" height="48" rx="6" fill="#252525"/><circle cx="18" cy="24" r="12" fill="#EB001B"/><circle cx="30" cy="24" r="12" fill="#F79E1B"/><path d="M24 14.7a12 12 0 0 1 0 18.6A12 12 0 0 1 24 14.7z" fill="#FF5F00"/></svg> },
  { id: 'amex',       label: 'Amex',        svg: <svg viewBox="0 0 48 48" width="36" height="22"><rect width="48" height="48" rx="6" fill="#2E77BC"/><text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">AMEX</text></svg> },
  { id: 'paypal',     label: 'PayPal',      svg: <svg viewBox="0 0 48 48" width="36" height="22"><rect width="48" height="48" rx="6" fill="#003087"/><text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">PayPal</text></svg> },
  { id: 'bizum',      label: 'Bizum',       svg: <svg viewBox="0 0 48 48" width="36" height="22"><rect width="48" height="48" rx="6" fill="#0085CB"/><text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">Bizum</text></svg> },
  { id: 'transferencia', label: 'Transferencia', svg: <svg viewBox="0 0 48 48" width="36" height="22"><rect width="48" height="48" rx="6" fill="#374151"/><text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">BANK</text></svg> },
  { id: 'contrareembolso', label: 'Contrareembolso', svg: <svg viewBox="0 0 48 48" width="36" height="22"><rect width="48" height="48" rx="6" fill="#059669"/><text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">COD</text></svg> },
  { id: 'stripe',     label: 'Stripe',      svg: <svg viewBox="0 0 48 48" width="36" height="22"><rect width="48" height="48" rx="6" fill="#635BFF"/><text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">stripe</text></svg> },
];

// ─── Estado inicial ───────────────────────────────────────────────────────────
const DEFAULTS = {
  nombre_tienda: '',
  descripcion_tienda: '',
  email_contacto: '',
  telefono_contacto: '',
  politica_envio: 'Los pedidos se procesan en 1-2 días hábiles. El envío estándar tarda entre 3-5 días hábiles en llegar a su destino.',
  info_aduanas: 'Los compradores son responsables de cualquier arancel o tasa de importación aplicable según las normativas de su país.',
  medios_pago: ['visa', 'mastercard', 'paypal', 'bizum'],
  politica_devoluciones: 'Aceptamos devoluciones dentro de los 14 días posteriores a la recepción del pedido. El artículo debe estar en su estado original.',
  politica_cancelaciones: 'Las cancelaciones se aceptan dentro de las 24 horas posteriores a la compra.',
  politica_privacidad: '',
};

type Politica = typeof DEFAULTS;

// ─── Sección colapsable ───────────────────────────────────────────────────────
function Seccion({ titulo, icono, children, defaultOpen = true }: { titulo: string; icono: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [abierta, setAbierta] = useState(defaultOpen);
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
      <button onClick={() => setAbierta(!abierta)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#f3f4f6' }}>{icono}</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{titulo}</span>
        </div>
        {abierta ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
      </button>
      {abierta && <div style={{ padding: '0 24px 24px' }}>{children}</div>}
    </div>
  );
}

const tA = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, lineHeight: 1.6, resize: 'vertical' as const, fontFamily: 'inherit', outline: 'none', minHeight: 80 };
const inp = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const };
const lbl = { fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, display: 'block' as const };

export default function PoliticaTiendaPage() {
  const [datos, setDatos] = useState<Politica>(DEFAULTS);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  // ─── Cargar de Supabase ─────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from('configuracion_tienda').select('*').eq('clave', 'politica').single();
      if (data?.valor) setDatos({ ...DEFAULTS, ...data.valor });
      setCargando(false);
    };
    cargar();
  }, []);

  // ─── Guardar ────────────────────────────────────────────────────────────────
  const guardar = async () => {
    setGuardando(true); setError('');
    const { error: err } = await supabase.from('configuracion_tienda').upsert({ clave: 'politica', valor: datos, updated_at: new Date().toISOString() }, { onConflict: 'clave' });
    setGuardando(false);
    if (err) { setError(err.message); return; }
    setExito(true); setTimeout(() => setExito(false), 2500);
  };

  const set = (campo: keyof Politica, val: any) => setDatos(d => ({ ...d, [campo]: val }));

  const toggleMedio = (id: string) => {
    setDatos(d => ({
      ...d,
      medios_pago: d.medios_pago.includes(id) ? d.medios_pago.filter(m => m !== id) : [...d.medios_pago, id]
    }));
  };

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} color="#9ca3af" />
    </div>
  );

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Volver al panel
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: 0 }}>Política de la Tienda</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Información legal, envíos, pagos y devoluciones que verán tus clientes.</p>
          </div>
          <button onClick={guardar} disabled={guardando}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, border: 'none', cursor: guardando ? 'wait' : 'pointer', fontWeight: 700, fontSize: 14,
              background: exito ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', transition: 'all 0.2s' }}>
            {guardando ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : exito ? <Check size={16} /> : <Save size={16} />}
            {guardando ? 'Guardando...' : exito ? '¡Guardado!' : 'Guardar cambios'}
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {/* ── 1. Información general ── */}
        <Seccion titulo="Información de la tienda" icono={<Store size={18} color="#6366f1" />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Nombre de la tienda</label>
              <input style={inp} value={datos.nombre_tienda} onChange={e => set('nombre_tienda', e.target.value)} placeholder="Ej: Mi Tienda Artesanal" />
            </div>
            <div>
              <label style={lbl}>Email de contacto</label>
              <input style={inp} type="email" value={datos.email_contacto} onChange={e => set('email_contacto', e.target.value)} placeholder="hola@mitienda.com" />
            </div>
            <div>
              <label style={lbl}>Teléfono de contacto</label>
              <input style={inp} value={datos.telefono_contacto} onChange={e => set('telefono_contacto', e.target.value)} placeholder="+34 600 000 000" />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={lbl}>Descripción / Lema de la tienda</label>
            <textarea style={tA} value={datos.descripcion_tienda} onChange={e => set('descripcion_tienda', e.target.value)} placeholder="Cuéntale a tus clientes quién eres y qué vendes..." />
          </div>
        </Seccion>

        {/* ── 2. Envío ── */}
        <Seccion titulo="Envío y aranceles" icono={<Truck size={18} color="#f59e0b" />}>
          <label style={lbl}>Política de envío</label>
          <textarea style={tA} value={datos.politica_envio} onChange={e => set('politica_envio', e.target.value)} />
          <label style={{ ...lbl, marginTop: 16 }}>Aranceles y derechos de aduana</label>
          <textarea style={{ ...tA, minHeight: 60 }} value={datos.info_aduanas} onChange={e => set('info_aduanas', e.target.value)} />
        </Seccion>

        {/* ── 3. Medios de pago ── */}
        <Seccion titulo="Opciones de pago" icono={<CreditCard size={18} color="#10b981" />}>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>Selecciona los métodos de pago que aceptas. Puedes activar o desactivar cualquiera en cualquier momento.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {MEDIOS_PAGO_DISPONIBLES.map(m => {
              const activo = datos.medios_pago.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggleMedio(m.id)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 12,
                    border: activo ? '2px solid #6366f1' : '2px solid #e5e7eb',
                    background: activo ? '#eef2ff' : 'white', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', minWidth: 70 }}>
                  {activo && <div style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="white" /></div>}
                  {m.svg}
                  <span style={{ fontSize: 10, fontWeight: 600, color: activo ? '#6366f1' : '#6b7280' }}>{m.label}</span>
                </button>
              );
            })}
          </div>
          {datos.medios_pago.length === 0 && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 10 }}>⚠️ Selecciona al menos un método de pago</p>
          )}
        </Seccion>

        {/* ── 4. Devoluciones ── */}
        <Seccion titulo="Cambios y devoluciones" icono={<RefreshCw size={18} color="#3b82f6" />}>
          <textarea style={tA} value={datos.politica_devoluciones} onChange={e => set('politica_devoluciones', e.target.value)} />
        </Seccion>

        {/* ── 5. Cancelaciones ── */}
        <Seccion titulo="Cancelaciones" icono={<XCircle size={18} color="#ef4444" />}>
          <textarea style={{ ...tA, minHeight: 60 }} value={datos.politica_cancelaciones} onChange={e => set('politica_cancelaciones', e.target.value)} />
        </Seccion>

        {/* ── 6. Privacidad ── */}
        <Seccion titulo="Política de privacidad" icono={<Shield size={18} color="#8b5cf6" />} defaultOpen={false}>
          <textarea style={tA} value={datos.politica_privacidad} onChange={e => set('politica_privacidad', e.target.value)} placeholder="Indica cómo tratas los datos personales de tus clientes..." />
        </Seccion>

        {/* Botón inferior */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, paddingBottom: 40 }}>
          <button onClick={guardar} disabled={guardando}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: 'none', cursor: guardando ? 'wait' : 'pointer', fontWeight: 700, fontSize: 14,
              background: exito ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
            {guardando ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : exito ? <Check size={16} /> : <Save size={16} />}
            {guardando ? 'Guardando...' : exito ? '¡Guardado!' : 'Guardar todos los cambios'}
          </button>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
