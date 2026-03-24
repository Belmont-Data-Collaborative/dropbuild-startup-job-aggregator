import { NextRequest, NextResponse } from 'next/server';

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// POST /api/auth — login
export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password?: string };

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  const expected = await hashPassword(process.env.APP_PASSWORD ?? '');
  const provided = await hashPassword(password);

  if (provided !== expected) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('sja_session', expected, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // Session cookie — expires when browser closes
  });
  return res;
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('sja_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
