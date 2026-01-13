import fs from 'fs';
// Use global fetch (Node 18+). Remove node-fetch dependency.

let SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const u = envText.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*"?(.*?)"?\s*$/m);
  const k = envText.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?(.*?)"?\s*$/m);
  if (u) SUPABASE_URL = u[1];
  if (k) SERVICE_KEY = k[1];
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Supabase config missing');
  process.exit(1);
}

const test = async (q) => {
  const base = `${SUPABASE_URL}/rest/v1/productos`;
  const select = '*,familias(nombre)';
  // try with | separators instead of commas
  const inner = `(${`nombre.ilike.*${q}*|descripcion.ilike.*${q}*|familias.nombre.ilike.*${q}*|categoria.ilike.*${q}*`})`;
  const urlOr = `${base}?select=${encodeURIComponent(select)}&or=${encodeURIComponent(inner)}&limit=10`;

  // direct filter on nombre (no or) for comparison
  const urlNombre = `${base}?select=${encodeURIComponent(select)}&nombre=ilike.*${encodeURIComponent(q)}*&limit=10`;
  const urlFamilia = `${base}?select=${encodeURIComponent(select)}&familias.nombre=ilike.*${encodeURIComponent(q)}*&limit=10`;

  console.log('\nQuery:', q);
  console.log('URL (or):', urlOr);
  console.log('URL (nombre):', urlNombre);
  console.log('URL (familia):', urlFamilia);

  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

  const rOr = await fetch(urlOr, { headers });
  console.log('OR Status', rOr.status);
  const txtOr = await rOr.text().catch(()=>null);
  try{ console.log('OR JSON:', JSON.parse(txtOr)); }catch(e){ console.log('OR Body:', txtOr); }

  const rNom = await fetch(urlNombre, { headers });
  console.log('Nombre Status', rNom.status);
  const txtNom = await rNom.text().catch(()=>null);
  try{ console.log('Nombre JSON:', JSON.parse(txtNom)); }catch(e){ console.log('Nombre Body:', txtNom); }

  const rFam = await fetch(urlFamilia, { headers });
  console.log('Familia Status', rFam.status);
  const txtFam = await rFam.text().catch(()=>null);
  try{ console.log('Familia JSON:', JSON.parse(txtFam)); }catch(e){ console.log('Familia Body:', txtFam); }
}

(async () => {
  await test('pr');
  await test('prueba 1');
  await test('prueba');
  await test('General');
})();