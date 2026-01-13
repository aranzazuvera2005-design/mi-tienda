"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Toast = { id: string; message: string; type?: 'success' | 'error' | 'info'; duration?: number };

type ToastContextValue = {
  addToast: (toast: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const item: Toast = { id, ...toast };
    setToasts((t) => [item, ...t]);
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ minWidth: 240, padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', background: t.type === 'error' ? '#fee2e2' : t.type === 'success' ? '#dcfce7' : '#eef2ff', color: '#111827' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t.type?.toUpperCase() || 'INFO'}</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
