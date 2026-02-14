import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';
import { checkSpinCooldown } from '@/lib/db';
import { getClientIP } from '@/lib/ip';

export async function POST(req: NextRequest) {
  try {
    const ip = await getClientIP();
    const session = await getSessionFromCookie();
    const userId = session?.userId;

    // Optional browser fingerprint from client
    let fingerprint: string | undefined;
    try {
      const body = await req.json();
      fingerprint = body.fingerprint;
    } catch { /* no body is fine */ }

    const status = checkSpinCooldown(ip, userId, fingerprint);

    return NextResponse.json({
      canSpin: status.canSpin,
      remainingMs: status.remainingMs,
    });
  } catch (err) {
    console.error('Spin check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
