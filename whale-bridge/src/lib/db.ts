import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'data', 'whitewhale.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');

    // Create tables
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        balance REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS spin_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        spun_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS spin_cooldowns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        ip_address TEXT NOT NULL,
        fingerprint TEXT,
        amount INTEGER NOT NULL,
        claimed INTEGER DEFAULT 0,
        spun_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_spin_cooldowns_ip ON spin_cooldowns(ip_address);
      CREATE INDEX IF NOT EXISTS idx_spin_cooldowns_user ON spin_cooldowns(user_id);
      CREATE INDEX IF NOT EXISTS idx_spin_cooldowns_fp ON spin_cooldowns(fingerprint);

      CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        wallet_address TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Migration: add 'claimed' column if it doesn't exist (for existing DBs)
    const cols = _db.prepare("PRAGMA table_info(spin_cooldowns)").all() as { name: string }[];
    if (!cols.some(c => c.name === 'claimed')) {
      _db.exec("ALTER TABLE spin_cooldowns ADD COLUMN claimed INTEGER DEFAULT 0");
    }
  }
  return _db;
}

// Password hashing
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

// Session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// User operations
export function createUser(username: string, password: string) {
  const db = getDb();
  const { hash, salt } = hashPassword(password);
  const stmt = db.prepare('INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)');
  const result = stmt.run(username, hash, salt);
  return { id: result.lastInsertRowid as number, username };
}

export function authenticateUser(username: string, password: string) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
    id: number; username: string; password_hash: string; salt: string; balance: number;
  } | undefined;
  if (!user) return null;
  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.password_hash) return null;
  return { id: user.id, username: user.username, balance: user.balance };
}

export function getUserById(id: number) {
  const db = getDb();
  return db.prepare('SELECT id, username, balance, created_at FROM users WHERE id = ?').get(id) as {
    id: number; username: string; balance: number; created_at: string;
  } | undefined;
}

export function getUserByUsername(username: string) {
  const db = getDb();
  return db.prepare('SELECT id, username, balance FROM users WHERE username = ?').get(username) as {
    id: number; username: string; balance: number;
  } | undefined;
}

export function addBalance(userId: number, amount: number) {
  const db = getDb();
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);
  return getUserById(userId);
}

export function deductBalance(userId: number, amount: number): boolean {
  const db = getDb();
  const user = getUserById(userId);
  if (!user || user.balance < amount) return false;
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
  return true;
}

// Spin history
export function addSpinRecord(userId: number, amount: number) {
  const db = getDb();
  db.prepare('INSERT INTO spin_history (user_id, amount) VALUES (?, ?)').run(userId, amount);
}

// Withdrawals
export function createWithdrawal(userId: number, amount: number, walletAddress: string) {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO withdrawals (user_id, amount, wallet_address) VALUES (?, ?, ?)'
  ).run(userId, amount, walletAddress);
  return { id: result.lastInsertRowid as number, amount, walletAddress, status: 'pending' };
}

export function getWithdrawals(userId: number) {
  const db = getDb();
  return db.prepare(
    'SELECT id, amount, wallet_address, status, created_at FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);
}

// ─── Spin Cooldown (12-hour, server-enforced) ───────────────────────
const COOLDOWN_HOURS = 12;

export function getLastSpinByIP(ip: string): { spun_at: string; amount: number } | undefined {
  const db = getDb();
  return db.prepare(
    `SELECT spun_at, amount FROM spin_cooldowns WHERE ip_address = ? ORDER BY spun_at DESC LIMIT 1`
  ).get(ip) as { spun_at: string; amount: number } | undefined;
}

export function getLastSpinByUser(userId: number): { spun_at: string; amount: number } | undefined {
  const db = getDb();
  return db.prepare(
    `SELECT spun_at, amount FROM spin_cooldowns WHERE user_id = ? ORDER BY spun_at DESC LIMIT 1`
  ).get(userId) as { spun_at: string; amount: number } | undefined;
}

export function getLastSpinByFingerprint(fp: string): { spun_at: string; amount: number } | undefined {
  const db = getDb();
  return db.prepare(
    `SELECT spun_at, amount FROM spin_cooldowns WHERE fingerprint = ? ORDER BY spun_at DESC LIMIT 1`
  ).get(fp) as { spun_at: string; amount: number } | undefined;
}

function isWithinCooldown(spunAt: string): boolean {
  const spunTime = new Date(spunAt + 'Z').getTime();
  const now = Date.now();
  return (now - spunTime) < COOLDOWN_HOURS * 60 * 60 * 1000;
}

export function getRemainingCooldownMs(spunAt: string): number {
  const spunTime = new Date(spunAt + 'Z').getTime();
  const cooldownEnd = spunTime + COOLDOWN_HOURS * 60 * 60 * 1000;
  return Math.max(0, cooldownEnd - Date.now());
}

export interface CooldownStatus {
  canSpin: boolean;
  remainingMs: number;
  reason?: string;
}

export function checkSpinCooldown(ip: string, userId?: number, fingerprint?: string): CooldownStatus {
  // Check IP cooldown
  const ipSpin = getLastSpinByIP(ip);
  if (ipSpin && isWithinCooldown(ipSpin.spun_at)) {
    return { canSpin: false, remainingMs: getRemainingCooldownMs(ipSpin.spun_at), reason: 'ip' };
  }

  // Check user cooldown
  if (userId) {
    const userSpin = getLastSpinByUser(userId);
    if (userSpin && isWithinCooldown(userSpin.spun_at)) {
      return { canSpin: false, remainingMs: getRemainingCooldownMs(userSpin.spun_at), reason: 'user' };
    }
  }

  // Check fingerprint cooldown
  if (fingerprint) {
    const fpSpin = getLastSpinByFingerprint(fingerprint);
    if (fpSpin && isWithinCooldown(fpSpin.spun_at)) {
      return { canSpin: false, remainingMs: getRemainingCooldownMs(fpSpin.spun_at), reason: 'fingerprint' };
    }
  }

  return { canSpin: true, remainingMs: 0 };
}

export function recordSpin(ip: string, amount: number, userId?: number, fingerprint?: string, claimed?: boolean) {
  const db = getDb();
  db.prepare(
    'INSERT INTO spin_cooldowns (user_id, ip_address, fingerprint, amount, claimed) VALUES (?, ?, ?, ?, ?)'
  ).run(userId ?? null, ip, fingerprint ?? null, amount, claimed ? 1 : 0);

  // Also record in spin_history if user is logged in
  if (userId) {
    addSpinRecord(userId, amount);
  }
}

// Find the most recent unclaimed anonymous spin for an IP address
export function getUnclaimedSpinByIP(ip: string): { id: number; amount: number; spun_at: string } | undefined {
  const db = getDb();
  return db.prepare(
    `SELECT id, amount, spun_at FROM spin_cooldowns WHERE ip_address = ? AND claimed = 0 AND user_id IS NULL ORDER BY spun_at DESC LIMIT 1`
  ).get(ip) as { id: number; amount: number; spun_at: string } | undefined;
}

// Mark an anonymous spin as claimed and link it to the user
export function claimAnonymousSpin(spinId: number, userId: number) {
  const db = getDb();
  db.prepare(
    'UPDATE spin_cooldowns SET claimed = 1, user_id = ? WHERE id = ?'
  ).run(userId, spinId);
}

// ─── Server-side weighted spin ──────────────────────────────────────
const SPIN_SEGMENTS = [
  { label: '50',   value: 50,   rarity: 'common',    weight: 30 },
  { label: '200',  value: 200,  rarity: 'common',    weight: 25 },
  { label: '250',  value: 250,  rarity: 'common',    weight: 20 },
  { label: '340',  value: 340,  rarity: 'uncommon',  weight: 10 },
  { label: '100',  value: 100,  rarity: 'common',    weight: 28 },
  { label: '650',  value: 650,  rarity: 'rare',      weight: 4 },
  { label: '50',   value: 50,   rarity: 'common',    weight: 30 },
  { label: '1800', value: 1800, rarity: 'legendary', weight: 1 },
  { label: '200',  value: 200,  rarity: 'common',    weight: 25 },
  { label: '400',  value: 400,  rarity: 'uncommon',  weight: 7 },
  { label: '100',  value: 100,  rarity: 'common',    weight: 28 },
  { label: '250',  value: 250,  rarity: 'common',    weight: 20 },
];

export function serverPickSpin(): { index: number; value: number; rarity: string } {
  const totalWeight = SPIN_SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < SPIN_SEGMENTS.length; i++) {
    rand -= SPIN_SEGMENTS[i].weight;
    if (rand <= 0) return { index: i, value: SPIN_SEGMENTS[i].value, rarity: SPIN_SEGMENTS[i].rarity };
  }
  return { index: 0, value: SPIN_SEGMENTS[0].value, rarity: SPIN_SEGMENTS[0].rarity };
}
