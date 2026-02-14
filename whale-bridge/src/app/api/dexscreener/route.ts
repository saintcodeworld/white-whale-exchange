import { NextResponse } from 'next/server';

const WHITEWHALE_CA = 'a3W4qutoEJA4232T2gwZUfgYJTetr96pU4SJMwppump';
const DEXSCREENER_URL = `https://api.dexscreener.com/tokens/v1/solana/${WHITEWHALE_CA}`;

export async function GET() {
    try {
        const res = await fetch(DEXSCREENER_URL, {
            next: { revalidate: 30 }, // cache for 30 seconds
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch from DexScreener' },
                { status: 502 }
            );
        }

        const data = await res.json();

        // DexScreener returns an array of pairs; take the first (most liquid) one
        const pair = Array.isArray(data) ? data[0] : null;

        if (!pair) {
            return NextResponse.json(
                { error: 'No pair data found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            priceUsd: pair.priceUsd ?? null,
            priceNative: pair.priceNative ?? null, // price in SOL
            priceChange: pair.priceChange ?? {},
            volume24h: pair.volume?.h24 ?? null,
            liquidity: pair.liquidity?.usd ?? null,
            marketCap: pair.marketCap ?? null,
            fdv: pair.fdv ?? null,
            name: pair.baseToken?.name ?? 'WhiteWhale',
            symbol: pair.baseToken?.symbol ?? 'WHITEWHALE',
            imageUrl: pair.info?.imageUrl ?? null,
        });
    } catch (err) {
        console.error('DexScreener API error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
