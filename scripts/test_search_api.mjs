const host = process.env.LOCAL_HOST || 'http://localhost:3000';
const qs = ['pr', 'prueba', 'General', ''];
(async ()=>{
  for (const q of qs) {
    const url = `${host}/api/search${q ? `?q=${encodeURIComponent(q)}` : ''}`;
    console.log('\nCalling', url);
    const r = await fetch(url);
    console.log('Status', r.status);
    try{ const json = await r.json(); console.log('JSON:', (json.items || []).slice(0,5)); }catch(e){ console.log('Body parse failed'); }
  }
})();