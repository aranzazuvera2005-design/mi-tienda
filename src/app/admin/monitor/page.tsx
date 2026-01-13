'use client';

import { createBrowserClient } from '@supabase/ssr';
// ... tus otros imports ...

// DEFINE LOS ESTILOS AQUÍ ARRIBA (Antes de la función MonitorPedidos)
const cardS = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '20px', 
  backgroundColor: 'white', 
  padding: '30px', 
  borderRadius: '24px', 
  textDecoration: 'none', 
  color: 'black', 
  border: '1px solid #e5e7eb', 
  transition: 'transform 0.2s', 
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' 
};

const iconBoxS = { 
  backgroundColor: '#f3f4f6', 
  padding: '20px', 
  borderRadius: '18px' 
};

export default function MonitorPedidos() {
  // ... resto del código del monitor ...
}