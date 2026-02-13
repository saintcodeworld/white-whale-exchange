'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

const CONTRACT_ADDRESS = 'a3W4qutoEJA4232T2gwZUfgYJTetr96pU4SJMwppump';

export default function Header() {
    const [copied, setCopied] = useState(false);

    async function handleCopyCA() {
        try {
            await navigator.clipboard.writeText(CONTRACT_ADDRESS);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    }

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50"
        >
            <div
                className="w-full px-6 md:px-10 py-4 flex items-center justify-between"
                style={{
                    background: 'linear-gradient(180deg, rgba(2, 11, 28, 0.7) 0%, transparent 100%)',
                }}
            >
                {/* Logo — $WHITEWHALE */}
                <a
                    href="/"
                    className="flex items-center gap-0 group"
                >
                    <h1 className="font-cartoon text-xl md:text-2xl tracking-wider" style={{ textShadow: '3px 3px #036' }}>
                        <span style={{ color: '#fff' }}>$</span>
                        <span style={{ color: '#00d4ff' }}>WHITE</span>
                        <span style={{ color: '#fff' }}>WHALE</span>
                    </h1>
                </a>

                {/* Right nav — DAILY SPIN, LEADERBOARD, DEXSCREENER, Copy CA */}
                <nav className="flex items-center gap-4 md:gap-6">
                    <a
                        href="/spin"
                        className="header-nav-link font-cartoon"
                    >
                        DAILY SPIN
                    </a>
                    <a
                        href="/leaderboard"
                        className="header-nav-link font-cartoon"
                    >
                        LEADERBOARD
                    </a>
                    <a
                        href="https://dexscreener.com/solana/a3W4qutoEJA4232T2gwZUfgYJTetr96pU4SJMwppump"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="header-nav-link font-cartoon"
                    >
                        DEXSCREENER
                    </a>
                    <button
                        onClick={handleCopyCA}
                        className="header-copy-btn font-body"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy CA
                            </>
                        )}
                    </button>
                </nav>
            </div>
        </motion.header>
    );
}
