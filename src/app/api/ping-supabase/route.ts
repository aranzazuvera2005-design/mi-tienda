import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (!supabaseUrl) return NextResponse.json({ ok: false, error: 'No SUPABASE URL configured' }, { status: 200 });

    // Try a fetch to the Supabase base URL to detect DNS/network errors.
    // We don't rely on the response body; we only want to know if the host is reachable.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(supabaseUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        return NextResponse.json({ ok: false, status: res.status, statusText: res.statusText }, { status: 200 });
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e: any) {
      clearTimeout(timeout);
      return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 200 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 200 });
  }
}
