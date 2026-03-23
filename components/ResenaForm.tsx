'use client';

import { useState, useRef } from 'react';
import { Star, Camera, X, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/context/ToastContext';

interface ResenaInicial {
  id: string;
  valoracion: number;
  comentario: string | null;
  foto_url: string | null;
}

interface ResenaFormProps {
  productoId: string;
  clienteId: string;
  pedidoId?: string;
  resenaInicial?: ResenaInicial | null;
  onResenaCreada: () => void;
  onCancelar?: () => void;
}

export default function ResenaForm({ productoId, clienteId, pedidoId, resenaInicial, onResenaCreada, onCancelar }: ResenaFormProps) {
  const modoEdicion = !!resenaInicial;

  const [valoracion, setValoracion] = useState(resenaInicial?.valoracion ?? 0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState(resenaInicial?.comentario ?? '');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(resenaInicial?.foto_url ?? null);
  const [fotoUrlActual, setFotoUrlActual] = useState<string | null>(resenaInicial?.foto_url ?? null);
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast({ message: 'La foto no puede superar 5 MB', type: 'error' });
      return;
    }
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const quitarFoto = () => {
    setFoto(null);
    setFotoPreview(null);
    setFotoUrlActual(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valoracion === 0) {
      addToast({ message: 'Selecciona una valoración de 1 a 5 estrellas', type: 'error' });
      return;
    }

    setEnviando(true);
    try {
      let fotoUrl: string | null = fotoUrlActual;

      // Subir nueva foto si se seleccionó una
      if (foto && SUPABASE_URL && SUPABASE_ANON) {
        const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
        const ext = foto.name.split('.').pop();
        const path = `${clienteId}/${productoId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('resenas-fotos')
          .upload(path, foto, { upsert: false });

        if (uploadError) {
          addToast({ message: 'Error al subir la foto: ' + uploadError.message, type: 'error' });
          setEnviando(false);
          return;
        }

        const { data: urlData } = supabase.storage.from('resenas-fotos').getPublicUrl(path);
        fotoUrl = urlData.publicUrl;
      }

      if (modoEdicion && resenaInicial) {
        const res = await fetch('/api/resenas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: resenaInicial.id, clienteId, valoracion, comentario, fotoUrl }),
        });
        const json = await res.json();
        if (!res.ok) {
          addToast({ message: json.error || 'Error al guardar la reseña', type: 'error' });
          return;
        }
        addToast({ message: '¡Reseña actualizada!', type: 'success' });
      } else {
        const res = await fetch('/api/resenas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productoId, clienteId, pedidoId, valoracion, comentario, fotoUrl }),
        });
        const json = await res.json();
        if (!res.ok) {
          addToast({ message: json.error || 'Error al enviar la reseña', type: 'error' });
          return;
        }
        addToast({ message: '¡Reseña publicada! Gracias por tu opinión', type: 'success' });
      }

      onResenaCreada();
    } catch (err: any) {
      addToast({ message: err?.message || 'Error inesperado', type: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-2xl p-5 flex flex-col gap-4">
      <h3 className="font-black text-slate-800 text-base">
        {modoEdicion ? 'Editar tu reseña' : 'Escribe tu reseña'}
      </h3>

      {/* Estrellas */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setValoracion(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={
                n <= (hover || valoracion)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-200 text-slate-200'
              }
            />
          </button>
        ))}
        {valoracion > 0 && (
          <span className="ml-2 text-sm text-slate-500 self-center">
            {['', 'Muy malo', 'Malo', 'Normal', 'Bueno', 'Excelente'][valoracion]}
          </span>
        )}
      </div>

      {/* Comentario */}
      <textarea
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        placeholder="Cuéntanos tu experiencia con el producto (opcional)"
        rows={3}
        className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />

      {/* Foto */}
      <div>
        {fotoPreview ? (
          <div className="relative w-24 h-24">
            <img
              src={fotoPreview}
              alt="Vista previa"
              className="w-24 h-24 object-cover rounded-xl border border-slate-200"
            />
            <button
              type="button"
              onClick={quitarFoto}
              className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-dashed border-slate-300 rounded-xl px-4 py-2.5 transition-colors"
          >
            <Camera size={16} /> {modoEdicion ? 'Cambiar foto (opcional)' : 'Añadir foto (opcional)'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFotoChange}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={enviando || valoracion === 0}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          {enviando && <Loader2 size={14} className="animate-spin" />}
          {enviando ? 'Guardando…' : modoEdicion ? 'Guardar cambios' : 'Publicar reseña'}
        </button>

        {modoEdicion && onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
