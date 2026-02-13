import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'treasury-fee-log.json');

interface FeeTopUpEntry {
    timestamp: string;
    transactionId: string;
    fromCurrency: string;
    fromAmount: number;
    walletAddress: string;
    changeNowSolAmount: number;
    pureMarketSolAmount: number;
    treasuryTopUpSol: number;
}

export async function POST(req: NextRequest) {
    try {
        const body: FeeTopUpEntry = await req.json();

        const {
            transactionId,
            fromCurrency,
            fromAmount,
            walletAddress,
            changeNowSolAmount,
            pureMarketSolAmount,
            treasuryTopUpSol,
        } = body;

        if (!transactionId || !fromCurrency || !fromAmount || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const entry: FeeTopUpEntry = {
            timestamp: new Date().toISOString(),
            transactionId,
            fromCurrency,
            fromAmount,
            walletAddress,
            changeNowSolAmount,
            pureMarketSolAmount,
            treasuryTopUpSol,
        };

        // Read existing log or create new array
        let log: FeeTopUpEntry[] = [];
        try {
            const existing = await fs.readFile(LOG_FILE, 'utf-8');
            log = JSON.parse(existing);
        } catch {
            // File doesn't exist yet — start fresh
        }

        log.push(entry);
        await fs.writeFile(LOG_FILE, JSON.stringify(log, null, 2));

        console.log(
            `[Treasury Fee] TX: ${transactionId} | ${fromAmount} ${fromCurrency.toUpperCase()} | ` +
            `ChangeNow delivers: ${changeNowSolAmount} SOL | Pure rate: ${pureMarketSolAmount.toFixed(6)} SOL | ` +
            `Treasury top-up needed: ${treasuryTopUpSol.toFixed(6)} SOL`
        );

        return NextResponse.json({ success: true, entry });
    } catch (error) {
        console.error('Error logging fee top-up:', error);
        return NextResponse.json(
            { error: 'Failed to log fee top-up' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const existing = await fs.readFile(LOG_FILE, 'utf-8');
        const log = JSON.parse(existing);
        return NextResponse.json({ log });
    } catch {
        return NextResponse.json({ log: [] });
    }
}
