import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';
import { checkSpinCooldown, recordSpin, serverPickSpin, addBalance } from '@/lib/db';
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

    // Server-side cooldown enforcement
    const cooldown = checkSpinCooldown(ip, userId, fingerprint);
    if (!cooldown.canSpin) {
      return NextResponse.json({
        error: 'Cooldown active',
        remainingMs: cooldown.remainingMs,
      }, { status: 429 });
    }

    // Server-side weighted random pick
    const spin = serverPickSpin();

    // Record the spin (tracks IP + user + fingerprint)
    // If user is logged in, mark as already claimed since we auto-credit below
    recordSpin(ip, spin.value, userId, fingerprint, !!userId);

    // If user is logged in, auto-credit balance
    let newBalance: number | undefined;
    if (userId) {
      const user = addBalance(userId, spin.value);
      newBalance = user?.balance;
    }

    return NextResponse.json({
      index: spin.index,
      value: spin.value,
      rarity: spin.rarity,
      balance: newBalance,
      // Return cooldown info so client can show timer immediately
      cooldownMs: 12 * 60 * 60 * 1000,
    });
  } catch (err) {
    console.error('Spin execute error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
