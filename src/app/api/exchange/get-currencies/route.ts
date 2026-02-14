import { NextResponse } from 'next/server';
import { CHANGENOW_API_URL } from '@/lib/constants';

export async function GET() {
    const apiKey = process.env.CHANGENOW_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'API key not configured' },
            { status: 500 }
        );
    }

    try {
        const res = await fetch(
            `${CHANGENOW_API_URL}/currencies?active=true&fixedRate=false`,
            {
                headers: { 'Content-Type': 'application/json' },
                next: { revalidate: 300 }, // cache for 5 minutes
            }
        );

        if (!res.ok) {
            throw new Error(`ChangeNow API responded with ${res.status}`);
        }

        const data = await res.json();

        // Filter to only commonly used currencies
        const allowedTickers = ['btc', 'eth', 'sol', 'usdc', 'usdt', 'bnb', 'xrp', 'doge', 'matic', 'ltc'];
        const filtered = data.filter(
            (c: { ticker: string; isFiat: boolean }) =>
                allowedTickers.includes(c.ticker.toLowerCase()) && !c.isFiat
        );

        return NextResponse.json(filtered);
    } catch (error) {
        console.error('Error fetching currencies:', error);
        return NextResponse.json(
            { error: 'Failed to fetch currencies' },
            { status: 500 }
        );
    }
}
