'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Eye, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type SyncResult = {
  ok?: boolean;
  error?: string;
  creados?: number;
  actualizados?: number;
  errores?: number;
  detalles?: string[];
  shop?: string;
  total?: number;
  preview?: any[];
};

export default function SyncEtsyPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [mode, setMode] = useState<'preview' | 'sync' | null>(null);

  async function handlePreview() {
    setLoading(true);
    setMode('preview');
    setResult(null);
    const res = await fetch('/api/admin/sync-etsy');
    setResult(await res.json());
    setLoading(false);
  }

  async function handleSync() {
    if (!confirm('¿Sincronizar ahora? Se crearán o actualizarán productos desde Etsy en Supabase.')) return;
    setLoading(true);
    setMode('sync');
    setResult(null);
    const res = await fetch('/api/admin/sync-etsy', { method: 'POST' });
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">

        <header className="mb-8">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 mb-4">
            <ArrowLeft size={16} /> Volver al Panel
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Sincronizar con Etsy</h1>
          <p className="text-gray-600 text-sm">
            Importa automáticamente tus productos activos de Etsy a esta tienda.
          </p>
        </header>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          <strong>¿Cómo funciona?</strong> Esta sincronización lee los productos activos de tu tienda Etsy
          y los crea o actualiza en Supabase. Los productos que ya existen se actualizan (nombre, precio, imagen).
          Los nuevos se crean automáticamente. Nunca se borran productos de Supabase.
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:border-gray-400 disabled:opacity-50 transition"
          >
            {loading && mode === 'preview' ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
            Vista previa
          </button>

          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition"
          >
            {loading && mode === 'sync' ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            Sincronizar ahora
          </button>
        </div>

        {/* Resultado */}
        {result && (
          <div className={`rounded-xl border p-5 ${result.error ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            {result.error ? (
              <div className="flex items-start gap-3 text-red-700">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{result.error}</p>
                  {result.error.includes('ETSY_API_KEY') && (
                    <p className="text-xs mt-2 text-red-600">
                      Añade <code className="bg-red-100 px-1 rounded">ETSY_API_KEY=tu_clave</code> en el archivo <code>.env.local</code> y reinicia el servidor.
                    </p>
                  )}
                </div>
              </div>
            ) : mode === 'preview' ? (
              <div>
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-3">
                  <CheckCircle size={18} /> Tienda: {result.shop} — {result.total} productos activos
                </div>
                <p className="text-xs text-gray-500 mb-2">Primeros 5 productos:</p>
                <ul className="space-y-2">
                  {result.preview?.map((p: any, i: number) => (
                    <li key={i} className="text-sm flex justify-between border-b pb-1">
                      <span className="truncate max-w-xs">{p.nombre}</span>
                      <span className="font-mono text-gray-600">€{p.precio.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-start gap-3 text-green-700">
                <CheckCircle size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Sincronización completada</p>
                  <p className="text-sm">Creados: <strong>{result.creados}</strong></p>
                  <p className="text-sm">Actualizados: <strong>{result.actualizados}</strong></p>
                  {(result.errores ?? 0) > 0 && (
                    <p className="text-sm text-red-600">Errores: <strong>{result.errores}</strong></p>
                  )}
                  {result.detalles && result.detalles.length > 0 && (
                    <ul className="mt-2 text-xs text-red-500 list-disc list-inside">
                      {result.detalles.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
