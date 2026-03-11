'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';

const IAS = [
  { value: 'gemini', label: 'Gemini 1.5 Flash', badge: 'Google', color: '#4285f4' },
];


export default function GeneradorDescripcionIA({
  imagenUrl,
  onDescripcion,
}: {
  imagenUrl: string | null;
  onDescripcion: (desc: string) => void;
}) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const generar = async () => {
    if (!imagenUrl) return;
    setGenerando(true);
    setError('');
    setExito(false);
    try {
      const res = await fetch('/api/ia/describir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Error desconocido');
      } else {
        onDescripcion(data.descripcion);
        setExito(true);
        setTimeout(() => setExito(false), 2000);
      }
    } catch (e: any) {
      setError(e.message || 'Error de red');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Botón generar */}
        <button
          onClick={generar}
          disabled={!imagenUrl || generando}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            borderRadius: 10, border: 'none', cursor: !imagenUrl || generando ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 700,
            background: exito ? '#10b981' : !imagenUrl ? '#e5e7eb' : 'linear-gradient(135deg, #4285f4, #6366f1)',
            color: !imagenUrl ? '#9ca3af' : 'white',
            transition: 'all 0.2s',
          }}
        >
          {generando ? <Loader2 size={13} className="animate-spin" /> : exito ? <Check size={13} /> : <Sparkles size={13} />}
          {generando ? 'Generando...' : exito ? '¡Listo!' : '✨ Describir con IA'}
        </button>

        {!imagenUrl && (
          <span style={{ fontSize: 11, color: '#9ca3af' }}>Añade una imagen primero</span>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  );
}
