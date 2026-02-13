'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from './AuthModal';
import WithdrawModal from './WithdrawModal';

/* ═══════════════════════════════════════════════
   Wheel Segments
   ═══════════════════════════════════════════════ */
interface Segment {
  label: string;
  value: number;
  color: string;
  glowColor: string;
  emoji: string;
  useIcon?: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  weight: number;
}

const SEGMENTS: Segment[] = [
  { label: '50',    value: 50,   color: '#0a2a4a', glowColor: '#00f7ff', emoji: '', useIcon: true, rarity: 'common',    weight: 30 },
  { label: '200',   value: 200,  color: '#0d1f3c', glowColor: '#0088ff', emoji: '', useIcon: true, rarity: 'common',    weight: 25 },
  { label: '250',   value: 250,  color: '#0a2a4a', glowColor: '#00f7ff', emoji: '', useIcon: true, rarity: 'common',    weight: 20 },
  { label: '340',   value: 340,  color: '#0d1f3c', glowColor: '#0088ff', emoji: '', useIcon: true, rarity: 'uncommon',  weight: 10 },
  { label: '100',   value: 100,  color: '#0a2a4a', glowColor: '#00f7ff', emoji: '', useIcon: true, rarity: 'common',    weight: 28 },
  { label: '650',   value: 650,  color: '#0d1f3c', glowColor: '#00e68a', emoji: '', useIcon: true, rarity: 'rare',      weight: 4 },
  { label: '50',    value: 50,   color: '#0a2a4a', glowColor: '#00f7ff', emoji: '', useIcon: true, rarity: 'common',    weight: 30 },
  { label: '1800',  value: 1800, color: '#1a0a3c', glowColor: '#ff00ff', emoji: '', useIcon: true, rarity: 'legendary', weight: 1 },
  { label: '200',   value: 200,  color: '#0a2a4a', glowColor: '#0088ff', emoji: '', useIcon: true, rarity: 'common',    weight: 25 },
  { label: '400',   value: 400,  color: '#0d1f3c', glowColor: '#00e68a', emoji: '', useIcon: true, rarity: 'uncommon',  weight: 7 },
  { label: '100',   value: 100,  color: '#0a2a4a', glowColor: '#00f7ff', emoji: '', useIcon: true, rarity: 'common',    weight: 28 },
  { label: '250',   value: 250,  color: '#0d1f3c', glowColor: '#0088ff', emoji: '', useIcon: true, rarity: 'common',    weight: 20 },
];

const NUM_SEGMENTS = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;

/* ═══════════════════════════════════════════════
   Confetti Particle
   ═══════════════════════════════════════════════ */
interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
}

function generateParticles(count: number, glowColor: string): Particle[] {
  const colors = [glowColor, '#00f7ff', '#0088ff', '#00e68a', '#fff', '#ffe066'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 3,
    angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5,
    speed: Math.random() * 200 + 100,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 720,
  }));
}

/* ═══════════════════════════════════════════════
   localStorage helpers (stats only — NOT for cooldown)
   ═══════════════════════════════════════════════ */
const STORAGE_KEY = 'whitewhale_spin';

interface SpinData {
  lastSpin: string;
  totalEarned: number;
  spinCount: number;
  streak: number;
}

function getSpinData(): SpinData {
  if (typeof window === 'undefined') return { lastSpin: '', totalEarned: 0, spinCount: 0, streak: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { lastSpin: '', totalEarned: 0, spinCount: 0, streak: 0 };
}

function saveSpinData(data: SpinData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════════
   Browser fingerprint (canvas + screen + timezone)
   ═══════════════════════════════════════════════ */
function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') return '';
  try {
    const parts: string[] = [];
    parts.push(navigator.userAgent);
    parts.push(navigator.language);
    parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    parts.push(navigator.hardwareConcurrency?.toString() ?? '0');
    // Canvas fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('WhiteWhale🐋', 2, 2);
      parts.push(canvas.toDataURL());
    }
    // Simple hash
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash.toString(36);
  } catch {
    return '';
  }
}

/* ═══════════════════════════════════════════════
   Rarity Colors
   ═══════════════════════════════════════════════ */
const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  common:    { bg: 'rgba(0, 247, 255, 0.08)', border: 'rgba(0, 247, 255, 0.3)',  text: '#00f7ff', label: 'COMMON' },
  uncommon:  { bg: 'rgba(0, 136, 255, 0.08)', border: 'rgba(0, 136, 255, 0.4)',  text: '#0088ff', label: 'UNCOMMON' },
  rare:      { bg: 'rgba(0, 230, 138, 0.08)', border: 'rgba(0, 230, 138, 0.4)',  text: '#00e68a', label: 'RARE' },
  legendary: { bg: 'rgba(255, 0, 255, 0.1)',  border: 'rgba(255, 0, 255, 0.5)',  text: '#ff00ff', label: 'LEGENDARY' },
};

/* ═══════════════════════════════════════════════
   SpinWheel Component
   ═══════════════════════════════════════════════ */
export default function SpinWheel() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Segment | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [spinData, setSpinData] = useState<SpinData>({ lastSpin: '', totalEarned: 0, spinCount: 0, streak: 0 });
  const [countdown, setCountdown] = useState('');
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const fingerprintRef = useRef<string>('');
  const [priceNative, setPriceNative] = useState<number | null>(null);
  const [user, setUser] = useState<{ id: number; username: string; balance: number } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [pendingReward, setPendingReward] = useState<number | null>(null);
  const tickAudioRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);

  // Format SOL equivalent
  const toSol = useCallback((tokens: number): string => {
    if (!priceNative) return '...';
    const sol = tokens * priceNative;
    return sol.toFixed(2) + ' SOL';
  }, [priceNative]);

  // Initialize — check server-side cooldown
  useEffect(() => {
    setMounted(true);
    const data = getSpinData();
    setSpinData(data);
    fingerprintRef.current = getBrowserFingerprint();

    // Check if user is logged in
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) setUser(data.user);
    }).catch(() => {});

    // Check server-side cooldown status
    fetch('/api/spin/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint: getBrowserFingerprint() }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.canSpin && data.remainingMs > 0) {
          setHasSpunToday(true);
          setCooldownEndTime(Date.now() + data.remainingMs);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live WHITEWHALE price in SOL
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch('/api/dexscreener');
        const data = await res.json();
        if (data.priceNative) setPriceNative(parseFloat(data.priceNative));
      } catch { /* silent */ }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer — uses server-provided cooldown end time
  useEffect(() => {
    if (!hasSpunToday || !cooldownEndTime) return;
    const tick = () => {
      const remaining = cooldownEndTime - Date.now();
      if (remaining <= 0) {
        setHasSpunToday(false);
        setCooldownEndTime(null);
        setCountdown('');
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hasSpunToday, cooldownEndTime]);

  // Tick sound during spin
  const playTick = useCallback(() => {
    const now = Date.now();
    if (now - lastTickRef.current < 60) return;
    lastTickRef.current = now;
    try {
      if (!tickAudioRef.current) {
        tickAudioRef.current = new AudioContext();
      }
      const ctx = tickAudioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800 + Math.random() * 400;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch { /* audio not available */ }
  }, []);

  // Win sound
  const playWinSound = useCallback((rarity: string) => {
    try {
      if (!tickAudioRef.current) {
        tickAudioRef.current = new AudioContext();
      }
      const ctx = tickAudioRef.current;
      const freqs = rarity === 'legendary' ? [523, 659, 784, 1047] :
                    rarity === 'rare' ? [440, 554, 659] :
                    [440, 554];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch { /* audio not available */ }
  }, []);

  const handleSpin = useCallback(async () => {
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    setResult(null);
    setShowResult(false);
    setParticles([]);

    try {
      // Ask server to execute the spin (server picks the result + enforces cooldown)
      const res = await fetch('/api/spin/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fingerprintRef.current }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 429 && errData.remainingMs) {
          // Cooldown is active — server rejected
          setHasSpunToday(true);
          setCooldownEndTime(Date.now() + errData.remainingMs);
        }
        setIsSpinning(false);
        return;
      }

      const spinResult = await res.json();
      const winIndex: number = spinResult.index;
      const segment = SEGMENTS[winIndex];

      // Calculate target rotation using server-provided index
      const segmentCenter = winIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      const extraSpins = 5 + Math.floor(Math.random() * 3);
      const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);
      const targetRotation = rotation + extraSpins * 360 + (360 - segmentCenter) + jitter;

      setRotation(targetRotation);

      // Tick sounds during spin
      const tickInterval = setInterval(playTick, 80);

      // Reveal result after spin animation
      setTimeout(() => {
        clearInterval(tickInterval);
        setIsSpinning(false);
        setResult(segment);
        setParticles(generateParticles(segment.rarity === 'legendary' ? 60 : segment.rarity === 'rare' ? 40 : 20, segment.glowColor));
        playWinSound(segment.rarity);

        // Update local stats (display only — not used for cooldown)
        const today = getTodayKey();
        const prevData = getSpinData();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().slice(0, 10);
        const newStreak = prevData.lastSpin === yesterdayKey ? prevData.streak + 1 : 1;

        const newData: SpinData = {
          lastSpin: today,
          totalEarned: prevData.totalEarned + segment.value,
          spinCount: prevData.spinCount + 1,
          streak: newStreak,
        };
        saveSpinData(newData);
        setSpinData(newData);
        setHasSpunToday(true);
        setCooldownEndTime(Date.now() + (spinResult.cooldownMs || 12 * 60 * 60 * 1000));

        // Update balance if server returned it
        if (spinResult.balance !== undefined && user) {
          setUser(prev => prev ? { ...prev, balance: spinResult.balance } : null);
        }

        setTimeout(() => setShowResult(true), 300);
      }, 5500);
    } catch {
      setIsSpinning(false);
    }
  }, [isSpinning, hasSpunToday, rotation, playTick, playWinSound, user]);

  // Handle COLLECT button click
  const handleCollect = useCallback(() => {
    if (!result) return;

    if (!user) {
      // Not logged in — save reward and show auth modal
      setPendingReward(result.value);
      setShowResult(false);
      setShowAuthModal(true);
    } else {
      // Logged in — balance was already credited by /api/spin/execute
      // Just dismiss the result modal
      setShowResult(false);
    }
  }, [result, user]);

  // After successful signup/login
  const handleAuthenticated = useCallback(async (authUser: { id: number; username: string; balance: number }) => {
    setUser(authUser);
    setShowAuthModal(false);

    // Auto-claim pending reward
    if (pendingReward) {
      try {
        const res = await fetch('/api/user/claim-spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: pendingReward }),
        });
        const data = await res.json();
        if (res.ok) {
          setUser(prev => prev ? { ...prev, balance: data.balance } : null);
        }
      } catch { /* silent */ }
      setPendingReward(null);
    }
  }, [pendingReward]);

  if (!mounted) return null;

  const wheelRadius = 170;
  const center = 200;

  return (
    <div className="spin-wheel-container">
      {/* Stats Bar */}
      <div className="spin-stats-bar">
        <div className="spin-stat">
          <span className="spin-stat-label">TOTAL EARNED</span>
          <span className="spin-stat-value">{spinData.totalEarned.toLocaleString()}</span>
        </div>
        <div className="spin-stat">
          <span className="spin-stat-label">SPINS</span>
          <span className="spin-stat-value">{spinData.spinCount}</span>
        </div>
        <div className="spin-stat">
          <span className="spin-stat-label">STREAK</span>
          <span className="spin-stat-value">{spinData.streak} 🔥</span>
        </div>
      </div>

      {/* Wheel Area — click the wheel to spin */}
      <div
        className={`spin-wheel-wrapper ${!isSpinning && !hasSpunToday ? 'spin-wheel-clickable' : ''}`}
        onClick={handleSpin}
      >
        {/* Outer glow ring */}
        <div className="spin-outer-glow" />

        {/* Pointer / Ticker at top */}
        <div className="spin-pointer">
          <svg width="40" height="50" viewBox="0 0 40 50">
            <defs>
              <filter id="pointerGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <polygon
              points="20,50 4,8 20,16 36,8"
              fill="#00f7ff"
              stroke="#fff"
              strokeWidth="1.5"
              filter="url(#pointerGlow)"
            />
          </svg>
        </div>

        {/* SVG Wheel */}
        <motion.div
          className="spin-wheel-svg-wrap"
          style={{ cursor: !isSpinning && !hasSpunToday ? 'pointer' : 'default' }}
          animate={{ rotate: rotation }}
          transition={{
            duration: 5.5,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            className="spin-wheel-svg"
          >
            <defs>
              {/* Segment gradients */}
              {SEGMENTS.map((seg, i) => (
                <radialGradient key={`grad-${i}`} id={`segGrad${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={seg.color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={seg.color} stopOpacity="1" />
                </radialGradient>
              ))}
              {/* Center gradient */}
              <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0d2847" />
                <stop offset="100%" stopColor="#020b1c" />
              </radialGradient>
              {/* Glow filter */}
              <filter id="segGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer ring */}
            <circle cx={center} cy={center} r={wheelRadius + 18} fill="none" stroke="rgba(0,247,255,0.15)" strokeWidth="2" />
            <circle cx={center} cy={center} r={wheelRadius + 12} fill="none" stroke="rgba(0,247,255,0.08)" strokeWidth="1" />

            {/* Segments */}
            {SEGMENTS.map((seg, i) => {
              const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
              const x1 = center + wheelRadius * Math.cos(startAngle);
              const y1 = center + wheelRadius * Math.sin(startAngle);
              const x2 = center + wheelRadius * Math.cos(endAngle);
              const y2 = center + wheelRadius * Math.sin(endAngle);
              const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;

              // Text position (middle of segment, radial positions)
              const midAngle = ((i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2) - 90) * (Math.PI / 180);
              const textR = wheelRadius * 0.72;
              const solR = wheelRadius * 0.56;
              const emojiR = wheelRadius * 0.38;
              const tx = center + textR * Math.cos(midAngle);
              const ty = center + textR * Math.sin(midAngle);
              const sx = center + solR * Math.cos(midAngle);
              const sy = center + solR * Math.sin(midAngle);
              const ex = center + emojiR * Math.cos(midAngle);
              const ey = center + emojiR * Math.sin(midAngle);
              const textRotation = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

              // SOL equivalent for this segment
              const solText = priceNative
                ? `≈${(seg.value * priceNative).toFixed(2)}`
                : '';

              return (
                <g key={i}>
                  {/* Segment slice */}
                  <path
                    d={`M ${center} ${center} L ${x1} ${y1} A ${wheelRadius} ${wheelRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={`url(#segGrad${i})`}
                    stroke="rgba(0,247,255,0.12)"
                    strokeWidth="1"
                  />
                  {/* Segment divider line glow */}
                  <line
                    x1={center}
                    y1={center}
                    x2={x1}
                    y2={y1}
                    stroke="rgba(0,247,255,0.2)"
                    strokeWidth="0.5"
                  />
                  {/* Value text */}
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                    fill={seg.glowColor}
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="'Fredoka', sans-serif"
                    filter="url(#segGlow)"
                  >
                    {seg.label}
                  </text>
                  {/* SOL equivalent */}
                  {solText && (
                    <text
                      x={sx}
                      y={sy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${textRotation}, ${sx}, ${sy})`}
                      fill="rgba(232,244,255,0.4)"
                      fontSize="7"
                      fontWeight="500"
                      fontFamily="'Fredoka', sans-serif"
                    >
                      {solText} SOL
                    </text>
                  )}
                  {/* Icon or Emoji */}
                  {seg.useIcon ? (
                    <image
                      href="/ww back.png"
                      x={ex - 10}
                      y={ey - 10}
                      width="20"
                      height="20"
                      transform={`rotate(${textRotation}, ${ex}, ${ey})`}
                      style={{ borderRadius: '50%' }}
                    />
                  ) : (
                    <text
                      x={ex}
                      y={ey}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${textRotation}, ${ex}, ${ey})`}
                      fontSize="16"
                    >
                      {seg.emoji}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Pip markers on outer edge */}
            {SEGMENTS.map((_, i) => {
              const angle = (i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90) * (Math.PI / 180);
              const px = center + (wheelRadius + 8) * Math.cos(angle);
              const py = center + (wheelRadius + 8) * Math.sin(angle);
              return (
                <circle
                  key={`pip-${i}`}
                  cx={px}
                  cy={py}
                  r="3"
                  fill={isSpinning ? '#00f7ff' : 'rgba(0,247,255,0.4)'}
                  className={isSpinning ? 'spin-pip-active' : ''}
                />
              );
            })}

            {/* Center hub (visual only, text is overlaid outside rotation) */}
            <circle cx={center} cy={center} r="38" fill="url(#centerGrad)" stroke="rgba(0,247,255,0.3)" strokeWidth="2" />
            <circle cx={center} cy={center} r="32" fill="none" stroke="rgba(0,247,255,0.1)" strokeWidth="1" />
          </svg>
        </motion.div>

        {/* Center SPIN button (non-rotating, on top of wheel) */}
        <button
          className="spin-center-btn"
          onClick={handleSpin}
          disabled={isSpinning || hasSpunToday}
        >
          {isSpinning ? '...' : 'SPIN'}
        </button>

        {/* Confetti particles */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: p.rotation }}
              animate={{
                x: Math.cos(p.angle) * p.speed,
                y: Math.sin(p.angle) * p.speed - 50,
                opacity: 0,
                scale: 0.3,
                rotate: p.rotation + p.rotationSpeed,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: p.size,
                height: p.size,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                backgroundColor: p.color,
                boxShadow: `0 0 6px ${p.color}`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Cooldown Timer */}
      {hasSpunToday && countdown && (
        <motion.div
          className="spin-cooldown"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="spin-cooldown-label">NEXT SPIN IN</span>
          <span className="spin-cooldown-timer">{countdown}</span>
          <span className="spin-cooldown-hint">Come back in 12 hours!</span>
        </motion.div>
      )}

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            className="spin-result-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResult(false)}
          >
            <motion.div
              className="spin-result-modal"
              initial={{ scale: 0.5, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                borderColor: RARITY_STYLES[result.rarity].border,
                background: `linear-gradient(135deg, rgba(2,11,28,0.95), ${RARITY_STYLES[result.rarity].bg})`,
              }}
            >
              {/* Rarity badge */}
              <div
                className="spin-rarity-badge"
                style={{
                  color: RARITY_STYLES[result.rarity].text,
                  borderColor: RARITY_STYLES[result.rarity].border,
                  background: RARITY_STYLES[result.rarity].bg,
                }}
              >
                {RARITY_STYLES[result.rarity].label}
              </div>

              {/* Emoji or Icon */}
              <motion.div
                className="spin-result-emoji"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
              >
                {result.useIcon ? (
                  <img src="/ww back.png" alt="WhiteWhale" style={{ width: 64, height: 64, borderRadius: '50%' }} />
                ) : (
                  result.emoji
                )}
              </motion.div>

              {/* Amount */}
              <motion.div
                className="spin-result-amount"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ color: RARITY_STYLES[result.rarity].text }}
              >
                +{result.value.toLocaleString()} $WHITEWHALE
              </motion.div>

              {/* SOL equivalent */}
              <motion.div
                className="spin-result-sol"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                ≈ {toSol(result.value)}
              </motion.div>

              {/* Message */}
              <motion.p
                className="spin-result-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {result.rarity === 'legendary'
                  ? 'The Great White Whale blesses you!'
                  : result.rarity === 'rare'
                  ? 'A rare catch from the deep!'
                  : result.rarity === 'uncommon'
                  ? 'Nice haul from the ocean!'
                  : 'A small treasure from the sea.'}
              </motion.p>

              {/* Collect */}
              <motion.button
                className="spin-result-close"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleCollect}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                COLLECT
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Dashboard */}
      {user && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          marginTop: 24,
          flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 24px',
            borderRadius: 16,
            background: 'rgba(0,10,30,0.6)',
            border: '1px solid rgba(0,247,255,0.15)',
            boxShadow: '0 0 20px rgba(0,247,255,0.05)',
          }}>
            <span style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 14,
              color: '#00f7ff',
              fontWeight: 600,
            }}>👤 {user.username}</span>
            <span style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 12,
              color: 'rgba(232,244,255,0.5)',
            }}>Balance:</span>
            <span style={{
              fontFamily: "'Luckiest Guy', cursive",
              fontSize: 20,
              color: '#ffe066',
              letterSpacing: 1,
              textShadow: '0 0 12px rgba(255,224,102,0.3)',
            }}>{user.balance.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            style={{
              padding: '12px 28px',
              border: '1px solid rgba(0,247,255,0.35)',
              borderRadius: 14,
              background: 'rgba(0,247,255,0.1)',
              color: '#00f7ff',
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,247,255,0.2)';
              e.currentTarget.style.borderColor = 'rgba(0,247,255,0.6)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(0,247,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,247,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(0,247,255,0.35)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            WITHDRAW
          </button>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={handleAuthenticated}
        pendingReward={pendingReward ?? undefined}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        balance={user?.balance ?? 0}
        onWithdraw={(newBalance) => setUser(prev => prev ? { ...prev, balance: newBalance } : null)}
      />
    </div>
  );
}
