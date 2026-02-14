import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';
import { getUserById } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ balance: user.balance });
  } catch (err) {
    console.error('Balance error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
