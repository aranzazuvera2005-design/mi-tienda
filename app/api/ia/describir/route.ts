import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { imagenUrl } = await req.json();

  if (!imagenUrl) {
    return NextResponse.json({ error: 'Falta la URL de la imagen' }, { status: 400 });
  }

  const prompt = `Eres un experto en copywriting para tiendas online. Analiza esta imagen de producto y escribe una descripción atractiva y concisa (máximo 2 frases, unos 30-50 palabras) en español. Destaca los materiales, uso y beneficios principales. Sé directo y persuasivo, sin emojis.`;

  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 });

    // Descargar imagen como base64
    const imgRes = await fetch(imagenUrl);
    if (!imgRes.ok) return NextResponse.json({ error: 'No se pudo descargar la imagen' }, { status: 400 });
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = (imgRes.headers.get('content-type') || 'image/jpeg') as any;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await res.json();
    const texto = data.content?.[0]?.text;
    if (!texto) return NextResponse.json({ error: data.error?.message || 'Sin respuesta' }, { status: 500 });
    return NextResponse.json({ descripcion: texto.trim() });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
