import { NextResponse } from 'next/server';

// CoinGecko IDs for supported currencies
const COINGECKO_IDS: Record<string, string> = {
    btc: 'bitcoin',
    eth: 'ethereum',
    sol: 'solana',
    usdc: 'usd-coin',
    usdt: 'tether',
    bnb: 'binancecoin',
    xrp: 'ripple',
    doge: 'dogecoin',
    matic: 'matic-network',
    ltc: 'litecoin',
};

export async function GET() {
    try {
        const ids = Object.values(COINGECKO_IDS).join(',');
        const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
            {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 60 }, // cache for 60 seconds
            }
        );

        if (!res.ok) {
            throw new Error(`CoinGecko API responded with ${res.status}`);
        }

        const data = await res.json();

        // Map back to ticker format
        const prices: Record<string, number> = {};
        for (const [ticker, geckoId] of Object.entries(COINGECKO_IDS)) {
            if (data[geckoId]?.usd) {
                prices[ticker] = data[geckoId].usd;
            }
        }

        return NextResponse.json({ prices });
    } catch (error) {
        console.error('Error fetching market prices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch market prices' },
            { status: 500 }
        );
    }
}
