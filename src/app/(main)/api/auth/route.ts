import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function sessionToken(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password: string };

  if (!password || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = sessionToken(password);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('sja_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('sja_session', '', { maxAge: 0, path: '/' });
  return res;
}
