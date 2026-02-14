import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateSessionToken, getUserByUsername } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if username exists
    const existing = getUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const user = createUser(username, password);
    const token = generateSessionToken();
    createSession(token, user.id, user.username);
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, username: user.username, balance: 0 },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
