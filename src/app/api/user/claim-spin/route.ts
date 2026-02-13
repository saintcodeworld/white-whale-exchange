import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';
import { addBalance, addSpinRecord, getUnclaimedSpinByIP, claimAnonymousSpin } from '@/lib/db';
import { getClientIP } from '@/lib/ip';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const ip = await getClientIP();

    // Find an unclaimed anonymous spin from this IP
    const unclaimedSpin = getUnclaimedSpinByIP(ip);
    if (!unclaimedSpin) {
      return NextResponse.json({ error: 'No unclaimed spin found.' }, { status: 403 });
    }

    const { amount } = await req.json();
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Only allow claiming the exact amount from the unclaimed spin
    if (amount !== unclaimedSpin.amount) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // Mark the spin as claimed and link it to this user
    claimAnonymousSpin(unclaimedSpin.id, session.userId);

    // Credit the balance
    addSpinRecord(session.userId, amount);
    const user = addBalance(session.userId, amount);

    return NextResponse.json({
      balance: user?.balance ?? 0,
      claimed: amount,
    });
  } catch (err) {
    console.error('Claim spin error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
