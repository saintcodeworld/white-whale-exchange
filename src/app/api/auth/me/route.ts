import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';
import { getUserById } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: { id: user.id, username: user.username, balance: user.balance },
    });
  } catch (err) {
    console.error('Auth check error:', err);
    return NextResponse.json({ user: null });
  }
}
