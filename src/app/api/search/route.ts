import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: Request) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'Missing SUPABASE config' }, { status: 500 });
  }

  const urlObj = new URL(req.url);
  const q = (urlObj.searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || '1'));
  const limit = Math.max(1, Math.min(100, parseInt(urlObj.searchParams.get('limit') || '12')));

  const select = '*,familias(nombre)';
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

  // No query -> return recent products
  if (!q) {
    const url = `${SUPABASE_URL}/rest/v1/productos?select=${encodeURIComponent(select)}&limit=${limit}&order=created_at.desc`;
    const r = await fetch(url, { headers });
    if (!r.ok) return NextResponse.json({ error: 'Failed to fetch' }, { status: r.status });
    const items = await r.json();
    return NextResponse.json({ items, total: items.length });
  }

  // Helper to fetch by filter
  const fetchFilter = async (filter: string) => {
    const url = `${SUPABASE_URL}/rest/v1/productos?select=${encodeURIComponent(select)}&${filter}&limit=${limit * 4}`;
    const r = await fetch(url, { headers });
    if (!r.ok) return [];
    return await r.json();
  };

  const qEsc = encodeURIComponent(q);
  const filters = [
    `nombre=ilike.*${qEsc}*`,
    `familias.nombre=ilike.*${qEsc}*`,
    `descripcion=ilike.*${qEsc}*`,
    `categoria=ilike.*${qEsc}*`,
  ];

  // run in parallel
  const [byNombre, byFamilia, byDesc, byCategoria] = await Promise.all(filters.map(f => fetchFilter(f)));

  // merge with dedupe preserving priority order
  const map = new Map();
  const push = (arr: any[]) => arr.forEach(it => { if (it && !map.has(it.id)) map.set(it.id, it); });
  push(byNombre); push(byFamilia); push(byDesc); push(byCategoria);

  const merged = Array.from(map.values());
  const total = merged.length;
  const start = (page - 1) * limit;
  const items = merged.slice(start, start + limit);

  // Ensure each item has familias populated; if missing, fetch familia names by familia_id
  const missingIds = Array.from(new Set(items.filter(it => (!it.familias || it.familias === null) && it.familia_id).map(it => it.familia_id)));
  if (missingIds.length > 0) {
    try {
      const idsParam = missingIds.join(',');
      const famUrl = `${SUPABASE_URL}/rest/v1/familias?id=in.(${idsParam})&select=id,nombre`;
      const rf = await fetch(famUrl, { headers });
      if (rf.ok) {
        const fams = await rf.json();
        const famMap = new Map(fams.map((f: any) => [f.id, f.nombre]));
        items.forEach((it: any) => {
          if ((!it.familias || it.familias === null) && it.familia_id && famMap.has(it.familia_id)) {
            it.familias = { nombre: famMap.get(it.familia_id) };
          }
        });
      }
    } catch (e) {
      // Ignore errors; we still return items without familias
      console.error('Failed to fetch familias map', e);
    }
  }

  return NextResponse.json({ items, total });
}