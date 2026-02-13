'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import SwapWidget from '@/components/SwapWidget';
import BubbleBackground from '@/components/BubbleBackground';
import { Shield, Zap, Globe, Waves, Loader2 } from 'lucide-react';

export default function Home() {
  const [priceUsd, setPriceUsd] = useState<string | null>(null);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);

  // Fetch live data from DexScreener
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dexscreener');
        const data = await res.json();
        if (data.priceUsd) setPriceUsd(data.priceUsd);
        if (data.marketCap) setMarketCap(data.marketCap);
      } catch {
        // silent
      } finally {
        setPriceLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  function formatMarketCap(mc: number): string {
    if (mc >= 1_000_000_000) return `$${(mc / 1_000_000_000).toFixed(2)}B`;
    if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(2)}M`;
    if (mc >= 1_000) return `$${(mc / 1_000).toFixed(2)}K`;
    return `$${mc.toFixed(2)}`;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ocean Background + Bubbles + Texture */}
      <BubbleBackground count={12} />

      {/* Header */}
      <Header />

      {/* Content */}
      <div className="relative z-10 pt-28 pb-16 px-4">
        {/* ────── HERO BANNER ────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          {/* $WHITEWHALE Title */}
          <h1 className="font-cartoon text-5xl md:text-7xl lg:text-8xl mb-8 leading-none">
            <span style={{ color: '#fff' }}>$</span>
            <span
              style={{
                color: '#00d4ff',
                WebkitTextStroke: '2px rgba(255,255,255,0.15)',
              }}
            >
              WHITE
            </span>
            <span style={{ color: '#fff' }}>WHALE</span>
          </h1>

          {/* Price / Buy Now / Market Cap row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 max-w-[700px] mx-auto"
          >
            {/* PRICE Card */}
            <div className="hero-stat-card">
              <span className="hero-stat-label">PRICE</span>
              {priceLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: '#00f7ff' }} />
              ) : (
                <span className="hero-stat-value">
                  ${priceUsd ? parseFloat(priceUsd).toFixed(6) : '—'}
                </span>
              )}
            </div>

            {/* Daily Spin Button */}
            <a
              href="/spin"
              className="btn-buy-now"
            >
              Daily Spin
            </a>

            {/* MARKET CAP Card */}
            <div className="hero-stat-card">
              <span className="hero-stat-label">MARKET CAP</span>
              {priceLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: '#00f7ff' }} />
              ) : (
                <span className="hero-stat-value hero-stat-value-green">
                  {marketCap ? formatMarketCap(marketCap) : '—'}
                </span>
              )}
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-base md:text-lg max-w-md mx-auto leading-relaxed font-body mt-8"
            style={{ color: 'rgba(232, 244, 255, 0.5)' }}
          >
            Swap any crypto into{' '}
            <span className="font-bold" style={{ color: '#00f7ff' }}>
              $WHITEWHALE
            </span>{' '}
            on Solana.
            <br />
            <span className="text-sm" style={{ color: 'rgba(232, 244, 255, 0.3)' }}>
              Fast. Secure. Non-custodial.
            </span>
          </motion.p>
        </motion.div>

        {/* Swap Widget */}
        <SwapWidget />

        {/* ────── QUOTE BANNER ────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 max-w-[600px] mx-auto"
        >
          <div className="glass-card p-10 md:p-14 text-center">
            <h2 className="font-cartoon text-3xl md:text-5xl leading-tight mb-2">
              <span style={{ color: '#fff', fontSize: 'var(--text-4xl)' }}>&quot;FROM THE DEPTHS —</span>
              <br />
              <span style={{ color: '#fff', fontSize: 'var(--text-4xl)' }}>THE WHITE WHALE&quot;</span>
            </h2>
          </div>

          {/* Community & The White Whale Buttons */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <a
              href="https://t.me/whitewhalesol"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl font-cartoon text-base md:text-lg tracking-wider transition-all duration-300 hover:scale-[1.04]"
              style={{
                color: '#00f7ff',
                background: 'rgba(2, 11, 28, 0.8)',
                border: '2px solid rgba(0, 247, 255, 0.4)',
                boxShadow: '0 0 20px rgba(0, 247, 255, 0.1)',
                textDecoration: 'none',
              }}
            >
              Community
            </a>
            <a
              href="https://whitewhalememe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl font-cartoon text-base md:text-lg tracking-wider transition-all duration-300 hover:scale-[1.04]"
              style={{
                color: '#00f7ff',
                background: 'rgba(2, 11, 28, 0.8)',
                border: '2px solid rgba(0, 247, 255, 0.4)',
                boxShadow: '0 0 20px rgba(0, 247, 255, 0.1)',
                textDecoration: 'none',
              }}
            >
              The White Whale
            </a>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-16 text-center font-body"
        >
          <p
            className="text-sm tracking-wide"
            style={{ color: 'rgba(0, 247, 255, 0.5)' }}
          >
            Powered By:{' '}
            <a
              href="https://whitewhalememe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200 hover:text-white"
              style={{ color: 'rgba(0, 247, 255, 0.7)', textDecoration: 'none' }}
            >
              The Depths
            </a>
            {' | '}
            <span style={{ color: 'rgba(0, 247, 255, 0.7)' }}>$WhiteWhale</span>
          </p>
        </motion.footer>

        {/* Feature Cards - HIDDEN */}
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { icon: Zap, label: 'Fast Swaps', sub: '~5 min average' },
            { icon: Shield, label: 'Non-Custodial', sub: 'Your keys, your coins' },
            { icon: Globe, label: 'Multi-Chain', sub: '10+ coins supported' },
            { icon: Waves, label: 'Deep Liquidity', sub: 'Best rates guaranteed' },
          ].map((feat, i) => (
            <motion.div
              key={feat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              className="glass-card p-4 text-center transition-all duration-300 hover:scale-[1.03]"
            >
              <feat.icon
                className="w-5 h-5 mx-auto mb-2"
                style={{ color: '#00f7ff' }}
              />
              <p className="text-xs font-semibold mb-0.5 font-body" style={{ color: '#e8f4ff' }}>
                {feat.label}
              </p>
              <p className="text-[10px] font-body" style={{ color: 'rgba(232, 244, 255, 0.35)' }}>
                {feat.sub}
              </p>
            </motion.div>
          ))}
        </motion.div> */}

        {/* Footer - HIDDEN */}
        {/* <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-16 text-center text-xs space-y-2 font-body"
          style={{ color: 'rgba(232, 244, 255, 0.2)' }}
        >
          <p>
            Powered by{' '}
            <a
              href="https://changenow.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors duration-200"
              style={{ color: 'rgba(0, 247, 255, 0.4)' }}
            >
              ChangeNow.io
            </a>
          </p>
          <p className="font-mono text-[10px]" style={{ color: 'rgba(232, 244, 255, 0.12)' }}>
            CA: a3W4qutoEJA4232T2gwZUfgYJTetr96pU4SJMwppump
          </p>
        </motion.footer> */}
      </div>
    </main>
  );
}
