import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';
import { deductBalance, createWithdrawal, getUserById, getWithdrawals } from '@/lib/db';
import { isValidSolanaAddress } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { amount, walletAddress } = await req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }

    const user = getUserById(session.userId);
    if (!user || user.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const success = deductBalance(session.userId, amount);
    if (!success) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const withdrawal = createWithdrawal(session.userId, amount, walletAddress);
    const updatedUser = getUserById(session.userId);

    return NextResponse.json({
      withdrawal,
      balance: updatedUser?.balance ?? 0,
    });
  } catch (err) {
    console.error('Withdraw error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const withdrawals = getWithdrawals(session.userId);
    return NextResponse.json({ withdrawals });
  } catch (err) {
    console.error('Get withdrawals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
