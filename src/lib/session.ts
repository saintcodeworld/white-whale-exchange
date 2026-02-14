import { cookies } from 'next/headers';

const SESSION_COOKIE = 'ww_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// In-memory session store (resets on server restart — fine for dev)
// For production, store sessions in the DB
const sessions = new Map<string, { userId: number; username: string }>();

export function createSession(token: string, userId: number, username: string) {
  sessions.set(token, { userId, username });
}

export function getSessionData(token: string) {
  return sessions.get(token) || null;
}

export function deleteSession(token: string) {
  sessions.delete(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionData(token);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
