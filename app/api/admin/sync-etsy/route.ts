import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const ETSY_API_KEY = process.env.ETSY_API_KEY;
const ETSY_SHOP_NAME = process.env.ETSY_SHOP_NAME || 'BabyTatiSewingShop';

function getSupabase() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error('Faltan variables de Supabase');
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

async function fetchEtsy(path: string) {
  const res = await fetch(`https://openapi.etsy.com/v3/application/${path}`, {
    headers: { 'x-api-key': ETSY_API_KEY! },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Etsy API ${res.status}: ${text}`);
  }
  return res.json();
}

// GET /api/admin/sync-etsy → previsualizar sin guardar
export async function GET() {
  try {
    if (!ETSY_API_KEY) {
      return Response.json({ error: 'ETSY_API_KEY no configurada en .env.local' }, { status: 503 });
    }

    // 1. Obtener shop_id por nombre
    const shopData = await fetchEtsy(`shops?shop_name=${ETSY_SHOP_NAME}`);
    const shop = shopData.results?.[0];
    if (!shop) return Response.json({ error: `Tienda '${ETSY_SHOP_NAME}' no encontrada` }, { status: 404 });

    // 2. Obtener listings activos (máx 100)
    const listings = await fetchEtsy(
      `shops/${shop.shop_id}/listings/active?limit=100&includes=Images,MainImage`
    );

    const productos = (listings.results || []).map((l: any) => ({
      etsy_listing_id: String(l.listing_id),
      nombre: l.title,
      descripcion: l.description?.slice(0, 300) || '',
      precio: parseFloat(l.price?.amount) / (l.price?.divisor || 100),
      imagen_url: l.images?.[0]?.url_570xN || l.main_image?.url_570xN || null,
    }));

    return Response.json({ shop: shop.shop_name, total: productos.length, preview: productos.slice(0, 5) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/admin/sync-etsy → sincronizar Etsy → Supabase
export async function POST() {
  try {
    if (!ETSY_API_KEY) {
      return Response.json({ error: 'ETSY_API_KEY no configurada en .env.local' }, { status: 503 });
    }

    const supabase = getSupabase();

    // 1. Obtener shop_id
    const shopData = await fetchEtsy(`shops?shop_name=${ETSY_SHOP_NAME}`);
    const shop = shopData.results?.[0];
    if (!shop) return Response.json({ error: `Tienda '${ETSY_SHOP_NAME}' no encontrada` }, { status: 404 });

    // 2. Obtener listings activos con imágenes
    const listings = await fetchEtsy(
      `shops/${shop.shop_id}/listings/active?limit=100&includes=Images,MainImage`
    );

    const resultados = { creados: 0, actualizados: 0, errores: 0, detalles: [] as string[] };

    for (const l of listings.results || []) {
      const etsy_id = String(l.listing_id);
      const precio = parseFloat(l.price?.amount) / (l.price?.divisor || 100);
      const imagen = l.images?.[0]?.url_570xN || l.main_image?.url_570xN || null;

      const payload = {
        nombre: l.title,
        descripcion: l.description?.slice(0, 300) || '',
        descripcion_larga: l.description || '',
        precio,
        imagen_url: imagen,
        etsy_listing_id: etsy_id,
      };

      // Buscar si ya existe por etsy_listing_id
      const { data: existing } = await supabase
        .from('productos')
        .select('id')
        .eq('etsy_listing_id', etsy_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('productos').update(payload).eq('id', existing.id);
        if (error) { resultados.errores++; resultados.detalles.push(`ERROR update ${etsy_id}: ${error.message}`); }
        else resultados.actualizados++;
      } else {
        const { error } = await supabase.from('productos').insert(payload);
        if (error) { resultados.errores++; resultados.detalles.push(`ERROR insert ${etsy_id}: ${error.message}`); }
        else resultados.creados++;
      }
    }

    return Response.json({ ok: true, ...resultados });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
