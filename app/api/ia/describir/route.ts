import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { imagenUrl, ia } = await req.json();

  if (!imagenUrl || !ia) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  const prompt = `Eres un experto en copywriting para tiendas online. Analiza esta imagen de producto y escribe una descripción atractiva y concisa (máximo 2 frases, unos 30-50 palabras) en español. Destaca los materiales, uso y beneficios principales. Sé directo y persuasivo, sin emojis.`;

  try {
    if (ia === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 });

      const imgRes = await fetch(imagenUrl);
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]}]
        })
      });
      const data = await res.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!texto) return NextResponse.json({ error: data.error?.message || 'Sin respuesta de Gemini' }, { status: 500 });
      return NextResponse.json({ descripcion: texto.trim() });
    }

    if (ia === 'openai') {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 });

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 150,
          messages: [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imagenUrl, detail: 'low' } }
          ]}]
        })
      });
      const data = await res.json();
      const texto = data.choices?.[0]?.message?.content;
      if (!texto) return NextResponse.json({ error: data.error?.message || 'Sin respuesta de OpenAI' }, { status: 500 });
      return NextResponse.json({ descripcion: texto.trim() });
    }

    if (ia === 'claude') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 });

      const imgRes = await fetch(imagenUrl);
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = (imgRes.headers.get('content-type') || 'image/jpeg') as any;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: prompt }
          ]}]
        })
      });
      const data = await res.json();
      const texto = data.content?.[0]?.text;
      if (!texto) return NextResponse.json({ error: data.error?.message || 'Sin respuesta de Claude' }, { status: 500 });
      return NextResponse.json({ descripcion: texto.trim() });
    }

    return NextResponse.json({ error: 'IA no reconocida' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
