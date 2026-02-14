import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateSessionToken } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = authenticateUser(username, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = generateSessionToken();
    createSession(token, user.id, user.username);
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, username: user.username, balance: user.balance },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
