import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  // try reading .env.local
  try {
    const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    const u = envText.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*"?(.*?)"?\s*$/m);
    const k = envText.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?(.*?)"?\s*$/m);
    if (u) SUPABASE_URL = u[1];
    if (k) SERVICE_KEY = k[1];
  } catch (e) {
    // ignore
  }
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set (check environment or .env.local)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

(async () => {
  try {
    console.log('Fetching distinct familia names from productos...');
    let productos = [];
    try {
      const { data: prodSelect, error: pErr } = await supabase
        .from('productos')
        .select('id, familia')
        .limit(10000);

      if (pErr) throw pErr;
      productos = prodSelect || [];

      const familiasSet = new Set();
      productos.forEach((p) => {
        const f = (p.familia || 'General').toString().trim();
        if (f) familiasSet.add(f);
      });

      const familias = Array.from(familiasSet);
      console.log('Found familias:', familias);

      // Insert familias
      for (const nombre of familias) {
        const { data, error } = await supabase.from('familias').insert([{ nombre }]).select().maybeSingle();
        if (error) {
          if (error.code === '23505') { // unique violation
            console.log('Familia ya existe:', nombre);
          } else {
            console.error('Error inserting familia', nombre, error);
          }
        } else {
          console.log('Inserted familia:', data?.nombre || nombre);
        }
      }

      // Fetch all familias id map
      const { data: allFamilias } = await supabase.from('familias').select('id, nombre');
      const map = {};
      (allFamilias || []).forEach((f) => { map[f.nombre] = f.id; });

      // Update productos to set familia_id
      console.log('Updating productos to set familia_id...');
      for (const p of productos) {
        const nombre = (p.familia || 'General').toString().trim();
        const id = map[nombre];
        if (id) {
          const { error } = await supabase.from('productos').update({ familia_id: id }).eq('id', p.id);
          if (error) console.error('Error updating producto', p.id, error.message);
        }
      }

      console.log('Backfill terminado.');
    } catch (e) {
      // If the error indicates 'familia' column doesn't exist, fall back to creating 'General' family and assigning it
      if (e?.message && e.message.toLowerCase().includes('column') && e.message.toLowerCase().includes('familia')) {
        console.log("Column 'familia' not present — creating 'General' and assigning to products without familia_id");
        const { error: ie } = await supabase.from('familias').insert([{ nombre: 'General' }]);
        if (ie) console.error('Error inserting General familia:', ie.message || ie);
        const { data: allFamilias } = await supabase.from('familias').select('id, nombre');
        const gen = (allFamilias || []).find((f) => f.nombre === 'General');
        if (gen) {
          const { error: uErr } = await supabase.from('productos').update({ familia_id: gen.id }).is('familia_id', null);
          if (uErr) console.error('Error updating productos to General:', uErr.message || uErr);
          else console.log('Assigned General to productos without familia_id');
        }
      } else {
        throw e;
      }
    }
  } catch (e) {
    console.error('Backfill error:', e);
    process.exit(1);
  }
})();