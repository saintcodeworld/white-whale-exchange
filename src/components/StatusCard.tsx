'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Radio,
    ArrowRight,
    ExternalLink,
    RotateCcw,
} from 'lucide-react';

interface StatusCardProps {
    transactionId: string;
    fromCurrency: string;
    onReset: () => void;
}

type StatusType = 'new' | 'waiting' | 'confirming' | 'exchanging' | 'sending' | 'finished' | 'failed' | 'refunded' | 'verifying';

const STATUS_STEPS: { key: StatusType; label: string }[] = [
    { key: 'waiting', label: 'Waiting for Deposit' },
    { key: 'confirming', label: 'Confirming' },
    { key: 'exchanging', label: 'Exchanging' },
    { key: 'sending', label: 'Sending' },
    { key: 'finished', label: 'Complete' },
];

function getStepIndex(status: StatusType): number {
    const map: Record<string, number> = {
        new: 0,
        waiting: 0,
        confirming: 1,
        exchanging: 2,
        sending: 3,
        finished: 4,
        failed: -1,
        refunded: -1,
        verifying: 1,
    };
    return map[status] ?? 0;
}

export default function StatusCard({ transactionId, fromCurrency, onReset }: StatusCardProps) {
    const [status, setStatus] = useState<StatusType>('waiting');
    const [amountReceive, setAmountReceive] = useState<number | null>(null);
    const [payoutHash, setPayoutHash] = useState<string | null>(null);
    const [polling, setPolling] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/exchange/get-status?id=${transactionId}`);
            const data = await res.json();
            if (data.status) {
                setStatus(data.status);
                if (data.amountReceive) setAmountReceive(data.amountReceive);
                if (data.payoutHash) setPayoutHash(data.payoutHash);
                if (['finished', 'failed', 'refunded'].includes(data.status)) {
                    setPolling(false);
                }
            }
        } catch {
            // continue polling
        }
    }, [transactionId]);

    useEffect(() => {
        if (!polling) return;
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [polling, fetchStatus]);

    const currentStep = getStepIndex(status);
    const isFailed = status === 'failed' || status === 'refunded';
    const isFinished = status === 'finished';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[480px] mx-auto"
        >
            <div className="glass-card hex-accent p-6 md:p-8">
                <div className="absolute inset-0 hex-grid-bg opacity-30 pointer-events-none rounded-[20px]" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="font-cartoon text-xl tracking-wide glow-text">
                                {isFailed ? 'FAILED' : isFinished ? 'COMPLETE' : 'PROCESSING'}
                            </h2>
                            <p className="text-xs mt-1 font-body" style={{ color: 'rgba(232, 244, 255, 0.4)' }}>
                                Transaction ID: {transactionId.slice(0, 12)}...
                            </p>
                        </div>
                        <div className="relative">
                            {!isFinished && !isFailed && (
                                <>
                                    <div
                                        className="absolute inset-0 rounded-full sonar-pulse"
                                        style={{ background: 'rgba(0, 247, 255, 0.15)' }}
                                    />
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center relative"
                                        style={{
                                            background: 'rgba(0, 247, 255, 0.1)',
                                            border: '2px solid rgba(0, 247, 255, 0.3)',
                                        }}
                                    >
                                        <Radio className="w-5 h-5" style={{ color: '#00f7ff' }} />
                                    </div>
                                </>
                            )}
                            {isFinished && (
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'rgba(0, 230, 138, 0.1)',
                                        border: '2px solid rgba(0, 230, 138, 0.3)',
                                    }}
                                >
                                    <CheckCircle2 className="w-6 h-6" style={{ color: '#00e68a' }} />
                                </div>
                            )}
                            {isFailed && (
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'rgba(255, 77, 106, 0.1)',
                                        border: '2px solid rgba(255, 77, 106, 0.3)',
                                    }}
                                >
                                    <XCircle className="w-6 h-6" style={{ color: '#ff4d6a' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-8">
                        {STATUS_STEPS.map((step, i) => {
                            const isActive = i === currentStep && !isFailed;
                            const isDone = i < currentStep || isFinished;
                            const isPending = i > currentStep;

                            return (
                                <div key={step.key} className="flex items-start gap-4">
                                    {/* Dot + Line */}
                                    <div className="flex flex-col items-center">
                                        <motion.div
                                            animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                                            transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
                                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                            style={{
                                                borderColor: isDone
                                                    ? '#00e68a'
                                                    : isActive
                                                        ? '#00f7ff'
                                                        : 'rgba(232, 244, 255, 0.15)',
                                                background: isDone
                                                    ? 'rgba(0, 230, 138, 0.2)'
                                                    : isActive
                                                        ? 'rgba(0, 247, 255, 0.2)'
                                                        : 'transparent',
                                                boxShadow: isActive ? '0 0 12px rgba(0, 247, 255, 0.4)' : 'none',
                                            }}
                                        >
                                            {isDone && (
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00e68a' }} />
                                            )}
                                            {isActive && (
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00f7ff' }} />
                                            )}
                                        </motion.div>
                                        {i < STATUS_STEPS.length - 1 && (
                                            <div
                                                className="w-0.5 h-8"
                                                style={{
                                                    background: isDone
                                                        ? 'rgba(0, 230, 138, 0.3)'
                                                        : 'rgba(232, 244, 255, 0.08)',
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="pt-0.5 pb-4">
                                        <p
                                            className="text-sm font-medium font-body"
                                            style={{
                                                color: isDone
                                                    ? '#00e68a'
                                                    : isActive
                                                        ? '#e8f4ff'
                                                        : 'rgba(232, 244, 255, 0.25)',
                                            }}
                                        >
                                            {step.label}
                                        </p>
                                        {isActive && !isFailed && (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                                                <span className="text-[11px]" style={{ color: 'rgba(232, 244, 255, 0.4)' }}>
                                                    In progress...
                                                </span>
                                            </div>
                                        )}
                                        {isDone && isFinished && step.key === 'finished' && amountReceive && (
                                            <p className="text-xs mt-1" style={{ color: 'rgba(0, 230, 138, 0.7)' }}>
                                                Received ≈ {amountReceive.toLocaleString()} $WHITEWHALE
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Bar */}
                    {!isFailed && (
                        <div className="mb-6">
                            <div
                                className="w-full h-1.5 rounded-full overflow-hidden"
                                style={{ background: 'rgba(232, 244, 255, 0.06)' }}
                            >
                                <motion.div
                                    className="h-full rounded-full progress-fill"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${isFinished ? 100 : (currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Failed State */}
                    {isFailed && (
                        <div
                            className="rounded-xl p-4 mb-6 text-sm"
                            style={{
                                background: 'rgba(255, 77, 106, 0.06)',
                                border: '1px solid rgba(255, 77, 106, 0.12)',
                                color: '#ff4d6a',
                            }}
                        >
                            <p className="font-medium mb-1">Transaction {status === 'refunded' ? 'Refunded' : 'Failed'}</p>
                            <p className="text-xs" style={{ color: 'rgba(255, 77, 106, 0.7)' }}>
                                {status === 'refunded'
                                    ? 'Your funds have been returned to the sender address.'
                                    : 'The exchange could not be completed. Please try again.'}
                            </p>
                        </div>
                    )}

                    {/* Completed Payout Hash */}
                    {isFinished && payoutHash && (
                        <a
                            href={`https://solscan.io/tx/${payoutHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm font-medium transition-all duration-200"
                            style={{
                                background: 'rgba(0, 230, 138, 0.06)',
                                border: '1px solid rgba(0, 230, 138, 0.15)',
                                color: '#00e68a',
                            }}
                        >
                            <ExternalLink className="w-4 h-4" />
                            View on Solscan
                        </a>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {(isFinished || isFailed) && (
                            <button
                                onClick={onReset}
                                className="btn-neon flex-1 text-sm flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                New Swap
                            </button>
                        )}
                        {!isFinished && !isFailed && (
                            <button
                                onClick={fetchStatus}
                                className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 font-body"
                                style={{
                                    background: 'rgba(0, 247, 255, 0.06)',
                                    border: '1px solid rgba(0, 247, 255, 0.1)',
                                    color: 'rgba(232, 244, 255, 0.7)',
                                }}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Status
                            </button>
                        )}
                    </div>

                    {/* Timer Notice */}
                    {!isFinished && !isFailed && (
                        <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px]" style={{ color: 'rgba(232, 244, 255, 0.3)' }}>
                            <Clock className="w-3 h-3" />
                            Auto-refreshing every 10 seconds
                        </div>
                    )}
                </div>

                {/* Armored corners */}
                <div className="absolute top-0 left-0 w-6 h-6 pointer-events-none" style={{ borderTop: '2px solid rgba(0, 242, 255, 0.3)', borderLeft: '2px solid rgba(0, 242, 255, 0.3)', borderTopLeftRadius: '20px' }} />
                <div className="absolute top-0 right-0 w-6 h-6 pointer-events-none" style={{ borderTop: '2px solid rgba(0, 242, 255, 0.3)', borderRight: '2px solid rgba(0, 242, 255, 0.3)', borderTopRightRadius: '20px' }} />
                <div className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none" style={{ borderBottom: '2px solid rgba(0, 242, 255, 0.3)', borderLeft: '2px solid rgba(0, 242, 255, 0.3)', borderBottomLeftRadius: '20px' }} />
                <div className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none" style={{ borderBottom: '2px solid rgba(0, 242, 255, 0.3)', borderRight: '2px solid rgba(0, 242, 255, 0.3)', borderBottomRightRadius: '20px' }} />
            </div>
        </motion.div>
    );
}
