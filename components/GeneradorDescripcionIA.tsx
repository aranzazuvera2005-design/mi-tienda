'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, ChevronDown, Check, AlertCircle } from 'lucide-react';

const IAS = [
  { value: 'gemini', label: 'Gemini 1.5 Flash', badge: 'Google', color: '#4285f4' },
  { value: 'openai', label: 'GPT-4o mini', badge: 'OpenAI', color: '#10a37f' },
  { value: 'claude', label: 'Claude Haiku', badge: 'Anthropic', color: '#c96442' },
];

const LS_KEY = 'admin_ia_preferida';

export default function GeneradorDescripcionIA({
  imagenUrl,
  onDescripcion,
}: {
  imagenUrl: string | null;
  onDescripcion: (desc: string) => void;
}) {
  const [iaSeleccionada, setIaSeleccionada] = useState('gemini');
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [abierto, setAbierto] = useState(false);

  // Persistir selección de IA
  useEffect(() => {
    const guardada = localStorage.getItem(LS_KEY);
    if (guardada) setIaSeleccionada(guardada);
  }, []);

  const seleccionarIA = (val: string) => {
    setIaSeleccionada(val);
    localStorage.setItem(LS_KEY, val);
    setAbierto(false);
  };

  const generar = async () => {
    if (!imagenUrl) return;
    setGenerando(true);
    setError('');
    setExito(false);
    try {
      const res = await fetch('/api/ia/describir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenUrl, ia: iaSeleccionada }),
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

  const iaActual = IAS.find(i => i.value === iaSeleccionada)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Selector de IA */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAbierto(!abierto)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: iaActual.color, display: 'inline-block' }} />
            {iaActual.badge} · {iaActual.label}
            <ChevronDown size={12} />
          </button>
          {abierto && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 6, zIndex: 50, minWidth: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              {IAS.map(ia => (
                <button key={ia.value} onClick={() => seleccionarIA(ia.value)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: iaSeleccionada === ia.value ? '#f3f4f6' : 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'left' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ia.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{ia.badge} · {ia.label}</span>
                  {iaSeleccionada === ia.value && <Check size={12} color="#10b981" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón generar */}
        <button
          onClick={generar}
          disabled={!imagenUrl || generando}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            borderRadius: 10, border: 'none', cursor: !imagenUrl || generando ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 700,
            background: exito ? '#10b981' : !imagenUrl ? '#e5e7eb' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: !imagenUrl ? '#9ca3af' : 'white',
            transition: 'all 0.2s',
          }}
        >
          {generando ? <Loader2 size={13} className="animate-spin" /> : exito ? <Check size={13} /> : <Sparkles size={13} />}
          {generando ? 'Generando...' : exito ? '¡Listo!' : 'Generar descripción con IA'}
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
