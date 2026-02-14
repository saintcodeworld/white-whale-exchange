'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowDownUp,
    ChevronDown,
    AlertTriangle,
    Lock,
    Loader2,
    Copy,
    Check,
    Wallet,
    Zap,
    ArrowRight,
    Info,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES, WHITEWHALE } from '@/lib/types';
import type { SwapState } from '@/lib/types';
import { isValidSolanaAddress } from '@/lib/constants';
import StatusCard from './StatusCard';

export default function SwapWidget() {
    const [state, setState] = useState<SwapState>({
        stage: 'estimate',
        fromCurrency: 'sol',
        fromAmount: '',
        estimatedAmount: '',
        walletAddress: '',
        minAmount: null,
        transactionId: null,
        payinAddress: null,
        payinExtraId: null,
        status: null,
    });

    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [minAmountLoading, setMinAmountLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addressValid, setAddressValid] = useState<boolean | null>(null);
    const [copied, setCopied] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // DexScreener live price data
    const [whalePrice, setWhalePrice] = useState<number | null>(null);
    const [whalePriceChange24h, setWhalePriceChange24h] = useState<number | null>(null);
    const [whalePriceLoading, setWhalePriceLoading] = useState(true);

    // Live market prices from CoinGecko (pure rates, no exchange fees)
    const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});

    const selectedCurrency = SUPPORTED_CURRENCIES.find(
        (c) => c.ticker === state.fromCurrency
    )!;

    // Fetch WhiteWhale price from DexScreener on mount and every 30s
    useEffect(() => {
        async function fetchWhalePrice() {
            try {
                const res = await fetch('/api/dexscreener');
                const data = await res.json();
                if (data.priceUsd) {
                    setWhalePrice(parseFloat(data.priceUsd));
                }
                if (data.priceChange?.h24 !== undefined) {
                    setWhalePriceChange24h(data.priceChange.h24);
                }
            } catch {
                // silently fail
            } finally {
                setWhalePriceLoading(false);
            }
        }
        fetchWhalePrice();
        const interval = setInterval(fetchWhalePrice, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch live market prices from CoinGecko on mount and every 60s
    useEffect(() => {
        async function fetchMarketPrices() {
            try {
                const res = await fetch('/api/exchange/get-market-prices');
                const data = await res.json();
                if (data.prices) {
                    setMarketPrices(data.prices);
                }
            } catch {
                // silently fail — fallback prices will be used
            }
        }
        fetchMarketPrices();
        const interval = setInterval(fetchMarketPrices, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowCurrencyDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Fetch min amount when currency changes (skip for SOL — no ChangeNow exchange needed)
    useEffect(() => {
        if (state.fromCurrency === 'sol') {
            setState((s) => ({ ...s, minAmount: null }));
            return;
        }
        async function fetchMinAmount() {
            setMinAmountLoading(true);
            try {
                const res = await fetch(
                    `/api/exchange/get-min-amount?from=${state.fromCurrency}&to=sol`
                );
                const data = await res.json();
                if (data.minAmount) {
                    setState((s) => ({ ...s, minAmount: data.minAmount }));
                }
            } catch {
                // silently fail — user can still type
            } finally {
                setMinAmountLoading(false);
            }
        }
        fetchMinAmount();
    }, [state.fromCurrency]);

    // Fallback USD prices in case CoinGecko hasn't loaded yet
    const fallbackUsdPrices: Record<string, number> = {
        btc: 97000,
        eth: 2600,
        sol: 80,
        usdc: 1,
        usdt: 1,
        bnb: 650,
        xrp: 2.4,
        doge: 0.17,
        matic: 0.42,
        ltc: 100,
    };

    // Estimate amount with debounce — uses pure market rate (no ChangeNow fees)
    const fetchEstimate = useCallback(
        async (amount: string, from: string) => {
            if (!amount || parseFloat(amount) <= 0) {
                setState((s) => ({ ...s, estimatedAmount: '' }));
                return;
            }
            setEstimateLoading(true);
            setError(null);
            try {
                // Check min amount only for non-SOL currencies (ChangeNow can't exchange sol_sol)
                if (from !== 'sol') {
                    const res = await fetch(
                        `/api/exchange/get-min-amount?from=${from}&to=sol`
                    );
                    const minData = await res.json();

                    if (minData.minAmount && parseFloat(amount) < minData.minAmount) {
                        setError(`Minimum amount is ${minData.minAmount} ${from.toUpperCase()}`);
                        setState((s) => ({ ...s, estimatedAmount: '' }));
                        setEstimateLoading(false);
                        return;
                    }
                }

                if (!whalePrice || whalePrice <= 0) {
                    setError('WhiteWhale price not available yet. Please wait...');
                    setState((s) => ({ ...s, estimatedAmount: '' }));
                    setEstimateLoading(false);
                    return;
                }

                // Pure market rate: use live CoinGecko price, fall back to hardcoded
                const inputUsdPrice = marketPrices[from] || fallbackUsdPrices[from] || 1;
                const totalUsdValue = parseFloat(amount) * inputUsdPrice;
                const estimatedTokens = totalUsdValue / whalePrice;

                const estimated = estimatedTokens.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                });
                setState((s) => ({ ...s, estimatedAmount: estimated }));
            } catch {
                setError('Failed to fetch estimate');
            } finally {
                setEstimateLoading(false);
            }
        },
        [whalePrice, marketPrices]
    );

    function handleAmountChange(value: string) {
        // Allow only numbers and one decimal
        const cleaned = value.replace(/[^0-9.]/g, '');
        if (cleaned.split('.').length > 2) return;
        setState((s) => ({ ...s, fromAmount: cleaned }));
        setError(null);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchEstimate(cleaned, state.fromCurrency);
        }, 500);
    }

    function handleAddressChange(value: string) {
        setState((s) => ({ ...s, walletAddress: value }));
        if (value.length > 0) {
            setAddressValid(isValidSolanaAddress(value));
        } else {
            setAddressValid(null);
        }
    }

    function handleCurrencySelect(ticker: string) {
        setState((s) => ({ ...s, fromCurrency: ticker, fromAmount: '', estimatedAmount: '' }));
        setShowCurrencyDropdown(false);
        setError(null);
    }

    async function handleSwap() {
        if (!state.fromAmount || parseFloat(state.fromAmount) <= 0) {
            setError('Please enter an amount');
            return;
        }
        if (!state.walletAddress || !isValidSolanaAddress(state.walletAddress)) {
            setError('Please enter a valid Solana address');
            return;
        }

        setCreateLoading(true);
        setError(null);

        try {
            let changeNowSolAmount = parseFloat(state.fromAmount);
            let pureMarketSolAmount = parseFloat(state.fromAmount);
            let treasuryTopUp = 0;

            // Only query ChangeNow exchange amount when from != sol
            // (ChangeNow can't exchange a currency to itself)
            if (state.fromCurrency !== 'sol') {
                // 1. Get the ChangeNow exchange amount (what they'll actually deliver after their fee)
                const exchangeRes = await fetch(
                    `/api/exchange/get-exchange-amount?from=${state.fromCurrency}&to=sol&amount=${state.fromAmount}`
                );
                const exchangeData = await exchangeRes.json();

                if (exchangeData.error) {
                    setError(exchangeData.error);
                    setCreateLoading(false);
                    return;
                }

                changeNowSolAmount = exchangeData.estimatedAmount; // SOL after ChangeNow fees

                // 2. Calculate pure market rate SOL amount (no fees)
                const inputUsdPrice = marketPrices[state.fromCurrency] || fallbackUsdPrices[state.fromCurrency] || 1;
                const solUsdPrice = marketPrices['sol'] || fallbackUsdPrices['sol'] || 80;
                pureMarketSolAmount = (parseFloat(state.fromAmount) * inputUsdPrice) / solUsdPrice;

                // 3. Fee difference the treasury needs to cover (in SOL)
                treasuryTopUp = Math.max(0, pureMarketSolAmount - changeNowSolAmount);
            }

            // 4. Create the ChangeNow transaction (skip for SOL — user sends SOL directly)
            if (state.fromCurrency === 'sol') {
                // No ChangeNow exchange needed — SOL is sent directly to buy WHITEWHALE
                setState((s) => ({
                    ...s,
                    stage: 'deposit',
                    transactionId: null,
                    payinAddress: state.walletAddress,
                    payinExtraId: null,
                }));
                return;
            }

            const res = await fetch('/api/exchange/create-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: state.fromCurrency,
                    to: 'sol',
                    amount: parseFloat(state.fromAmount),
                    address: state.walletAddress,
                }),
            });

            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            // 5. Log the fee difference for treasury reimbursement (skip if no fee difference)
            if (treasuryTopUp > 0) {
                try {
                    await fetch('/api/exchange/log-fee-topup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transactionId: data.id,
                            fromCurrency: state.fromCurrency,
                            fromAmount: parseFloat(state.fromAmount),
                            walletAddress: state.walletAddress,
                            changeNowSolAmount,
                            pureMarketSolAmount,
                            treasuryTopUpSol: treasuryTopUp,
                        }),
                    });
                } catch {
                    // Non-blocking — don't fail the swap if logging fails
                    console.error('Failed to log treasury fee top-up');
                }
            }

            setState((s) => ({
                ...s,
                stage: 'deposit',
                transactionId: data.id,
                payinAddress: data.payinAddress,
                payinExtraId: data.payinExtraId || null,
            }));
        } catch {
            setError('Failed to create transaction. Please try again.');
        } finally {
            setCreateLoading(false);
        }
    }

    function handleContinueToStatus() {
        setState((s) => ({ ...s, stage: 'status', status: 'waiting' }));
    }

    async function copyToClipboard(text: string) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleReset() {
        setState({
            stage: 'estimate',
            fromCurrency: 'sol',
            fromAmount: '',
            estimatedAmount: '',
            walletAddress: '',
            minAmount: null,
            transactionId: null,
            payinAddress: null,
            payinExtraId: null,
            status: null,
        });
        setError(null);
        setAddressValid(null);
    }

    // ─── STAGE 3: Status ────────────────────────────
    if (state.stage === 'status' && state.transactionId) {
        return (
            <StatusCard
                transactionId={state.transactionId}
                fromCurrency={state.fromCurrency}
                onReset={handleReset}
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[480px] mx-auto"
        >
            <div className="glass-card hex-accent p-6 md:p-8">
                {/* Hex grid overlay */}
                <div
                    className="absolute inset-0 hex-grid-bg opacity-30 pointer-events-none rounded-[20px]"
                    style={{ zIndex: 0 }}
                />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-cartoon text-xl tracking-wide glow-text">
                                {state.stage === 'estimate' ? 'SWAP' : 'DEPOSIT'}
                            </h2>
                            <p className="text-xs mt-1 font-body" style={{ color: 'rgba(232, 244, 255, 0.4)' }}>
                                {state.stage === 'estimate'
                                    ? 'Bridge any crypto to $WHITEWHALE'
                                    : 'Send funds to the address below'}
                            </p>
                        </div>
                        <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase font-body"
                            style={{
                                background: 'rgba(0, 247, 255, 0.08)',
                                border: '1px solid rgba(0, 247, 255, 0.15)',
                                color: '#00f7ff',
                            }}
                        >
                            <Zap className="w-3 h-3" />
                            Live
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {state.stage === 'estimate' && (
                            <motion.div
                                key="estimate"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* ─── FROM Section ─── */}
                                <div
                                    className="rounded-2xl p-4 mb-3"
                                    style={{
                                        background: 'rgba(0, 15, 35, 0.5)',
                                        border: '1px solid rgba(0, 242, 255, 0.06)',
                                    }}
                                >
                                    <label className="text-[11px] font-semibold tracking-wider uppercase mb-2.5 block" style={{ color: 'rgba(232, 244, 255, 0.4)' }}>
                                        From
                                    </label>
                                    <div className="flex items-center gap-3">
                                        {/* Currency Selector */}
                                        <div className="relative" ref={dropdownRef}>
                                            <button
                                                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200"
                                                style={{
                                                    background: 'rgba(0, 242, 255, 0.06)',
                                                    border: '1px solid rgba(0, 242, 255, 0.1)',
                                                    color: '#e8f4ff',
                                                }}
                                            >
                                                <img
                                                    src={selectedCurrency.icon}
                                                    alt={selectedCurrency.name}
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <span className="font-semibold text-sm">{selectedCurrency.symbol}</span>
                                                <ChevronDown className="w-4 h-4" style={{ color: 'rgba(232, 244, 255, 0.4)' }} />
                                            </button>

                                            {/* Dropdown */}
                                            <AnimatePresence>
                                                {showCurrencyDropdown && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="absolute top-full left-0 mt-2 w-52 rounded-xl overflow-hidden z-50"
                                                        style={{
                                                            background: 'rgba(2, 12, 30, 0.95)',
                                                            backdropFilter: 'blur(20px)',
                                                            border: '1px solid rgba(0, 242, 255, 0.12)',
                                                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                                                        }}
                                                    >
                                                        <div className="p-1.5 max-h-64 overflow-y-auto">
                                                            {SUPPORTED_CURRENCIES.map((c) => (
                                                                <button
                                                                    key={c.ticker}
                                                                    onClick={() => handleCurrencySelect(c.ticker)}
                                                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200"
                                                                    style={{
                                                                        color: '#e8f4ff',
                                                                        background:
                                                                            c.ticker === state.fromCurrency
                                                                                ? 'rgba(0, 242, 255, 0.1)'
                                                                                : 'transparent',
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (c.ticker !== state.fromCurrency) {
                                                                            e.currentTarget.style.background = 'rgba(0, 242, 255, 0.05)';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (c.ticker !== state.fromCurrency) {
                                                                            e.currentTarget.style.background = 'transparent';
                                                                        }
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={c.icon}
                                                                        alt={c.name}
                                                                        className="w-7 h-7 rounded-full"
                                                                    />
                                                                    <div className="text-left">
                                                                        <div className="text-sm font-semibold">{c.symbol}</div>
                                                                        <div className="text-[10px]" style={{ color: 'rgba(232, 244, 255, 0.35)' }}>
                                                                            {c.name}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Amount Input */}
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            value={state.fromAmount}
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-right text-2xl font-semibold font-body"
                                            style={{ color: '#e8f4ff', caretColor: '#00f7ff' }}
                                        />
                                    </div>
                                    {state.minAmount && !minAmountLoading && (
                                        <p className="text-[11px] mt-2 flex items-center gap-1" style={{ color: 'rgba(232, 244, 255, 0.35)' }}>
                                            <Info className="w-3 h-3" />
                                            Min: {state.minAmount} {selectedCurrency.symbol}
                                        </p>
                                    )}
                                </div>

                                {/* Swap Arrow */}
                                <div className="flex justify-center -my-1 relative z-10">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: 'rgba(0, 242, 255, 0.08)',
                                            border: '1px solid rgba(0, 242, 255, 0.15)',
                                        }}
                                    >
                                        <ArrowDownUp className="w-4 h-4" style={{ color: '#00f7ff' }} />
                                    </div>
                                </div>

                                {/* ─── TO Section ─── */}
                                <div
                                    className="rounded-2xl p-4 mt-3 mb-5"
                                    style={{
                                        background: 'rgba(0, 15, 35, 0.5)',
                                        border: '1px solid rgba(0, 242, 255, 0.06)',
                                    }}
                                >
                                    <label className="text-[11px] font-semibold tracking-wider uppercase mb-2.5 block" style={{ color: 'rgba(232, 244, 255, 0.4)' }}>
                                        To (Locked)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                            style={{
                                                background: 'rgba(0, 242, 255, 0.04)',
                                                border: '1px solid rgba(0, 242, 255, 0.08)',
                                            }}
                                        >
                                            <span
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.2), rgba(0, 102, 255, 0.15))',
                                                    color: '#00f2ff',
                                                }}
                                            >
                                                🐋
                                            </span>
                                            <span className="font-semibold text-sm font-body" style={{ color: '#00f7ff' }}>
                                                {WHITEWHALE.symbol}
                                            </span>
                                            <Lock className="w-3.5 h-3.5" style={{ color: 'rgba(0, 247, 255, 0.4)' }} />
                                        </div>

                                        <div className="flex-1 text-right">
                                            {estimateLoading ? (
                                                <div className="flex justify-end">
                                                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#00f7ff' }} />
                                                </div>
                                            ) : (
                                                <span className="text-2xl font-semibold" style={{ color: state.estimatedAmount ? '#e8f4ff' : 'rgba(232,244,255,0.2)' }}>
                                                    {state.estimatedAmount || '0.00'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] mt-2 font-mono truncate" style={{ color: 'rgba(232, 244, 255, 0.25)' }}>
                                        CA: {WHITEWHALE.contractAddress}
                                    </p>

                                    {/* Live price from DexScreener */}
                                    <div className="mt-3 flex items-center justify-between px-1">
                                        <div className="flex items-center gap-1.5">
                                            {whalePriceLoading ? (
                                                <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#00f7ff' }} />
                                            ) : whalePrice ? (
                                                <>
                                                    <span className="text-[11px] font-semibold" style={{ color: 'rgba(232, 244, 255, 0.6)' }}>
                                                        1 WHITEWHALE = ${whalePrice.toFixed(5)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-[11px]" style={{ color: 'rgba(255, 77, 106, 0.6)' }}>
                                                    Price unavailable
                                                </span>
                                            )}
                                        </div>
                                        {whalePriceChange24h !== null && (
                                            <span
                                                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: whalePriceChange24h >= 0
                                                        ? 'rgba(0, 230, 138, 0.1)'
                                                        : 'rgba(255, 77, 106, 0.1)',
                                                    color: whalePriceChange24h >= 0
                                                        ? '#00e68a'
                                                        : '#ff4d6a',
                                                }}
                                            >
                                                {whalePriceChange24h >= 0 ? '+' : ''}{whalePriceChange24h.toFixed(2)}% (24h)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* ─── Wallet Address ─── */}
                                <div className="mb-5">
                                    <label className="text-[11px] font-semibold tracking-wider uppercase mb-2 flex items-center gap-1.5" style={{ color: 'rgba(232, 244, 255, 0.4)' }}>
                                        <Wallet className="w-3.5 h-3.5" />
                                        Your Solana Wallet Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Enter Solana address..."
                                            value={state.walletAddress}
                                            onChange={(e) => handleAddressChange(e.target.value)}
                                            className="input-field pr-10"
                                            style={{
                                                borderColor:
                                                    addressValid === true
                                                        ? 'rgba(0, 230, 138, 0.4)'
                                                        : addressValid === false
                                                            ? 'rgba(255, 77, 106, 0.4)'
                                                            : undefined,
                                            }}
                                        />
                                        {addressValid !== null && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {addressValid ? (
                                                    <Check className="w-4 h-4" style={{ color: '#00e68a' }} />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4" style={{ color: '#ff4d6a' }} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {addressValid === false && state.walletAddress.length > 0 && (
                                        <p className="text-[11px] mt-1.5" style={{ color: '#ff4d6a' }}>
                                            Invalid Solana address format
                                        </p>
                                    )}
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
                                            style={{
                                                background: 'rgba(255, 77, 106, 0.08)',
                                                border: '1px solid rgba(255, 77, 106, 0.15)',
                                                color: '#ff4d6a',
                                            }}
                                        >
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Swap Button */}
                                <button
                                    onClick={handleSwap}
                                    disabled={
                                        createLoading ||
                                        !state.fromAmount ||
                                        !state.walletAddress ||
                                        addressValid !== true
                                    }
                                    className="btn-neon w-full text-base flex items-center justify-center gap-2"
                                >
                                    {createLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating Exchange...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" />
                                            Swap to $WHITEWHALE
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {/* ─── STAGE 2: Deposit ─── */}
                        {state.stage === 'deposit' && (
                            <motion.div
                                key="deposit"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div
                                    className="rounded-2xl p-5 mb-5"
                                    style={{
                                        background: 'rgba(0, 15, 35, 0.5)',
                                        border: '1px solid rgba(0, 242, 255, 0.08)',
                                    }}
                                >
                                    <p className="text-sm font-medium mb-4" style={{ color: 'rgba(232, 244, 255, 0.7)' }}>
                                        Send exactly <span className="font-bold" style={{ color: '#00f7ff' }}>{state.fromAmount} {selectedCurrency.symbol}</span> to:
                                    </p>

                                    {/* Deposit Address */}
                                    <div
                                        className="rounded-xl p-4 flex items-center gap-3"
                                        style={{
                                            background: 'rgba(0, 242, 255, 0.04)',
                                            border: '1px solid rgba(0, 242, 255, 0.1)',
                                        }}
                                    >
                                        <code className="flex-1 text-sm font-mono break-all" style={{ color: '#e8f4ff' }}>
                                            {state.payinAddress}
                                        </code>
                                        <button
                                            onClick={() => state.payinAddress && copyToClipboard(state.payinAddress)}
                                            className="shrink-0 p-2 rounded-lg transition-all duration-200"
                                            style={{ background: 'rgba(0, 247, 255, 0.1)' }}
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4" style={{ color: '#00e68a' }} />
                                            ) : (
                                                <Copy className="w-4 h-4" style={{ color: '#00f7ff' }} />
                                            )}
                                        </button>
                                    </div>

                                    {state.payinExtraId && (
                                        <div className="mt-3">
                                            <p className="text-[11px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: 'rgba(232, 244, 255, 0.4)' }}>
                                                Memo / Extra ID
                                            </p>
                                            <code className="text-sm font-mono" style={{ color: '#ffa726' }}>
                                                {state.payinExtraId}
                                            </code>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-xs"
                                    style={{
                                        background: 'rgba(255, 167, 38, 0.06)',
                                        border: '1px solid rgba(255, 167, 38, 0.12)',
                                        color: '#ffa726',
                                    }}
                                >
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    Send only {selectedCurrency.symbol} to this address. Other coins will be lost.
                                </div>

                                <button
                                    onClick={handleContinueToStatus}
                                    className="btn-neon w-full text-base flex items-center justify-center gap-2"
                                >
                                    I&apos;ve Sent the Funds
                                    <ArrowRight className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={handleReset}
                                    className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                                    style={{ color: 'rgba(232, 244, 255, 0.4)' }}
                                >
                                    Cancel & Start Over
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Armored corner decorations */}
                <div
                    className="absolute top-0 left-0 w-6 h-6 pointer-events-none"
                    style={{
                        borderTop: '2px solid rgba(0, 242, 255, 0.3)',
                        borderLeft: '2px solid rgba(0, 242, 255, 0.3)',
                        borderTopLeftRadius: '20px',
                    }}
                />
                <div
                    className="absolute top-0 right-0 w-6 h-6 pointer-events-none"
                    style={{
                        borderTop: '2px solid rgba(0, 242, 255, 0.3)',
                        borderRight: '2px solid rgba(0, 242, 255, 0.3)',
                        borderTopRightRadius: '20px',
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none"
                    style={{
                        borderBottom: '2px solid rgba(0, 242, 255, 0.3)',
                        borderLeft: '2px solid rgba(0, 242, 255, 0.3)',
                        borderBottomLeftRadius: '20px',
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none"
                    style={{
                        borderBottom: '2px solid rgba(0, 242, 255, 0.3)',
                        borderRight: '2px solid rgba(0, 242, 255, 0.3)',
                        borderBottomRightRadius: '20px',
                    }}
                />
            </div>
        </motion.div>
    );
}
