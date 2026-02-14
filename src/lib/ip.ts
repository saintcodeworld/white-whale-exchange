import { headers } from 'next/headers';

export async function getClientIP(): Promise<string> {
  const hdrs = await headers();
  // Check common proxy headers (Vercel, Cloudflare, nginx, etc.)
  const forwarded = hdrs.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be comma-separated; take the first (original client)
    return forwarded.split(',')[0].trim();
  }
  const realIp = hdrs.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = hdrs.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}
