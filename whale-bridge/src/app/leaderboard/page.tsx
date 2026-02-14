'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import BubbleBackground from '@/components/BubbleBackground';
import { Search, Loader2, Copy, Check, Trophy, ChevronDown } from 'lucide-react';

/* ─── Types ─── */
interface SeasonOneEntry {
    wallet: string;
    score: number;
    balance: number;
    is_eligible: boolean;
    rank: number;
}

interface SeasonTwoEntry {
    wallet: string;
    score: number;
    holding_score: number;
    holding_multiplier: number;
    bonus_score: number;
    purchase_score: number;
    lock_score: number;
    balance: number;
    locked: number;
    rank: number;
    holdingMultiplier?: number;
}

type Season = 'season_one' | 'season_two';

/* ─── Helpers ─── */
function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatScore(n: number): string {
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function shortenWallet(wallet: string): string {
    if (wallet.length <= 12) return wallet;
    return wallet.slice(0, 6) + '...' + wallet.slice(-4);
}

function getLockedPercent(balance: number, locked: number): number {
    const total = balance + locked;
    if (total === 0) return 0;
    return Math.round((locked / total) * 100);
}

function getRankEmoji(rank: number): string {
    if (rank === 1) return ' 🏆';
    if (rank === 2) return ' 🥈';
    if (rank === 3) return ' 🥉';
    return '';
}

function getRankDiamonds(rank: number): string {
    if (rank === 1) return '💎💎💎 ';
    if (rank === 2) return '💎💎 ';
    if (rank === 3) return '💎 ';
    return '';
}

/* ─── Season One Table ─── */
function SeasonOneTable({ data, loading }: { data: SeasonOneEntry[]; loading: boolean }) {
    const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

    async function copyWallet(wallet: string) {
        await navigator.clipboard.writeText(wallet);
        setCopiedWallet(wallet);
        setTimeout(() => setCopiedWallet(null), 2000);
    }

    if (loading) {
        return (
            <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#00f7ff' }} />
                <p className="text-lg" style={{ color: 'rgba(0, 247, 255, 0.6)' }}>
                    Calculating time-weighted scores from the abyss...
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-sm tracking-wider uppercase border-b" style={{ color: '#00d4ff', borderColor: 'rgba(0, 200, 255, 0.15)' }}>
                        <th className="py-4 px-4">Rank</th>
                        <th className="py-4 px-4">Wallet</th>
                        <th className="py-4 px-4 text-right hidden sm:table-cell">Balance</th>
                        <th className="py-4 px-4 text-right">Time-Weighted Score</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((entry) => (
                        <motion.tr
                            key={entry.wallet}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: entry.rank * 0.02 }}
                            className="border-b transition-colors duration-200"
                            style={{ borderColor: 'rgba(0, 200, 255, 0.08)' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 200, 255, 0.06)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <td className="py-5 px-4">
                                <span
                                    className="text-2xl font-bold"
                                    style={{
                                        color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : '#00d4ff',
                                        textShadow: entry.rank <= 3 ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none',
                                    }}
                                >
                                    {entry.rank}{getRankEmoji(entry.rank)}
                                </span>
                            </td>
                            <td className="py-5 px-4">
                                <button
                                    onClick={() => copyWallet(entry.wallet)}
                                    className="flex items-center gap-2 text-sm transition-colors duration-200 underline"
                                    style={{
                                        color: 'rgba(200, 240, 255, 0.9)',
                                        textDecorationColor: 'rgba(0, 212, 255, 0.3)',
                                    }}
                                >
                                    <span className="hidden md:inline">{entry.wallet}</span>
                                    <span className="md:hidden">{shortenWallet(entry.wallet)}</span>
                                    {copiedWallet === entry.wallet ? (
                                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#00e68a' }} />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 shrink-0 opacity-40" />
                                    )}
                                </button>
                            </td>
                            <td className="py-5 px-4 text-right hidden sm:table-cell text-xl font-bold" style={{ color: '#fff' }}>
                                {formatNumber(entry.balance)}
                            </td>
                            <td className="py-5 px-4 text-right font-medium" style={{ color: '#00d4ff' }}>
                                <span className={entry.rank <= 3 ? 'text-lg font-bold' : ''} style={entry.rank <= 3 ? { color: '#ffe066' } : {}}>
                                    {formatScore(entry.score)}
                                </span>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ─── Season Two Table ─── */
function SeasonTwoTable({ data, loading, totalHolders }: { data: SeasonTwoEntry[]; loading: boolean; totalHolders: number }) {
    const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

    async function copyWallet(wallet: string) {
        await navigator.clipboard.writeText(wallet);
        setCopiedWallet(wallet);
        setTimeout(() => setCopiedWallet(null), 2000);
    }

    if (loading) {
        return (
            <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#00f7ff' }} />
                <p className="text-lg" style={{ color: 'rgba(0, 247, 255, 0.6)' }}>
                    Calculating time-weighted scores from the abyss...
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-8 text-xl" style={{ color: 'rgba(0, 212, 255, 0.8)' }}>
                Total Season 2 Eligible Holders:{' '}
                <span className="font-bold text-2xl" style={{ color: '#00d4ff' }}>
                    {totalHolders > 0 ? formatScore(totalHolders) : '—'}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-sm tracking-wider uppercase border-b" style={{ color: '#00d4ff', borderColor: 'rgba(0, 200, 255, 0.15)' }}>
                            <th className="py-4 px-4">Rank</th>
                            <th className="py-4 px-4">Wallet</th>
                            <th className="py-4 px-4 text-right hidden sm:table-cell">Balance</th>
                            <th className="py-4 px-4 text-right hidden sm:table-cell">Locked</th>
                            <th className="py-4 px-4 text-right">Time-Weighted Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((entry) => {
                            const lockedPct = getLockedPercent(entry.balance, entry.locked);
                            const multiplier = entry.holding_multiplier || entry.holdingMultiplier || 1;
                            return (
                                <motion.tr
                                    key={entry.wallet}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: Math.min(entry.rank * 0.02, 1) }}
                                    className="border-b transition-colors duration-200"
                                    style={{ borderColor: 'rgba(0, 200, 255, 0.08)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 200, 255, 0.06)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <td className="py-5 px-4">
                                        <span
                                            className="text-2xl font-bold"
                                            style={{
                                                color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : '#00d4ff',
                                                textShadow: entry.rank <= 3 ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none',
                                            }}
                                        >
                                            {entry.rank}{getRankEmoji(entry.rank)}
                                        </span>
                                    </td>
                                    <td className="py-5 px-4">
                                        <button
                                            onClick={() => copyWallet(entry.wallet)}
                                            className="flex items-center gap-2 text-sm transition-colors duration-200 underline"
                                            style={{
                                                color: 'rgba(200, 240, 255, 0.9)',
                                                textDecorationColor: 'rgba(0, 212, 255, 0.3)',
                                            }}
                                        >
                                            <span className="hidden md:inline">{entry.wallet}</span>
                                            <span className="md:hidden">{shortenWallet(entry.wallet)}</span>
                                            {copiedWallet === entry.wallet ? (
                                                <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#00e68a' }} />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5 shrink-0 opacity-40" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-5 px-4 text-right hidden sm:table-cell text-xl font-bold" style={{ color: '#fff' }}>
                                        {formatNumber(entry.balance + entry.locked)}
                                    </td>
                                    <td className="py-5 px-4 text-right hidden sm:table-cell text-xl font-bold" style={{ color: '#fff' }}>
                                        {lockedPct}%
                                    </td>
                                    <td className="py-5 px-4 text-right font-medium" style={{ color: '#00d4ff' }}>
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={entry.rank <= 3 ? 'text-lg font-bold' : ''} style={entry.rank <= 3 ? { color: '#ffe066' } : {}}>
                                                <span className="hidden sm:inline">{getRankDiamonds(entry.rank)}</span>
                                                {formatScore(entry.score)}
                                            </span>
                                            <span
                                                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                                                style={{
                                                    background: '#ffe066',
                                                    color: '#1a1100',
                                                }}
                                            >
                                                {multiplier}x
                                            </span>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ─── Search Result Card ─── */
function SearchResultCard({ data, season }: { data: SeasonTwoEntry | SeasonOneEntry | null; season: Season }) {
    if (!data) return null;

    const isSeason2 = season === 'season_two';
    const s2 = data as SeasonTwoEntry;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl"
            style={{
                background: 'rgba(0, 247, 255, 0.04)',
                border: '1px solid rgba(0, 247, 255, 0.15)',
            }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5" style={{ color: '#ffd700' }} />
                <h3 className="font-cartoon text-lg" style={{ color: '#00d4ff' }}>
                    Your Rank: #{data.rank}
                </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'rgba(0, 212, 255, 0.5)' }}>Score</p>
                    <p className="text-xl font-bold" style={{ color: '#ffe066' }}>{formatScore(data.score)}</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'rgba(0, 212, 255, 0.5)' }}>Balance</p>
                    <p className="text-xl font-bold" style={{ color: '#e8f4ff' }}>{formatNumber(data.balance)}</p>
                </div>
                {isSeason2 && (
                    <>
                        <div>
                            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'rgba(0, 212, 255, 0.5)' }}>Locked</p>
                            <p className="text-xl font-bold" style={{ color: '#e8f4ff' }}>{formatNumber(s2.locked)}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'rgba(0, 212, 255, 0.5)' }}>Multiplier</p>
                            <p className="text-xl font-bold" style={{ color: '#ffe066' }}>{s2.holding_multiplier || 1}x</p>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}

/* ─── Main Page ─── */
export default function LeaderboardPage() {
    const [season, setSeason] = useState<Season>('season_two');
    const [seasonOneData, setSeasonOneData] = useState<SeasonOneEntry[]>([]);
    const [seasonTwoData, setSeasonTwoData] = useState<SeasonTwoEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchWallet, setSearchWallet] = useState('');
    const [searchResult, setSearchResult] = useState<SeasonTwoEntry | SeasonOneEntry | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async (s: Season) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/leaderboard?season=${s}`);
            const json = await res.json();
            if (json.data) {
                if (s === 'season_one') {
                    setSeasonOneData(json.data);
                } else {
                    setSeasonTwoData(json.data);
                }
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard(season);
        const interval = setInterval(() => fetchLeaderboard(season), 60000);
        return () => clearInterval(interval);
    }, [season, fetchLeaderboard]);

    async function handleSearch() {
        if (!searchWallet.trim()) return;
        setSearchLoading(true);
        setSearchError(null);
        setSearchResult(null);
        try {
            const res = await fetch(`/api/leaderboard?season=${season}&wallet=${searchWallet.trim()}`);
            const json = await res.json();
            if (json.data) {
                setSearchResult(json.data);
            } else {
                setSearchError('Wallet not found on the leaderboard.');
            }
        } catch {
            setSearchError('Failed to search. Please try again.');
        } finally {
            setSearchLoading(false);
        }
    }

    const totalHolders = seasonTwoData.length;

    return (
        <main className="relative min-h-screen overflow-hidden">
            <BubbleBackground count={12} />
            <Header />

            <div className="relative z-10 pt-28 pb-16 px-4">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-6"
                >
                    <h1 className="font-cartoon text-4xl md:text-5xl tracking-wider" style={{ color: '#fff', textShadow: '0 0 10px rgba(0, 247, 255, 0.5)' }}>
                        $<span style={{ color: '#00d4ff' }}>WHITE</span>WHALE Holders
                    </h1>
                </motion.div>

                {/* Season Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex items-center justify-center gap-3 mb-8"
                >
                    <button
                        onClick={() => { setSeason('season_one'); setSearchResult(null); setSearchError(null); }}
                        className="season-tab font-body"
                        data-active={season === 'season_one' ? 'true' : 'false'}
                    >
                        Season One
                    </button>
                    <button
                        onClick={() => { setSeason('season_two'); setSearchResult(null); setSearchError(null); }}
                        className="season-tab font-body"
                        data-active={season === 'season_two' ? 'true' : 'false'}
                    >
                        Season Two
                    </button>
                </motion.div>

                {/* Main Glass Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="max-w-6xl mx-auto glass-card p-6 md:p-8"
                >
                    {/* Search */}
                    <div className="mb-6">
                        <label className="text-[11px] font-semibold tracking-wider uppercase mb-2 block font-body" style={{ color: 'rgba(232, 244, 255, 0.4)' }}>
                            Search Your Wallet
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(232, 244, 255, 0.3)' }} />
                                <input
                                    type="text"
                                    placeholder="Enter your Solana wallet address..."
                                    value={searchWallet}
                                    onChange={(e) => setSearchWallet(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="input-field pl-10"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={searchLoading || !searchWallet.trim()}
                                className="btn-neon px-6 flex items-center gap-2 shrink-0"
                            >
                                {searchLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                                Search
                            </button>
                        </div>
                        {searchError && (
                            <p className="text-sm mt-2" style={{ color: '#ff4d6a' }}>{searchError}</p>
                        )}
                    </div>

                    {/* Search Result */}
                    <AnimatePresence>
                        {searchResult && <SearchResultCard data={searchResult} season={season} />}
                    </AnimatePresence>

                    {/* Title */}
                    <h2 className="font-cartoon text-3xl md:text-5xl text-center mb-4" style={{ color: '#fff', textShadow: '0 5px 5px rgba(0,0,0,0.8)' }}>
                        TOP 50 <span style={{ color: '#00d4ff' }}>BY TIME-WEIGHTED SCORE</span>
                    </h2>

                    {/* Table */}
                    {season === 'season_one' ? (
                        <SeasonOneTable data={seasonOneData} loading={loading} />
                    ) : (
                        <SeasonTwoTable data={seasonTwoData} loading={loading} totalHolders={totalHolders} />
                    )}
                </motion.div>

                {/* Footer links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="flex items-center justify-center gap-6 mt-8"
                >
                    <a
                        href="https://x.com/i/communities/1997736986749124846"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="header-nav-link font-body text-sm"
                    >
                        Community
                    </a>
                    <a
                        href="https://x.com/TheWhiteWhaleV2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="header-nav-link font-body text-sm"
                    >
                        The White Whale
                    </a>
                </motion.div>
            </div>
        </main>
    );
}
